import bcrypt from 'bcrypt';
import { queryDatabase } from 'lib/db';
import sql from 'mssql';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72; // bcrypt max length

function validatePassword(password) {
  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return password.length >= PASSWORD_MIN_LENGTH && 
         password.length <= PASSWORD_MAX_LENGTH &&
         complexityRegex.test(password);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, newPassword, confirmPassword } = req.body;

  // Validate input fields
  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Missing email or password fields' });
  }

  // Check password matching
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // Validate password complexity
  if (!validatePassword(newPassword)) {
    return res.status(400).json({ 
      message: 'Password must be 8-72 characters, include uppercase, lowercase, number, and special character' 
    });
  }

  try {
    // Check OSLP table first (salespersons)
    let results = await queryDatabase(
      `SELECT email FROM OSLP WHERE email = @email`,
      [{ name: 'email', type: sql.VarChar, value: email }]
    );

    if (results.length > 0) {
      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update the salesperson's password
      const updateQuery = `
        UPDATE OSLP
        SET U_Password = @newPassword
        WHERE email = @email
      `;
      const updateParams = [
        { name: 'newPassword', type: sql.VarChar, value: hashedPassword },
        { name: 'email', type: sql.VarChar, value: email },
      ];

      await queryDatabase(updateQuery, updateParams);

      return res.status(200).json({
        message: 'Password has been set successfully',
        redirectTo: '/login',
      });
    }

    // Check OCPR table (customers)
    results = await queryDatabase(
      `SELECT E_MailL FROM OCPR WHERE E_MailL = @email`,
      [{ name: 'email', type: sql.VarChar, value: email }]
    );

    if (results.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the customer's password
    const updateQuery = `
      UPDATE OCPR
      SET Password = @newPassword
      WHERE E_MailL = @email
    `;
    const updateParams = [
      { name: 'newPassword', type: sql.VarChar, value: hashedPassword },
      { name: 'email', type: sql.VarChar, value: email },
    ];

    await queryDatabase(updateQuery, updateParams);

    return res.status(200).json({
      message: 'Password has been set successfully',
      redirectTo: '/login',
    });
  } catch (error) {
    console.error('Error setting password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}