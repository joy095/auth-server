// ── Types ────────────────────────────────────────────────────────────────────

export type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

// Minimal interface satisfied by both Vercel's ExecutionContext and CF Workers
export type ExecutionCtx = {
  waitUntil(promise: Promise<unknown>): void;
};

// ── HMAC signing ──────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

async function signPayload(body: string): Promise<string> {
  const secret = process.env.MAIL_HMAC_SECRET;
  if (!secret) throw new Error("MAIL_HMAC_SECRET is not set");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const buffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));

  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Core dispatch ─────────────────────────────────────────────────────────────

async function dispatch(options: EmailOptions): Promise<void> {
  const serverUrl = process.env.EMAIL_SERVER_URL;
  if (!serverUrl) throw new Error("EMAIL_SERVER_URL is not set");

  const payload = JSON.stringify({
    from: process.env.MAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  const signature = await signPayload(payload);

  const res = await fetch(`${serverUrl}/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-signature": signature,
    },
    body: payload,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Email server error (${res.status}): ${detail}`);
  }
}

// In better-auth callbacks (sendVerificationOTP, sendInvitationEmail) there is
// no executionCtx available — omit it and the send runs as best-effort.
// Those callbacks are already async so the runtime won't freeze waiting on them.

export function sendEmail(options: EmailOptions, ctx?: ExecutionCtx): void {
  const promise = dispatch(options).catch((err) => {
    console.error("[mail] Failed to send email:", err);
  });

  // Register with the runtime so it stays alive until the fetch settles
  ctx?.waitUntil(promise);
}
