import path from "path";
import { config } from "dotenv";
import nodemailer, { type Transporter } from "nodemailer";

// Load .env.local explicitly so Gmail vars are available (Next.js may not have loaded them when this module runs)
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const result = config({ path: envLocalPath });
if (result.error && process.env.NODE_ENV !== "test") {
  console.warn("[email] Could not load .env.local from", envLocalPath, result.error.message);
}

const GMAIL_HOST = "smtp.gmail.com";
const GMAIL_PORT = 587;

/**
 * Gmail-only transporter. Requires a Gmail App Password (not your regular password).
 * Create one at: https://myaccount.google.com/apppasswords
 */
function getTransporter(): Transporter {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  // Debug: which Gmail-related env keys exist (values never logged)
  const gmailKeys = Object.keys(process.env).filter((k) => k.startsWith("GMAIL"));
  console.log("[email] Env keys present:", gmailKeys.length ? gmailKeys.join(", ") : "(none)");

  if (!user || !pass) {
    console.error("[email] Missing config: GMAIL_USER=", user ? "(set)" : "(missing)", "GMAIL_APP_PASSWORD=", pass ? "(set)" : "(missing)");
    throw new Error(
      "Missing Gmail config. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local (use an App Password: https://myaccount.google.com/apppasswords)"
    );
  }

  console.log("[email] Using Gmail SMTP for:", user);
  return nodemailer.createTransport({
    host: GMAIL_HOST,
    port: GMAIL_PORT,
    secure: false,
    auth: { user, pass },
  });
}

export type EmailType = "no_form" | "high_risk";

const EMAIL_SUBJECTS: Record<EmailType, string> = {
  no_form: "SafetyFirst: Complete your daily form before starting your shift",
  high_risk: "SafetyFirst: Do not report to work – elevated risk assessment",
};

const EMAIL_BODIES: Record<EmailType, (name: string) => string> = {
  no_form: (name) =>
    `Hello ${name || "Worker"},

You have not completed your daily safety form for today. Per company policy, you must not start your shift until the form is submitted.

Please log in to SafetyFirst and complete your daily safety assessment before beginning work.

If you have already submitted the form, please disregard this message.

— SafetyFirst Admin`,
  high_risk: (name) =>
    `Hello ${name || "Worker"},

Based on our latest risk assessment, your current risk level is elevated. For your safety and the safety of others, please do not report to work today.

A safety coordinator or supervisor will follow up with you. If you believe this is an error or have questions, please contact your manager or the safety team.

— SafetyFirst Admin`,
};

export async function sendNotificationEmail(
  to: string,
  type: EmailType,
  recipientName?: string | null
): Promise<void> {
  console.log("[email] Sending to:", to, "type:", type);
  const transporter = getTransporter();
  const from = process.env.GMAIL_USER || process.env.MAIL_FROM || "noreply@safetyfirst.local";

  try {
    await transporter.sendMail({
      from: `"SafetyFirst" <${from}>`,
      to,
      subject: EMAIL_SUBJECTS[type],
      text: EMAIL_BODIES[type](recipientName || "Worker"),
    });
    console.log("[email] Sent successfully to:", to);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] Failed to send to", to, ":", msg);
    if (err instanceof Error && err.stack) {
      console.error("[email] Stack:", err.stack);
    }
    throw err;
  }
}

export async function sendBulkNotificationEmails(
  recipients: { email: string; name?: string | null }[],
  type: EmailType
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  const errors: string[] = [];

  for (const { email, name } of recipients) {
    try {
      await sendNotificationEmail(email, type, name);
      sent++;
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { sent, failed: recipients.length - sent, errors };
}
