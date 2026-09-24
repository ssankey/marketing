
// pages/api/densityapp/auth/login.js
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import sql from 'mssql';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return; // handle preflight

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const rows = await queryDatabase(
      `SELECT * FROM densityapp_user WHERE email = @email`,
      [{ name: 'email', type: sql.VarChar, value: email }]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    if (user.status && user.status.toLowerCase() !== 'active') {
      return res.status(403).json({ error: 'Your account is inactive. Please contact admin.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Account not set up. Please reset your password first.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await queryDatabase(
      `UPDATE densityapp_user SET last_login = GETDATE() WHERE id = @id`,
      [{ name: 'id', type: sql.Int, value: user.id }]
    );

    const token = sign(
      {
        id: user.id,
        empCode: user.emp_code,
        email: user.email,
        role: user.isadmin ? 'admin' : 'user',
        contactCodes: user.slpcode ? [user.slpcode] : [],
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        empCode: user.emp_code,
        name: user.name,
        email: user.email,
        designation: user.designation,
        department: user.department,
        branch: user.branch,
        reportingManager: user.reporting_manager,
        slpCode: user.slpcode,
        isAdmin: !!user.isadmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}