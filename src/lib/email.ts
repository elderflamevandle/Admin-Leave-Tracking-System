import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
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

export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  temporaryPassword: string
): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

  await resend.emails.send({
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
