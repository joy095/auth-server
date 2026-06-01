import { betterAuth } from "better-auth";
import type { User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin,
  bearer,
  emailOTP,
  jwt,
  multiSession,
  openAPI,
  organization,
  phoneNumber,
  twoFactor,
} from "better-auth/plugins";
import * as argon2 from "argon2";

import * as authSchema from "../db/schema/auth-schema.js";
import { sendEmail } from "./mail.js";
import { createDb } from "../db/index.js";
import { APIError } from "better-auth/api";
import {
  generatePremiumInvitationEmail,
  generatePremiumOtpEmail,
  generatePremiumResetPasswordEmail,
} from "../utils/emailTemplate.js";
import { generatePremiumSmsOtp } from "../utils/smsTemplate.js";
import { sendSMS } from "./sms.js";

// ─── Shared OTP email sender ──────────────────────────────────────────────────
// Extracted so both the hook and emailVerification can call it directly
// without any HTTP round-trip.

const otpConfigs: Record<string, { subject: string; action: string }> = {
  "sign-in": {
    subject: "Sign in to your account",
    action: "sign in",
  },
  "email-verification": {
    subject: "Verify your email address",
    action: "verify your email",
  },
  "forget-password": {
    subject: "Reset your password",
    action: "reset your password",
  },
};

async function sendOtpEmail(
  email: string,
  otp: string,
  type: string,
): Promise<void> {
  const { subject, action } = otpConfigs[type] ?? otpConfigs["sign-in"];

  sendEmail({
    to: email,
    subject,
    text: `Your verification code is: ${otp}. This code will expire in 5 minutes.`,
    html: generatePremiumOtpEmail({ title: subject, action, otp }),
  });
}

// ─── DB ───────────────────────────────────────────────────────────────────────

const db = createDb();

// ─── Auth factory ─────────────────────────────────────────────────────────────

export default function createAuth() {
  return betterAuth({
    baseURL: process.env.APP_BASE_URL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { ...authSchema },
    }),

    rateLimit: {
      enabled: false,
      window: 60,
      max: 100,
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,

      async sendResetPassword({ user, url, token }) {
        sendEmail({
          to: user.email,
          subject: "Reset your password",
          text: `Reset your password: ${url}\n\nIf you didn't request this, you can safely ignore this email.`,
          html: generatePremiumResetPasswordEmail({
            userName: user.name,
            userEmail: user.email,
            resetUrl: url,
            token: token,
          }),
        });
      },
      onSignIn: async ({ user }: { user: User }) => {
        if (!user.emailVerified) {
          throw new APIError("UNAUTHORIZED", {
            message: "Please verify your email before signing in.",
          });
        }
      },

      password: {
        hash: async (password) =>
          argon2.hash(password, { type: argon2.argon2id }),
        verify: async ({ hash: h, password }) => argon2.verify(h, password),
      },
    },

    emailVerification: {
      sendVerificationEmail: async () => {},
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh session daily if active
      freshAge: 60 * 60 * 6, // Require re-auth for sensitive ops after 6 hours
      deferSessionRefresh: true,

      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache session for 5 minutes before hitting DB again
      },
    },

    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
        },
      },
    },

    plugins: [
      bearer({}),
      ...(process.env.NODE_ENV === "development" ? [openAPI({})] : []),
      admin(),
      multiSession({
        maximumSessions: 1,
      }),

      twoFactor({
        allowPasswordless: true,
        backupCodeOptions: {
          storeBackupCodes: "encrypted", 
        },
      }),

      phoneNumber({
        sendOTP: async ({ phoneNumber, code }) => {
          const message = generatePremiumSmsOtp({
            code,
            brand: "Timezly",
            action: "verification",
            expiryMinutes: 5,
          });

          await sendSMS(phoneNumber, message);

          console.log(`SMS sent to ${phoneNumber}`);
        },

        // verifyOTP(data, ctx) {

        // },
      }),

      jwt({
        jwks: {
          keyPairConfig: { alg: "EdDSA" }, // "EdDSA" | "ES256" | "ES512" | "PS256" | "RS256"
          rotationInterval: 60 * 60 * 24 * 30,
          gracePeriod: 60 * 60 * 24 * 20,
        },
        jwt: {
          expirationTime: "15m",
        },
      }),

      emailOTP({
        // This is the single canonical place better-auth calls to deliver
        // every OTP — sign-in, email-verification, and forget-password.
        // Direct function call, no HTTP.
        async sendVerificationOTP({ email, otp, type }) {
          await sendOtpEmail(email, otp, type);
        },
        otpLength: 6,
        expiresIn: 300, // 5 minutes
        sendVerificationOnSignUp: true,
      }),

      organization({
        allowUserToCreateOrganization: true,
        requireEmailVerificationOnInvitation: true,
        membershipLimit: 5,

        teams: {
          enabled: true,
        },

        sendInvitationEmail: async ({ invitation, inviter, organization }) => {
          sendEmail({
            to: invitation.email,
            subject: `You've been invited to join ${organization.name}`,
            text: `${inviter.user.name} invited you to join ${organization.name}.`,
            html: generatePremiumInvitationEmail({
              inviterName: inviter.user.name,
              orgName: organization.name,
              invitationUrl: `${process.env.APP_BASE_URL}/accept-invitation?token=${invitation.id}`,
            }),
          });
        },
      }),
    ],

    trustedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),

    advanced: {
      disableCSRFCheck: process.env.NODE_ENV === "development",
      disableOriginCheck: process.env.NODE_ENV === "development",

      // For localhost: Don't use secure, don't use sameSite: "none"
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: false, // Must be false for HTTP localhost
      },
    },
  });
}
