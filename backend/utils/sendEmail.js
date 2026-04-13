const nodemailer = require("nodemailer");

/**
 * Shared Gmail email helper.
 * Uses GMAIL_USER + GMAIL_PASS from .env
 * Falls back gracefully if not configured.
 */
const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
};

const sendEmail = async ({ to, subject, html, replyTo }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`⚠️  Gmail not configured. Skipping: "${subject}" → ${to}`);
    return { success: false, reason: "not_configured" };
  }
  try {
    const info = await transporter.sendMail({
      from:    `"SHIFT-UP" <${process.env.GMAIL_USER}>`,
      to, subject, html,
      ...(replyTo && { replyTo }),
    });
    console.log(`✅ Email sent → ${to} | "${subject}" | id: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email failed → ${to} | "${subject}" | ${err.message}`);
    return { success: false, reason: err.message };
  }
};

// ── Shared branded wrapper ────────────────────────────────────────────────
const emailWrapper = (content) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f0f0ec;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <!-- Header -->
    <div style="background:#1a1a1a;padding:24px 36px;text-align:center">
      <div style="font-size:28px;font-weight:900;color:#f5b800;letter-spacing:3px">SHIFT-UP</div>
      <div style="color:#666;font-size:11px;margin-top:4px;letter-spacing:1px;text-transform:uppercase">Workforce Management</div>
    </div>
    <!-- Body -->
    <div style="padding:36px">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background:#f9f9f7;padding:16px 36px;text-align:center;border-top:1px solid #f0f0f0">
      <p style="margin:0;font-size:11px;color:#aaa">
        © ${new Date().getFullYear()} SHIFT-UP · <a href="https://shift-up.netlify.app" style="color:#aaa">shift-up.netlify.app</a>
        <br/>You received this email because you have an account with SHIFT-UP.
      </p>
    </div>
  </div>
</body></html>`;

module.exports = { sendEmail, emailWrapper };