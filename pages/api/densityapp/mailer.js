// pages/api/densityapp/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === "true",
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
});

export async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: `"Density Pharmachem" <prakash@densitypharmachem.com>`,
    to,
    subject: "Your Password Reset Code - Density App",
    html: `<p>Your verification code is <b>${otp}</b>. It will expire in 15 minutes.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ OTP email sent: %s", info.messageId);
  return info;
}
