/**
 * ============================================================================
 * RELIABLE OTP SMS TEMPLATE
 * Optimized for Android SMS gateways + GSM encoding
 * ============================================================================
 */

interface SmsOtpTemplateParams {
  code: string;
  brand?: string;
  action?: "verification" | "sign-in" | "reset";
  expiryMinutes?: number;
  supportUrl?: string;
}

function generatePremiumSmsOtp(params: SmsOtpTemplateParams): string {
  const {
    code,
    brand = "Timezly",
    action = "verification",
    expiryMinutes = 5,
    supportUrl,
  } = params;

  const actionLabel =
    action === "sign-in"
      ? "sign-in"
      : action === "reset"
        ? "password reset"
        : "verification";

  // Single-line GSM-safe SMS
  // Optimized for:
  // - Android SMS gateways
  // - GSM-7 encoding
  // - Single SMS segment
  // - Maximum delivery reliability

  let message =
    `${brand}: ${code} is your ${actionLabel} code. ` +
    `Valid ${expiryMinutes} min. Do not share it.`;

  // Optional support URL
  if (supportUrl) {
    message += ` Help: ${supportUrl}`;
  }

  return message;
}

export { generatePremiumSmsOtp };
export type { SmsOtpTemplateParams };
