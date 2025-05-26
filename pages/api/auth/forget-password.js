import { queryDatabase } from "lib/db";
import sql from "mssql";
import { generateOTP, sendEmail } from "lib/email-utils";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email } = req.body;

  try {
    // Check if email exists in either salesperson or customer tables
    const salesResults = await queryDatabase(
      `SELECT SlpCode, SlpName, email FROM OSLP WHERE email = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    const customerResults = await queryDatabase(
      `SELECT CntctCode, Name, E_MailL FROM OCPR WHERE E_MailL = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (salesResults.length === 0 && customerResults.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Generate OTP (6 digits, valid for 5 minutes)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store OTP in database
    await queryDatabase(
      `INSERT INTO PasswordResetOTPs (email, otp, expiresAt) 
       VALUES (@email, @otp, @expiresAt)`,
      [
        { name: "email", type: sql.VarChar, value: email },
        { name: "otp", type: sql.VarChar, value: otp },
        { name: "expiresAt", type: sql.DateTime, value: expiresAt },
      ]
    );

    // Send email with OTP
    const emailSubject = "Your Password Reset OTP";
    const emailBody = `
      <p>You requested a password reset for your account.</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 5 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail({
      from: "prakash@densitypharmachem.com",
      to: email,
      subject: emailSubject,
      body: emailBody,
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
