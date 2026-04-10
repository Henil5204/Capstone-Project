const express   = require("express");
  const nodemailer = require("nodemailer");
  const router     = express.Router();

  router.post("/", async (req, res) => {
    const { name, email, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;
    if (!gmailUser || !gmailPass) {
      console.error("GMAIL_USER or GMAIL_PASS not set in environment");
      return res.status(500).json({ error: "Email service not configured." });
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
    try {
      await transporter.sendMail({
        from:    `"Shift-Up Contact" <${gmailUser}>`,
        to:      gmailUser,
        replyTo: email,
        subject: `New Contact Form Message from ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;">
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Message:</strong><br/><pre style="white-space:pre-wrap;">${message}</pre></p>
            <hr/>
            <p style="color:#aaa;font-size:12px;">Sent via Shift-Up contact form</p>
          </div>
        `,
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to send contact email:", err.message);
      res.status(500).json({ error: "Failed to send email. Please try again." });
    }
  });

  module.exports = router;
  