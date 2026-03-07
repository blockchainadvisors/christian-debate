const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #1a1a1a;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #2563eb;
  color: #ffffff;
  padding: 12px 32px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
`;

function wrap(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyle}">
  <div style="text-align: center; margin-bottom: 32px;">
    <h2 style="margin: 0; font-size: 22px;">Christians Debate</h2>
  </div>
  ${content}
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #666; text-align: center;">
    <p>You received this email because of your account at Christians Debate.</p>
  </div>
</body>
</html>`;
}

export function verificationEmailTemplate(url: string, userName?: string) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";
  return wrap(`
    <p>${greeting}</p>
    <p>Please verify your email address to complete your registration.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" style="${buttonStyle}">Verify Email</a>
    </div>
    <p style="font-size: 14px; color: #666;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
  `);
}

export function magicLinkEmailTemplate(url: string) {
  return wrap(`
    <p>Hi,</p>
    <p>Click the link below to sign in to Christians Debate.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" style="${buttonStyle}">Sign In</a>
    </div>
    <p style="font-size: 14px; color: #666;">This link expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
  `);
}

export function passwordResetEmailTemplate(url: string) {
  return wrap(`
    <p>Hi,</p>
    <p>We received a request to reset your password.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" style="${buttonStyle}">Reset Password</a>
    </div>
    <p style="font-size: 14px; color: #666;">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
  `);
}

export function mfaEnabledEmailTemplate() {
  return wrap(`
    <p>Hi,</p>
    <p>Two-factor authentication has been <strong>enabled</strong> on your Christians Debate account.</p>
    <p>You'll now be asked for a verification code from your authenticator app when signing in.</p>
    <p style="font-size: 14px; color: #666;">If you didn't enable this, please secure your account immediately by resetting your password.</p>
  `);
}
