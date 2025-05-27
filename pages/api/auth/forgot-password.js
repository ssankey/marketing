//  // =======================
// // 1. API: /api/auth/forgot-password.js
// // =======================
// import { queryDatabase } from "lib/db";
// import sql from "mssql";
// import jwt from "jsonwebtoken";

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: "Email is required" });

//   try {
//     // Check in OSLP (Sales Person)
//     const salesRes = await queryDatabase(
//       `SELECT email, U_Password FROM OSLP WHERE email = @email`,
//       [{ name: "email", type: sql.VarChar, value: email }]
//     );

//     if (salesRes.length > 0) {
//       const user = salesRes[0];
//       if (!user.U_Password?.trim()) {
//         return res.status(200).json({ redirectTo: "set-password", email });
//       }
//       return await handleOtp(email, res);
//     }

//     // Check in OCPR (Customer)
//     const custRes = await queryDatabase(
//       `SELECT E_MailL, Password FROM OCPR WHERE E_MailL = @email`,
//       [{ name: "email", type: sql.VarChar, value: email }]
//     );

//     if (custRes.length > 0) {
//       const user = custRes[0];
//       if (!user.Password?.trim()) {
//         return res.status(200).json({ redirectTo: "set-password", email });
//       }
//       return await handleOtp(email, res);
//     }

//     return res.status(401).json({ message: "Email address not found" });
//   } catch (error) {
//     console.error("Forgot password error:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// }

// async function handleOtp(email, res) {
//   const otp = Math.floor(100000 + Math.random() * 900000);
//   const otpToken = jwt.sign({ email, otp, exp: Date.now() + 6 * 60 * 1000 }, process.env.JWT_SECRET);

//   const protocol = req.headers["x-forwarded-proto"] || "http";
//   const host = req.headers.host;
//   const baseUrl = `${protocol}://${host}`;
//   // Send OTP using existing base_mail SMTP API
//   const baseMailRes = await fetch(`${baseUrl}/api/email/base_mail`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       from: "prakash@densitypharmachem.com",
//       to: email,
//       subject: "Dashboard OTP",
//       body: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 6 minutes.</p>`,
//     }),
//   });

//   if (!baseMailRes.ok) {
//     const errorData = await baseMailRes.json();
//     console.error("Failed to send OTP email:", errorData);
//     return res.status(500).json({ message: "Failed to send OTP email" });
//   }

//   return res.status(200).json({ message: "OTP_SENT", otpToken });
// }



// pages/api/auth/forgot-password.js

import { queryDatabase } from "lib/db";
import sql from "mssql";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Check in OSLP (Sales Person)
    const salesRes = await queryDatabase(
      `SELECT email, U_Password FROM OSLP WHERE email = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (salesRes.length > 0) {
      const user = salesRes[0];
      if (!user.U_Password?.trim()) {
        return res.status(200).json({ redirectTo: "set-password", email });
      }
      return await handleOtp(email, req, res);
    }

    // Check in OCPR (Customer)
    const custRes = await queryDatabase(
      `SELECT E_MailL, Password FROM OCPR WHERE E_MailL = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (custRes.length > 0) {
      const user = custRes[0];
      if (!user.Password?.trim()) {
        return res.status(200).json({ redirectTo: "set-password", email });
      }
      return await handleOtp(email, req, res);
    }

    return res.status(401).json({ message: "Email address not found" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function handleOtp(email, req, res) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpToken = jwt.sign({ email, otp, exp: Date.now() + 6 * 60 * 1000 }, process.env.JWT_SECRET);

  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  const baseMailRes = await fetch(`${baseUrl}/api/email/base_mail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "prakash@densitypharmachem.com",
      to: email,
      subject: "Dashboard OTP",
      body: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 6 minutes.</p>`
    }),
  });

  if (!baseMailRes.ok) {
    const errorData = await baseMailRes.json();
    console.error("Failed to send OTP email:", errorData);
    return res.status(500).json({ message: "Failed to send OTP email" });
  }

  return res.status(200).json({ message: "OTP_SENT", otpToken });
}
