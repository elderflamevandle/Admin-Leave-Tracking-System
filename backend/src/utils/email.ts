import { Resend } from "resend";
import { logger } from "./logger";

const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

let _resend: Resend | null | undefined;

function getResend(): Resend | null {
  if (_resend !== undefined) return _resend;
  const key = process.env.RESEND_API_KEY;
  _resend = key ? new Resend(key) : null;
  return _resend;
}

function redactEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  return `${user[0]}***@${domain}`;
}

/** Send an email with up to MAX_RETRIES attempts and exponential backoff. */
async function sendWithRetry(
  payload: Parameters<Resend["emails"]["send"]>[0],
  recipientHint: string
): Promise<void> {
  const client = getResend();
  if (!client) {
    logger.warn("Email provider not configured — skipping email", { recipient: recipientHint });
    return;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await client.emails.send(payload);
      if (error) throw new Error(error.message);
      if (attempt > 1) {
        logger.info("Email sent after retry", { attempt, recipient: recipientHint });
      }
      return;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }

  logger.error("Email delivery failed after retries", {
    error: String(lastError),
    recipient: recipientHint,
    attempts: MAX_RETRIES,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  await sendWithRetry(
    {
      from: FROM_EMAIL,
      to: email,
      subject: "Reset Your Password",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    },
    redactEmail(email)
  );
}

export async function sendLeaveStatusEmail(
  email: string,
  fullName: string,
  status: "approved" | "rejected",
  leaveType: string,
  startDate: string,
  endDate: string,
  note?: string
): Promise<void> {
  const subject =
    status === "approved"
      ? "Your Leave Request Was Approved"
      : "Your Leave Request Was Rejected";
  const statusLine =
    status === "approved"
      ? `<p style="color:#16a34a">Your <strong>${leaveType}</strong> leave from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong>approved</strong>.</p>`
      : `<p style="color:#dc2626">Your <strong>${leaveType}</strong> leave from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong>rejected</strong>.</p>`;
  const noteHtml = note ? `<p><strong>Note from reviewer:</strong> ${note}</p>` : "";

  await sendWithRetry(
    {
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `<h2>Leave Request Update</h2><p>Hi ${fullName},</p>${statusLine}${noteHtml}<p>Log in to view your leave history.</p>`,
    },
    redactEmail(email)
  );
}

export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  temporaryPassword: string
): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
  await sendWithRetry(
    {
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to the Platform",
      html: `
        <h2>Welcome, ${fullName}!</h2>
        <p>Your account has been created. Log in with:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        <p><a href="${loginUrl}">Log In Now</a></p>
        <p>You will be prompted to change your password on first login.</p>
      `,
    },
    redactEmail(email)
  );
}
