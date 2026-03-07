// Christians Debate — Email Templates
// Design: Refined Ecclesiastical — warm cream, deep navy, gold accents

const colors = {
  bg: "#faf8f3",
  cardBg: "#ffffff",
  navy: "#1a2744",
  navyLight: "#2d3f5e",
  gold: "#b8860b",
  goldLight: "#d4a234",
  goldPale: "#f5eed4",
  muted: "#8b8680",
  border: "#e8e2d6",
  borderLight: "#f0ebe0",
  danger: "#a83232",
  success: "#2d6a4f",
};

const fontStack = `'Georgia', 'Times New Roman', 'Palatino Linotype', serif`;
const fontStackSans = `'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;

function wrap(content: string, preheader?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Christians Debate</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.bg}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>` : ""}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.bg};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Header -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 12px; vertical-align: middle;">
                    <div style="width: 8px; height: 8px; background: ${colors.gold}; transform: rotate(45deg); display: inline-block;"></div>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-family: ${fontStack}; font-size: 20px; font-weight: 700; color: ${colors.navy}; letter-spacing: 0.02em;">Christians Debate</span>
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle;">
                    <div style="width: 8px; height: 8px; background: ${colors.gold}; transform: rotate(45deg); display: inline-block;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: ${colors.cardBg}; border: 1px solid ${colors.border}; border-radius: 2px;">
          <!-- Gold accent line -->
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, ${colors.border} 0%, ${colors.gold} 30%, ${colors.goldLight} 50%, ${colors.gold} 70%, ${colors.border} 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 36px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <tr>
            <td style="padding: 28px 0 0; text-align: center;">
              <p style="margin: 0 0 6px; font-family: ${fontStackSans}; font-size: 12px; color: ${colors.muted}; line-height: 1.5;">
                Christians Debate &middot; Structured theological discussion
              </p>
              <p style="margin: 0; font-family: ${fontStackSans}; font-size: 11px; color: ${colors.muted}; line-height: 1.5;">
                You received this email because of activity on your account.
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

function heading(text: string) {
  return `<h1 style="margin: 0 0 8px; font-family: ${fontStack}; font-size: 22px; font-weight: 700; color: ${colors.navy}; line-height: 1.3;">${text}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin: 0 0 20px; font-family: ${fontStack}; font-size: 16px; color: ${colors.navyLight}; line-height: 1.65;">${text}</p>`;
}

function ctaButton(url: string, label: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
    <tr>
      <td align="center">
        <a href="${url}" target="_blank" style="display: inline-block; background-color: ${colors.navy}; color: #ffffff; font-family: ${fontStackSans}; font-size: 15px; font-weight: 600; letter-spacing: 0.04em; text-decoration: none; padding: 14px 36px; border-radius: 2px; mso-padding-alt: 0; text-transform: uppercase;">
          <!--[if mso]><i style="mso-font-width: 200%; mso-text-raise: 21pt;">&nbsp;</i><![endif]-->
          <span style="mso-text-raise: 10pt;">${label}</span>
          <!--[if mso]><i style="mso-font-width: 200%;">&nbsp;</i><![endif]-->
        </a>
      </td>
    </tr>
  </table>`;
}

function divider() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 4px 0 24px;">
    <tr>
      <td style="border-bottom: 1px solid ${colors.borderLight};"></td>
      <td style="width: 40px; text-align: center; padding: 0 12px;">
        <span style="font-size: 10px; color: ${colors.border};">&#9670;</span>
      </td>
      <td style="border-bottom: 1px solid ${colors.borderLight};"></td>
    </tr>
  </table>`;
}

function finePrint(text: string) {
  return `<p style="margin: 0; font-family: ${fontStackSans}; font-size: 13px; color: ${colors.muted}; line-height: 1.6;">${text}</p>`;
}

function iconBlock(emoji: string) {
  return `<div style="text-align: center; margin-bottom: 20px;">
    <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; text-align: center; font-size: 26px; background: ${colors.goldPale}; border-radius: 50%; border: 1px solid ${colors.border};">${emoji}</div>
  </div>`;
}

// ─── Templates ──────────────────────────────────────────────────

export function verificationEmailTemplate(url: string, userName?: string) {
  const greeting = userName ? `Dear ${userName},` : "Dear friend,";
  return wrap(`
    ${iconBlock("&#9993;")}
    ${heading("Verify Your Email")}
    ${paragraph(`${greeting}`)}
    ${paragraph("Thank you for joining Christians Debate. To complete your registration and begin participating in thoughtful theological discussions, please verify your email address.")}
    ${ctaButton(url, "Verify Email Address")}
    ${divider()}
    ${finePrint("This verification link expires in <strong>24 hours</strong>. If you did not create an account, no action is needed &mdash; this email can be safely ignored.")}
  `, "Please verify your email to complete registration at Christians Debate.");
}

export function magicLinkEmailTemplate(url: string) {
  return wrap(`
    ${iconBlock("&#128279;")}
    ${heading("Your Sign-In Link")}
    ${paragraph("A sign-in link was requested for your Christians Debate account. Click below to securely access the platform &mdash; no password needed.")}
    ${ctaButton(url, "Sign In Now")}
    ${divider()}
    ${finePrint("This link is valid for <strong>10 minutes</strong> and can only be used once. If you didn&rsquo;t request this, you can safely disregard this message.")}
  `, "Your one-time sign-in link for Christians Debate.");
}

export function passwordResetEmailTemplate(url: string) {
  return wrap(`
    ${iconBlock("&#128274;")}
    ${heading("Reset Your Password")}
    ${paragraph("We received a request to reset the password for your Christians Debate account. Click below to choose a new password.")}
    ${ctaButton(url, "Reset Password")}
    ${divider()}
    ${finePrint("This link expires in <strong>1 hour</strong>. If you did not request a password reset, your account is still secure &mdash; no action is required.")}
  `, "Password reset request for your Christians Debate account.");
}

export function mfaEnabledEmailTemplate() {
  return wrap(`
    ${iconBlock("&#128737;")}
    ${heading("Two-Factor Authentication Enabled")}
    ${paragraph("Two-factor authentication has been successfully <strong>enabled</strong> on your Christians Debate account. From now on, you&rsquo;ll be asked for a verification code from your authenticator app when signing in.")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 24px;">
      <tr>
        <td style="background: ${colors.goldPale}; border-left: 3px solid ${colors.gold}; padding: 16px 20px; border-radius: 0 2px 2px 0;">
          <p style="margin: 0; font-family: ${fontStackSans}; font-size: 14px; color: ${colors.navyLight}; line-height: 1.6;">
            <strong style="color: ${colors.navy};">Keep your recovery codes safe.</strong>
            If you lose access to your authenticator app, recovery codes are the only way to regain access to your account.
          </p>
        </td>
      </tr>
    </table>
    ${divider()}
    ${finePrint("If you did not enable this setting, your account may be compromised. Please <strong>reset your password immediately</strong> and contact support.")}
  `, "Two-factor authentication has been enabled on your Christians Debate account.");
}
