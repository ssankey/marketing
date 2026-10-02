


import { queryDatabase } from "lib/db";
import sql from "mssql";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const smtpAccounts = {
  "prakash@densitypharmachem.com": {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    fromName: "Density Pharmachem",
  },
  "shafique@densitypharmachem.com": {
    user: "shafique@densitypharmachem.com",
    pass: process.env.SHAFIQUE_EMAIL_PASS,
    fromName: "Shafique Khan - Density Pharmachem",
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const salesRes = await queryDatabase(
      `SELECT email, U_Password FROM OSLP WHERE email = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (salesRes.length > 0) {
      const user = salesRes[0];
      if (!user.U_Password?.trim()) {
        return res.status(200).json({ redirectTo: "set-password", email });
      }
      return await handleOtp(email, res);
    }

     // 2. NEW: Check OHEM (Employees)
      const empRes = await queryDatabase(
        `SELECT email, U_Password FROM OHEM WHERE email = @email`,
        [{ name: "email", type: sql.VarChar, value: email }]
      );

      if (empRes.length > 0) {
        const user = empRes[0];
        if (!user.U_Password?.trim()) {
          return res.status(200).json({ redirectTo: "set-password", email });
        }
        return await handleOtp(email, res);
      }

    const custRes = await queryDatabase(
      `SELECT E_MailL, Password FROM OCPR WHERE E_MailL = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (custRes.length > 0) {
      const user = custRes[0];
      if (!user.Password?.trim()) {
        return res.status(200).json({ redirectTo: "set-password", email });
      }
      return await handleOtp(email, res);
    }

    return res.status(401).json({ message: "Email address not found" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function handleOtp(email, res) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpToken = jwt.sign(
    { email, otp, exp: Date.now() + 6 * 60 * 1000 },
    process.env.JWT_SECRET
  );

  const from = "prakash@densitypharmachem.com";
  const subject = "Dashboard OTP";
  const body = `<p>Your OTP is <strong>${otp}</strong>. It is valid for 6 minutes.</p>`;

  try {
    const senderConfig = smtpAccounts[from];
    if (!senderConfig) {
      return res.status(400).json({ message: `Unauthorized sender: ${from}` });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === "true",
      requireTLS: true,
      auth: {
        user: senderConfig.user,
        pass: senderConfig.pass,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${senderConfig.fromName}" <${from}>`,
      to: email,
      subject,
      html: body,
    });

    console.log("✅ OTP email sent:", info.messageId);
    return res.status(200).json({ message: "OTP_SENT", otpToken });
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    return res.status(500).json({ message: "Failed to send OTP email" });
  }
}
