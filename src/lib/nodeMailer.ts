import { Hono } from "hono";
import nodemailer from "nodemailer";
import type { Context, Next } from "hono";

interface EmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

type EmailVariables = {
  parsedBody: EmailRequest;
};

// ─── HMAC Middleware ──────────────────────────────────────────────────────────

const verifyHMAC = async (
  c: Context<{ Variables: EmailVariables }>,
  next: Next,
) => {
  const signature = c.req.header("x-signature");
  const secret = process.env.MAIL_HMAC_SECRET;
  const rawBody = await c.req.text();

  if (!signature || !secret) {
    return c.json({ error: "Unauthorized: Missing credentials" }, 401);
  }

  try {
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const sigBuffer = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) ??
        [],
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      encoder.encode(rawBody),
    );

    if (!isValid) {
      return c.json({ error: "Invalid Signature" }, 403);
    }

    c.set("parsedBody", JSON.parse(rawBody) as EmailRequest);
    await next();
  } catch (err) {
    console.error("HMAC verification error:", err);
    return c.json({ error: "Verification failed" }, 400);
  }
};

// ─── Email Router ─────────────────────────────────────────────────────────────

const emailRoute = new Hono<{ Variables: EmailVariables }>();

emailRoute.post("/send-email", verifyHMAC, async (c) => {
  const { to, subject, text, html, from } = c.get("parsedBody");

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!to || !subject || (!text && !html)) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  if (!smtpUser || !smtpPass) {
    console.error("SMTP credentials are not configured");
    return c.json({ error: "Mail service not configured" }, 500);
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    await transporter.sendMail({
      from: from ?? smtpUser,
      to,
      subject,
      text,
      html,
    });

    return c.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Nodemailer error:", error);
    return c.json({ error: "Failed to send email" }, 500);
  }
});

export default emailRoute;
