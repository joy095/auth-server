/**
 * ============================================================================
 * PREMIUM EMAIL TEMPLATES — REFACTORED
 * Single base shell + dynamic body composition
 * ============================================================================
 */

/* ─── Types ─── */

interface BaseEmailParams {
  title: string;
  preheader: string;
  headerEmoji: string;
  headerGradient?: string;
  heading: string;
  bodyHtml: string;
  year?: number;
}

export interface OtpEmailParams {
  title: string;
  action: string;
  otp: string;
  supportEmail?: string;
  timestamp?: string;
  year?: number;
}

export interface InvitationEmailParams {
  inviterName: string;
  orgName: string;
  invitationUrl: string;
  year?: number;
}

export interface ResetPasswordEmailParams {
  userName?: string;
  userEmail: string;
  resetUrl: string;
  token: string;
  supportEmail?: string;
  timestamp?: string;
  year?: number;
}

/* ─── Shared CSS (used by every template) ─── */

const SHARED_CSS = `
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
    .button-primary { background-color: #000000 !important; }
    .button-primary span { color: #ffffff !important; }
    .divider { border-color: #2a2a2a !important; }
    .footer { background-color: #111111 !important; border-color: #2a2a2a !important; }
    .security-box { background-color: #242424 !important; border-color: #333333 !important; }
    .token-box { background-color: #242424 !important; border-color: #333333 !important; }
}

@media screen and (max-width: 600px) {
    .email-content { width: 100% !important; max-width: 100% !important; }
    .content-padding { padding: 40px 24px !important; }
    .header-padding { padding: 48px 24px 32px !important; }
    .code-display { font-size: 36px !important; letter-spacing: 8px !important; }
    .heading { font-size: 24px !important; line-height: 32px !important; }
    .button-primary { width: 100% !important; display: block !important; text-align: center !important; }
}

.ExternalClass { width: 100%; }
.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
#outlook a { padding: 0; }
`;

/* ─── Base Shell (head, wrapper, footer, dark-mode CSS) ─── */

