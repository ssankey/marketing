//  import { queryDatabase } from "lib/db";
//  import sql from "mssql";
//  import bcrypt from "bcrypt";

//  export default async function handler(req, res) {
//    if (req.method !== "POST") {
//      return res.status(405).json({ message: "Method Not Allowed" });
//    }

//    const { email, newPassword } = req.body;
//    if (!email || !newPassword) {
//      return res
//        .status(400)
//        .json({ message: "Email and password are required" });
//    }

//    try {
//      const hashedPassword = await bcrypt.hash(newPassword, 10);

//      // Try updating in OSLP
//      await queryDatabase(
//        `UPDATE OSLP SET U_Password = @password WHERE LOWER(email) = LOWER(@email)`,
//        [
//          { name: "password", type: sql.VarChar, value: hashedPassword },
//          { name: "email", type: sql.VarChar, value: email },
//        ]
//      );

//      const oslps = await queryDatabase(
//        `SELECT email FROM OSLP WHERE LOWER(email) = LOWER(@email) AND U_Password IS NOT NULL`,
//        [{ name: "email", type: sql.VarChar, value: email }]
//      );

//      if (oslps.length > 0) {
//        return res
//          .status(200)
//          .json({ message: "Password updated successfully" });
//      }

//      // Try updating in OCPR
//      await queryDatabase(
//        `UPDATE OCPR SET Password = @password WHERE LOWER(E_MailL) = LOWER(@email)`,
//        [
//          { name: "password", type: sql.VarChar, value: hashedPassword },
//          { name: "email", type: sql.VarChar, value: email },
//        ]
//      );

//      const ocprs = await queryDatabase(
//        `SELECT E_MailL FROM OCPR WHERE LOWER(E_MailL) = LOWER(@email) AND Password IS NOT NULL`,
//        [{ name: "email", type: sql.VarChar, value: email }]
//      );

//      if (ocprs.length > 0) {
//        return res
//          .status(200)
//          .json({ message: "Password updated successfully" });
//      }

//      return res
//        .status(404)
//        .json({ message: "Email not found in OSLP or OCPR" });
//    } catch (err) {
//      console.error("Reset password error:", err);
//      return res.status(500).json({ message: "Internal Server Error" });
//    }
//  }


import { queryDatabase } from "lib/db";
import sql from "mssql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, newPassword, otpToken } = req.body;

  if (!email || !newPassword || !otpToken) {
    return res.status(400).json({ message: "Email, password, and OTP token are required" });
  }

  try {
    // Decode and validate OTP token
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);

    const now = Date.now();
    if (!decoded || decoded.email !== email || decoded.exp < now) {
      return res.status(401).json({ message: "Invalid or expired OTP token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Try updating in OSLP
    await queryDatabase(
      `UPDATE OSLP SET U_Password = @password WHERE LOWER(email) = LOWER(@email)`,
      [
        { name: "password", type: sql.VarChar, value: hashedPassword },
        { name: "email", type: sql.VarChar, value: email },
      ]
    );

    const oslps = await queryDatabase(
      `SELECT email FROM OSLP WHERE LOWER(email) = LOWER(@email) AND U_Password IS NOT NULL`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (oslps.length > 0) {
      return res.status(200).json({ message: "Password updated successfully" });
    }

    // Try updating in OCPR
    await queryDatabase(
      `UPDATE OCPR SET Password = @password WHERE LOWER(E_MailL) = LOWER(@email)`,
      [
        { name: "password", type: sql.VarChar, value: hashedPassword },
        { name: "email", type: sql.VarChar, value: email },
      ]
    );

    const ocprs = await queryDatabase(
      `SELECT E_MailL FROM OCPR WHERE LOWER(E_MailL) = LOWER(@email) AND Password IS NOT NULL`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (ocprs.length > 0) {
      return res.status(200).json({ message: "Password updated successfully" });
    }

    return res.status(404).json({ message: "Email not found in OSLP or OCPR" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Invalid or expired token" });
  }
}
