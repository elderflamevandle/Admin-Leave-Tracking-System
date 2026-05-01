import { Resend } from "resend";
import { logger } from "./logger";

const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";

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

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const client = getResend();
  if (!client) {
    logger.warn("Email provider not configured — skipping password reset email", {
      recipient: redactEmail(email),
    });
    return;
  }
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  await client.emails.send({
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
  });
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
  const client = getResend();
  if (!client) {
    logger.warn("Email provider not configured — skipping leave status email", {
      recipient: redactEmail(email),
    });
    return;
  }
  const subject = status === "approved" ? "Your Leave Request Was Approved" : "Your Leave Request Was Rejected";
  const statusLine =
    status === "approved"
      ? `<p style="color:#16a34a">✓ Your <strong>${leaveType}</strong> leave from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong>approved</strong>.</p>`
      : `<p style="color:#dc2626">✗ Your <strong>${leaveType}</strong> leave from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong>rejected</strong>.</p>`;
  const noteHtml = note ? `<p><strong>Note from reviewer:</strong> ${note}</p>` : "";

  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html: `<h2>Leave Request Update</h2><p>Hi ${fullName},</p>${statusLine}${noteHtml}<p>Log in to view your leave history.</p>`,
  });
}

export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  temporaryPassword: string
): Promise<void> {
  const client = getResend();
  if (!client) {
    logger.warn("Email provider not configured — skipping welcome email", {
      recipient: redactEmail(email),
    });
    return;
  }
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to the Platform",
    html: `
      <h2>Welcome, ${fullName}!</h2>
      <p>Your account has been created. Use the following credentials to log in:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      <p><a href="${loginUrl}">Log In Now</a></p>
      <p>You will be asked to change your password on first login.</p>
    `,
  });
}
