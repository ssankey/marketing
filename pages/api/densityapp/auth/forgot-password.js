
// pages/api/densityapp/auth/forgot-password.js
import sql from 'mssql';
import { queryDatabase } from 'lib/db';
import { sendOtpEmail } from '../mailer';
import { setCorsHeaders } from 'lib/cors';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return; // handle preflight

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const rows = await queryDatabase(
      `SELECT id, email FROM densityapp_user WHERE email = @email`,
      [{ name: 'email', type: sql.VarChar, value: email }]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await queryDatabase(
      `UPDATE densityapp_user
       SET reset_token = @otp, reset_token_expires = DATEADD(MINUTE, 15, GETDATE())
       WHERE email = @email`,
      [
        { name: 'otp', type: sql.VarChar, value: otp },
        { name: 'email', type: sql.VarChar, value: email },
      ]
    );

    // await sendOtpEmail(email, otp);
    await sendOtpEmail('chandraprakashyadav1110@gmail.com', otp);

    return res.status(200).json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}