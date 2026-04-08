import { betterAuth } from "better-auth";
import type { User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin,
  bearer,
  emailOTP,
  jwt,
  openAPI,
  organization,
} from "better-auth/plugins";
import * as argon2 from "argon2";

import * as authSchema from "../db/schema/auth-schema.js";
import { sendEmail } from "./mail.js";
import { createDb } from "../db/index.js";
import { APIError, createAuthMiddleware } from "better-auth/api";
/**
 * ============================================================================
 * PREMIUM EMAIL TEMPLATES
 * Enterprise-grade, minimalist design inspired by Stripe, Apple, and Notion
 * ============================================================================
 */

interface EmailTemplateParams {
  title: string;
  action: string;
  otp: string;
  timestamp?: string;
  year?: number;
}

interface InvitationTemplateParams {
  inviterName: string;
  orgName: string;
  invitationUrl: string;
  year?: number;
}

function generatePremiumOtpEmail(params: EmailTemplateParams): string {
  const {
    title,
    action,
    otp,
    timestamp = new Date().toLocaleString(),
    year = new Date().getFullYear(),
  } = params;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }

        body {
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        @media (prefers-color-scheme: dark) {
            .email-wrapper { background-color: #111111 !important; }
            .email-content { background-color: #1a1a1a !important; border-color: #2a2a2a !important; }
            .text-primary { color: #ffffff !important; }
            .text-secondary { color: #a0a0a0 !important; }
            .text-muted { color: #666666 !important; }
            .code-box { background-color: #242424 !important; border-color: #333333 !important; }
            .divider { border-color: #2a2a2a !important; }
            .footer { background-color: #111111 !important; border-color: #2a2a2a !important; }
        }

        @media screen and (max-width: 600px) {
            .email-content { width: 100% !important; max-width: 100% !important; }
            .content-padding { padding: 40px 24px !important; }
            .header-padding { padding: 48px 24px 32px !important; }
            .code-display { font-size: 36px !important; letter-spacing: 8px !important; }
            .heading { font-size: 24px !important; line-height: 32px !important; }
        }

        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
        #outlook a { padding: 0; }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#fafafa;">

    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
        Your verification code is ${otp}. This code will expire in 5 minutes.
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-wrapper" style="background-color:#fafafa;">
        <tr>
            <td align="center" style="padding:60px 20px;">

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-content" style="max-width:600px; background-color:#ffffff; border-radius:12px; border:1px solid #e5e5e5; overflow:hidden;">

                    <tr>
                        <td class="header-padding" style="padding:56px 48px 40px; text-align:center;">

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 32px;">
                                <tr>
                                    <td style="width:48px; height:48px; background:linear-gradient(135deg, #000000 0%, #333333 100%); border-radius:10px; text-align:center; vertical-align:middle;">
                                        <span style="color:#ffffff; font-size:24px; font-weight:600; letter-spacing:-0.5px;">⚡</span>
                                    </td>
                                </tr>
                            </table>

                            <h1 class="heading text-primary" style="margin:0; font-size:28px; font-weight:600; line-height:36px; color:#111111; letter-spacing:-0.5px;">
                                ${title}
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-padding" style="padding:0 48px 48px;">

                            <p class="text-secondary" style="margin:0 0 24px; font-size:16px; line-height:26px; color:#555555; font-weight:400;">
                                Hello,
                            </p>

                            <p class="text-secondary" style="margin:0 0 40px; font-size:16px; line-height:26px; color:#555555; font-weight:400;">
                                Use the verification code below to <strong class="text-primary" style="color:#111111; font-weight:600;">${action}</strong>. This code was requested on ${timestamp} and will expire in 5 minutes for security purposes.
                            </p>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 40px;">
                                <tr>
                                    <td class="code-box" style="background-color:#f5f5f5; border:1px solid #e5e5e5; border-radius:8px; padding:40px 32px; text-align:center;">

                                        <p class="text-muted" style="margin:0 0 12px; font-size:12px; line-height:16px; color:#888888; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">
                                            Verification Code
                                        </p>

                                        <p class="code-display text-primary" style="margin:0; font-size:44px; line-height:52px; color:#111111; font-weight:700; letter-spacing:14px; font-family:'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; text-align:center;">
                                            ${otp}
                                        </p>

                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 40px;">
                                <tr>
                                    <td style="background-color:#fff8f0; border-left:3px solid #f5a623; border-radius:0 6px 6px 0; padding:16px 20px;">
                                        <p style="margin:0; font-size:14px; line-height:22px; color:#8b6914;">
                                            <strong style="font-weight:600;">Didn't request this?</strong> If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 32px;">
                                <tr>
                                    <td class="divider" style="border-top:1px solid #e5e5e5; font-size:0; line-height:0;"></td>
                                </tr>
                            </table>

                            <p class="text-muted" style="margin:0 0 8px; font-size:14px; line-height:22px; color:#888888; text-align:center;">
                                Need assistance? Contact <a href="mailto:support@company.com" style="color:#555555; text-decoration:underline; font-weight:500;">support@company.com</a>
                            </p>
                            <p class="text-muted" style="margin:0; font-size:13px; line-height:20px; color:#aaaaaa; text-align:center;">
                                This is an automated message. Please do not reply.
                            </p>

                        </td>
                    </tr>

                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; margin-top:24px;">
                    <tr>
                        <td class="footer" style="padding:24px 48px; text-align:center; border-top:1px solid #e5e5e5;">
                            <p class="text-muted" style="margin:0 0 4px; font-size:13px; line-height:20px; color:#888888; font-weight:500;">
                                Powered by BetterAuth
                            </p>
                            <p class="text-muted" style="margin:0; font-size:12px; line-height:18px; color:#aaaaaa;">
                                © ${year} Company Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>
</html>`;
}

function generatePremiumInvitationEmail(
  params: InvitationTemplateParams,
): string {
  const {
    inviterName,
    orgName,
    invitationUrl,
    year = new Date().getFullYear(),
  } = params;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Organization Invitation</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }

        body {
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        @media (prefers-color-scheme: dark) {
            .email-wrapper { background-color: #111111 !important; }
            .email-content { background-color: #1a1a1a !important; border-color: #2a2a2a !important; }
            .text-primary { color: #ffffff !important; }
            .text-secondary { color: #a0a0a0 !important; }
            .text-muted { color: #666666 !important; }
            .button-primary { background-color: #0066cc !important; }
            .divider { border-color: #2a2a2a !important; }
        }

        @media screen and (max-width: 600px) {
            .email-content { width: 100% !important; max-width: 100% !important; }
            .content-padding { padding: 40px 24px !important; }
            .header-padding { padding: 48px 24px 32px !important; }
            .heading { font-size: 24px !important; line-height: 32px !important; }
            .button-primary { width: 100% !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#fafafa;">

    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
        ${inviterName} has invited you to join ${orgName}.
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-wrapper" style="background-color:#fafafa;">
        <tr>
            <td align="center" style="padding:60px 20px;">

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-content" style="max-width:600px; background-color:#ffffff; border-radius:12px; border:1px solid #e5e5e5; overflow:hidden;">

                    <tr>
                        <td class="header-padding" style="padding:56px 48px 40px; text-align:center;">

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 32px;">
                                <tr>
                                    <td style="width:48px; height:48px; background:linear-gradient(135deg, #0066cc 0%, #0052a3 100%); border-radius:10px; text-align:center; vertical-align:middle;">
                                        <span style="color:#ffffff; font-size:24px;">👋</span>
                                    </td>
                                </tr>
                            </table>

                            <h1 class="heading text-primary" style="margin:0; font-size:28px; font-weight:600; line-height:36px; color:#111111; letter-spacing:-0.5px;">
                                You're Invited
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-padding" style="padding:0 48px 48px;">

                            <p class="text-secondary" style="margin:0 0 32px; font-size:16px; line-height:26px; color:#555555; font-weight:400;">
                                <strong class="text-primary" style="color:#111111; font-weight:600;">${inviterName}</strong> has invited you to join <strong class="text-primary" style="color:#111111; font-weight:600;">${orgName}</strong>.
                            </p>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 40px;">
                                <tr>
                                    <td style="text-align:center;">
                                        <a href="${invitationUrl}" class="button-primary" style="display:inline-block; background-color:#0066cc; color:#ffffff; text-decoration:none; padding:16px 32px; border-radius:8px; font-weight:600; font-size:15px; letter-spacing:-0.2px;">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p class="text-muted" style="margin:0 0 8px; font-size:14px; line-height:22px; color:#888888; text-align:center;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin:0; font-size:13px; line-height:20px; color:#0066cc; text-align:center; word-break:break-all;">
                                <a href="${invitationUrl}" style="color:#0066cc; text-decoration:none;">${invitationUrl}</a>
                            </p>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:40px 0 32px;">
                                <tr>
                                    <td class="divider" style="border-top:1px solid #e5e5e5; font-size:0; line-height:0;"></td>
                                </tr>
                            </table>

                            <p class="text-muted" style="margin:0; font-size:13px; line-height:20px; color:#aaaaaa; text-align:center;">
                                This invitation will expire in 7 days.
                            </p>

                        </td>
                    </tr>

                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; margin-top:24px;">
                    <tr>
                        <td class="footer" style="padding:24px 48px; text-align:center; border-top:1px solid #e5e5e5;">
                            <p class="text-muted" style="margin:0 0 4px; font-size:13px; line-height:20px; color:#888888; font-weight:500;">
                                Powered by BetterAuth
                            </p>
                            <p class="text-muted" style="margin:0; font-size:12px; line-height:18px; color:#aaaaaa;">
                                © ${year} Company Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>
</html>`;
}

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

    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") return;

        const email = ctx.body?.email;
        if (!email)
          throw new APIError("BAD_REQUEST", { message: "Email is required" });

        const existingUser =
          await ctx.context.internalAdapter.findUserByEmail(email);

        if (existingUser) {
          if (existingUser.user.emailVerified) {
            throw new APIError("CONFLICT", {
              message: "This email is already in use. Try logging in instead.",
            });
          }

          const otp = await ctx.context.internalAdapter.createVerificationValue(
            {
              identifier: existingUser.user.email,
              value: Math.floor(100000 + Math.random() * 900000).toString(),
              expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
          );

          await sendOtpEmail(
            existingUser.user.email,
            otp.value,
            "email-verification",
          );

          throw new APIError("ACCEPTED", {
            message:
              "Email already registered. A new verification link has been sent to your inbox.",
          });
        }
      }),
    },

    emailVerification: {
      sendVerificationEmail: async () => {},
      sendOnSignIn: true,
    },

    plugins: [
      bearer(),
      openAPI(),
      admin(),

      jwt({
        jwks: {
          keyPairConfig: { alg: "EdDSA" },
          rotationInterval: 60 * 60 * 24 * 30,
          gracePeriod: 60 * 60 * 24 * 30,
        },
        jwt: {
          expirationTime: "15m",
        },
      }),

      emailOTP({
        otpLength: 6,
        expiresIn: 300,

        // This is the single canonical place better-auth calls to deliver
        // every OTP — sign-in, email-verification, and forget-password.
        // Direct function call, no HTTP.
        async sendVerificationOTP({ email, otp, type }) {
          await sendOtpEmail(email, otp, type);
        },
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
      disableCSRFCheck: true,
      disableOriginCheck: true,
    },
  });
}

export { generatePremiumOtpEmail, generatePremiumInvitationEmail };