function generateBaseEmail(params: BaseEmailParams): string {
  const {
    title,
    preheader,
    headerEmoji,
    headerGradient = "linear-gradient(135deg, #000000 0%, #333333 100%)",
    heading,
    bodyHtml,
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
    <style>${SHARED_CSS}</style>
</head>
<body style="margin:0; padding:0; background-color:#fafafa;">

    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
        ${preheader}
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
                                    <td style="width:48px; height:48px; background:${headerGradient}; border-radius:10px; text-align:center; vertical-align:middle;">
                                        <span style="color:#ffffff; font-size:24px; font-weight:600;">${headerEmoji}</span>
                                    </td>
                                </tr>
                            </table>

                            <h1 class="heading text-primary" style="margin:0; font-size:28px; font-weight:600; line-height:36px; color:#111111; letter-spacing:-0.5px;">
                                ${heading}
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-padding" style="padding:0 48px 48px;">
                            ${bodyHtml}
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

/* ─── Reusable Body Blocks ─── */

function supportBlock(supportEmail: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 32px;">
        <tr>
            <td class="divider" style="border-top:1px solid #e5e5e5; font-size:0; line-height:0;"></td>
        </tr>
    </table>

    <p class="text-muted" style="margin:0 0 8px; font-size:14px; line-height:22px; color:#888888; text-align:center;">
        Need assistance? Contact <a href="mailto:${supportEmail}" style="color:#555555; text-decoration:underline; font-weight:500;">${supportEmail}</a>
    </p>
    <p class="text-muted" style="margin:0; font-size:13px; line-height:20px; color:#aaaaaa; text-align:center;">
        This is an automated message. Please do not reply.
    </p>
  `;
}

function actionButton(
  url: string,
  label: string,
  bgColor: string = "#000000",
): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 40px;">
        <tr>
            <td style="text-align:center;">
                <a href="${url}" class="button-primary" style="display:inline-block; background-color:${bgColor}; color:#ffffff; text-decoration:none; padding:16px 32px; border-radius:8px; font-weight:600; font-size:15px; letter-spacing:-0.2px;">
                    <span style="color:#ffffff;">${label}</span>
                </a>
            </td>
        </tr>
    </table>
  `;
}

function fallbackUrl(
  url: string,
  color: string = "#555555",
  decoration: string = "underline",
): string {
  return `
    <p class="text-muted" style="margin:0 0 8px; font-size:14px; line-height:22px; color:#888888; text-align:center;">
        Or copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 40px; font-size:13px; line-height:20px; color:${color}; text-align:center; word-break:break-all;">
        <a href="${url}" style="color:${color}; text-decoration:${decoration};">${url}</a>
    </p>
  `;
}

/* ─── Public Generators ─── */

export function generatePremiumOtpEmail(params: OtpEmailParams): string {
  const {
    title,
    action,
    otp,
    supportEmail = "support@company.com",
    timestamp = new Date().toLocaleString(),
    year,
  } = params;

  const bodyHtml = `
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

    ${supportBlock(supportEmail)}
  `;

  return generateBaseEmail({
    title,
    preheader: `Your verification code is ${otp}. This code will expire in 5 minutes.`,
    headerEmoji: "⚡",
    heading: title,
    bodyHtml,
    year,
  });
}

export function generatePremiumInvitationEmail(
  params: InvitationEmailParams,
): string {
  const { inviterName, orgName, invitationUrl, year } = params;

  const bodyHtml = `
    <p class="text-secondary" style="margin:0 0 32px; font-size:16px; line-height:26px; color:#555555; font-weight:400;">
        <strong class="text-primary" style="color:#111111; font-weight:600;">${inviterName}</strong> has invited you to join <strong class="text-primary" style="color:#111111; font-weight:600;">${orgName}</strong>.
    </p>

    ${actionButton(invitationUrl, "Accept Invitation", "#0066cc")}
    ${fallbackUrl(invitationUrl, "#0066cc", "none")}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:40px 0 32px;">
        <tr>
            <td class="divider" style="border-top:1px solid #e5e5e5; font-size:0; line-height:0;"></td>
        </tr>
    </table>

    <p class="text-muted" style="margin:0; font-size:13px; line-height:20px; color:#aaaaaa; text-align:center;">
        This invitation will expire in 7 days.
    </p>
  `;

  return generateBaseEmail({
    title: "Organization Invitation",
    preheader: `${inviterName} has invited you to join ${orgName}.`,
    headerEmoji: "👋",
    headerGradient: "linear-gradient(135deg, #0066cc 0%, #0052a3 100%)",
    heading: "You're Invited",
    bodyHtml,
    year,
  });
}

export function generatePremiumResetPasswordEmail(
  params: ResetPasswordEmailParams,
): string {
  const {
    userName,
    userEmail,
    resetUrl,
    token,
    supportEmail = "support@company.com",
    timestamp = new Date().toLocaleString(),
    year,
  } = params;

  const displayName = userName || userEmail;
  const tokenPreview = token.slice(-8);

  const bodyHtml = `
    <p class="text-secondary" style="margin:0 0 24px; font-size:16px; line-height:26px; color:#555555; font-weight:400;">
        Hello <strong class="text-primary" style="color:#111111; font-weight:600;">${displayName}</strong>,
    </p>

    <p class="text-secondary" style="margin:0 0 32px; font-size:16px; line-height:26px; color:#555555; font-weight:400;">
        We received a request to reset the password for your account (<strong class="text-primary" style="color:#111111; font-weight:500;">${userEmail}</strong>) on ${timestamp}. Click the button below to create a new password.
    </p>

    ${actionButton(resetUrl, "Reset Password")}
    ${fallbackUrl(resetUrl)}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
        <tr>
            <td class="token-box" style="background-color:#f8f8f8; border:1px solid #e5e5e5; border-radius:8px; padding:16px 20px; text-align:center;">
                <p class="text-muted" style="margin:0 0 4px; font-size:11px; line-height:16px; color:#888888; text-transform:uppercase; letter-spacing:1px; font-weight:600;">
                    Reference Token
                </p>
                <p style="margin:0; font-size:13px; line-height:20px; color:#555555; font-family:'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; letter-spacing:0.5px;">
                    ...${tokenPreview}
                </p>
            </td>
        </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 40px;">
        <tr>
            <td class="security-box" style="background-color:#f5f5f5; border:1px solid #e5e5e5; border-radius:8px; padding:16px 20px;">
                <p style="margin:0; font-size:14px; line-height:22px; color:#555555;">
                    <strong style="font-weight:600; color:#111111;">Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                </p>
            </td>
        </tr>
    </table>

    ${supportBlock(supportEmail)}
  `;

  return generateBaseEmail({
    title: "Reset Your Password",
    preheader:
      "Reset your password for your account. This link expires in 1 hour.",
    headerEmoji: "🔐",
    heading: "Reset Your Password",
    bodyHtml,
    year,
  });
}
