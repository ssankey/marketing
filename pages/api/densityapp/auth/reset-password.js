
// pages/api/densityapp/auth/reset-password.js
import sql from 'mssql';
import bcrypt from 'bcrypt';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return; // handle preflight

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, code and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const rows = await queryDatabase(
      `SELECT id, reset_token, reset_token_expires FROM densityapp_user WHERE email = @email`,
      [{ name: 'email', type: sql.VarChar, value: email }]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = rows[0];

    if (!user.reset_token || user.reset_token !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await queryDatabase(
      `UPDATE densityapp_user
       SET password_hash = @passwordHash, reset_token = NULL, reset_token_expires = NULL
       WHERE id = @id`,
      [
        { name: 'passwordHash', type: sql.VarChar, value: passwordHash },
        { name: 'id', type: sql.Int, value: user.id },
      ]
    );

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}