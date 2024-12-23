import bcrypt from 'bcrypt';
import { queryDatabase } from 'lib/db';
import sql from 'mssql';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72; // bcrypt max length

function validatePassword(password) {
  // Example password complexity requirements
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
    // Verify the user exists
    const query = `
      SELECT * FROM ocpr 
      WHERE E_MailL = @E_MailL
    `;
    const parameters = [
      { name: 'E_MailL', type: sql.VarChar, value: email },
    ];
    const results = await queryDatabase(query, parameters);

    if (results.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Hash the new password
    const saltRounds = 12; // Increased from 10 for stronger hashing
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    const updateQuery = `
      UPDATE ocpr
      SET password = @newPassword
      WHERE E_MailL = @E_MailL
    `;
    const updateParams = [
      { name: 'newPassword', type: sql.VarChar, value: hashedPassword },  // Make sure you're using the hashed password here
      { name: 'E_MailL', type: sql.VarChar, value: email },
    ];

    await queryDatabase(updateQuery, updateParams);
    
    // Send a success response with a redirect URL
    return res.status(200).json({
      message: 'Password has been set successfully',
      redirectTo: '/login',  // Frontend can use this URL to perform the redirect
    });
  } catch (error) {
    console.error('Error setting password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
