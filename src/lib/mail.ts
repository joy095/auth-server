import nodemailer from "nodemailer";

export type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in environment");
  }

  return nodemailer.createTransport({
    service: "Gmail",
    auth: { user, pass },
  });
}

async function doSendEmail(options: EmailOptions): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export function sendEmail(options: EmailOptions): void {
  doSendEmail(options).catch((err) => {
    console.error("Failed to send email:", err);
  });
}
