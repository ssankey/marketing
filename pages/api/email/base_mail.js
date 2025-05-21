// //pages/api/email/base_mail
// import nodemailer from "nodemailer";

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   // Destructure all required fields from request body
//   const { from, to, cc,subject, body } = req.body;

//   // Validate all required fields
//   if (!from || !to || !subject || !body) {
//     return res.status(400).json({
//       success: false,
//       message: "Missing required fields: 'from', 'to', 'subject', 'body'",
//     });
//   }

//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: parseInt(process.env.EMAIL_PORT, 10),
//     secure: process.env.EMAIL_SECURE === "true",
//     requireTLS: true,
//     auth: {
//       user: process.env.EMAIL_USER, // SMTP authentication username
//       pass: process.env.EMAIL_PASS, // SMTP authentication password
//     },
//     tls: {
//       ciphers: "SSLv3",
//       rejectUnauthorized: false,
//     },
//     connectionTimeout: 10000,
//   });

//   try {
//     await transporter.verify();
//     console.log("✅ SMTP connection verified successfully");

//     const info = await transporter.sendMail({
//       from: `"${process.env.EMAIL_FROM_NAME}" <${from}>`, // Use the 'from' address from request
//       to: to, // Can be comma-separated string or array
//       cc : cc,
//       subject: subject,
//       html: body, // Use the HTML body from request
//     });

//     console.log("✅ Message sent: %s", info.messageId);
//     return res.status(200).json({
//       success: true,
//       message: "Email sent successfully",
//       messageId: info.messageId,
//     });
//   } catch (error) {
//     console.error("❌ SMTP Error:", error);

//     let errorMessage = "Email sending failed";
//     if (error.code === "EAUTH") {
//       errorMessage = "Authentication failed. Check email or password.";
//     } else if (error.code === "ECONNECTION") {
//       errorMessage =
//         "Connection failed. SMTP server not reachable or port is blocked.";
//     } else if (error.code === "ETIMEDOUT") {
//       errorMessage =
//         "Connection timed out. SMTP server took too long to respond.";
//     }

//     return res.status(500).json({
//       success: false,
//       message: errorMessage,
//       error: error.toString(),
//     });
//   }
// }

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
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { from, to, cc, subject, body } = req.body;

  if (!from || !to || !subject || !body) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: 'from', 'to', 'subject', 'body'",
    });
  }

  const senderConfig = smtpAccounts[from];
  if (!senderConfig) {
    return res.status(400).json({
      success: false,
      message: `Unauthorized sender: ${from}`,
    });
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

  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified for:", from);

    const info = await transporter.sendMail({
      from: `"${senderConfig.fromName}" <${from}>`,
      to,
      cc,
      subject,
      html: body,
    });

    console.log("✅ Message sent: %s", info.messageId);
    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("❌ SMTP Error:", error);

    let errorMessage = "Email sending failed";
    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Check email or password.";
    } else if (error.code === "ECONNECTION") {
      errorMessage =
        "Connection failed. SMTP server not reachable or port is blocked.";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage =
        "Connection timed out. SMTP server took too long to respond.";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.toString(),
    });
  }
}
