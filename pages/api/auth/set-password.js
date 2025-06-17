// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import { queryDatabase } from 'lib/db';
// import sql from 'mssql';

// // In-memory store for reset tokens (use database in production)
// const resetTokens = new Map();

// const PASSWORD_MIN_LENGTH = 8;
// const PASSWORD_MAX_LENGTH = 72;

// function validatePassword(password) {
//   // Allow letters, numbers, and special chars: @$!%*?&|
//   const allowedCharsRegex = /^[A-Za-z\d@$!%*?&|]{8,72}$/;
//   // Require uppercase, lowercase, number, and one special char
//   const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&|])[A-Za-z\d@$!%*?&|]{8,72}$/;
  
//   if (!allowedCharsRegex.test(password)) {
//     return {
//       isValid: false,
//       message: 'Password contains invalid characters. Only letters, numbers, and @$!%*?&| are allowed.'
//     };
//   }
//   if (!complexityRegex.test(password)) {
//     return {
//       isValid: false,
//       message: 'Password must be 8-72 characters and include at least one uppercase letter, lowercase letter, number, and special character (@$!%*?&|).'
//     };
//   }
//   return { isValid: true };
// }

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }

//   const { email, newPassword, confirmPassword, token } = req.body;

//   // Validate input fields
//   if (!email || !newPassword || !confirmPassword) {
//     return res.status(400).json({ message: 'Missing email or password fields' });
//   }

//   if (newPassword !== confirmPassword) {
//     return res.status(400).json({ message: 'Passwords do not match' });
//   }

//   const validation = validatePassword(newPassword);
//   if (!validation.isValid) {
//     return res.status(400).json({ message: validation.message });
//   }

//   try {
//     // If token is provided, validate it (for forgot password flow)
//     if (token) {
//       const storedToken = resetTokens.get(token);
//       if (!storedToken || storedToken.email !== email || storedToken.expires < Date.now()) {
//         return res.status(400).json({ message: 'Invalid or expired reset token' });
//       }
//       // Verify JWT
//       try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         if (decoded.email !== email || decoded.type !== 'password_reset') {
//           return res.status(400).json({ message: 'Invalid reset token' });
//         }
//       } catch (err) {
//         return res.status(400).json({ message: 'Invalid or expired reset token' });
//       }
//     }

//     // Check OSLP table
//     let results = await queryDatabase(
//       `SELECT email FROM OSLP WHERE email = @email`,
//       [{ name: 'email', type: sql.VarChar, value: email }]
//     );

//     if (results.length > 0) {
//       // Hash the new password
//       const saltRounds = 12;
//       const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

//       // Update the salesperson's password
//       const updateQuery = `
//         UPDATE OSLP
//         SET U_Password = @newPassword
//         WHERE email = @email
//       `;
//       const updateParams = [
//         { name: 'newPassword', type: sql.VarChar, value: hashedPassword },
//         { name: 'email', type: sql.VarChar, value: email },
//       ];

//       await queryDatabase(updateQuery, updateParams);

//       // Remove token if used
//       if (token) {
//         resetTokens.delete(token);
//       }

//       return res.status(200).json({
//         message: 'Password has been set successfully',
//         redirectTo: '/login',
//       });
//     }

//     // Check OCPR table
//     results = await queryDatabase(
//       `SELECT E_MailL FROM OCPR WHERE E_MailL = @email`,
//       [{ name: 'email', type: sql.VarChar, value: email }]
//     );

//     if (results.length === 0) {
//       return res.status(400).json({ message: 'User not found' });
//     }

//     // Hash the new password
//     const saltRounds = 12;
//     const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

//     // Update the customer's password
//     const updateQuery = `
//       UPDATE OCPR
//       SET Password = @newPassword
//       WHERE E_MailL = @email
//     `;
//     const updateParams = [
//       { name: 'newPassword', type: sql.VarChar, value: hashedPassword },
//       { name: 'email', type: sql.VarChar, value: email },
//     ];

//     await queryDatabase(updateQuery, updateParams);

//     // Remove token if used
//     if (token) {
//       resetTokens.delete(token);
//     }

//     return res.status(200).json({
//       message: 'Password has been set successfully',
//       redirectTo: '/login',
//     });
//   } catch (error) {
//     console.error('Error setting password:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { queryDatabase } from 'lib/db';
import sql from 'mssql';

// In-memory store for reset tokens (use database in production)
const resetTokens = new Map();

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

function validatePassword(password) {
  // Allow letters, numbers, and special chars: @$!%*?&|
  const allowedCharsRegex = /^[A-Za-z\d@$!%*?&|]{8,72}$/;
  // Require uppercase, lowercase, number, and one special char
  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&|])[A-Za-z\d@$!%*?&|]{8,72}$/;
  
  if (!allowedCharsRegex.test(password)) {
    return {
      isValid: false,
      message: 'Password contains invalid characters. Only letters, numbers, and @$!%*?&| are allowed.'
    };
  }
  if (!complexityRegex.test(password)) {
    return {
      isValid: false,
      message: 'Password must be 8-72 characters and include at least one uppercase letter, lowercase letter, number, and special character (@$!%*?&|).'
    };
  }
  return { isValid: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, newPassword, confirmPassword, token } = req.body;

  // Validate input fields
  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Missing email or password fields' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    // If token is provided, validate it (for forgot password flow)
    if (token) {
      const storedToken = resetTokens.get(token);
      if (!storedToken || storedToken.email !== email || storedToken.expires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      // Verify JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.email !== email || decoded.type !== 'password_reset') {
          return res.status(400).json({ message: 'Invalid reset token' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
    }

    // Check OSLP table (salespersons)
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

      // Remove token if used
      if (token) {
        resetTokens.delete(token);
      }

      return res.status(200).json({
        message: 'Password has been set successfully',
        redirectTo: '/login',
      });
    }

    // Check OHEM table (employees) if not found in OSLP
    results = await queryDatabase(
      `SELECT email FROM OHEM WHERE email = @email`,
      [{ name: 'email', type: sql.VarChar, value: email }]
    );

    if (results.length > 0) {
      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update the employee's password
      const updateQuery = `
        UPDATE OHEM
        SET U_Password = @newPassword
        WHERE email = @email
      `;
      const updateParams = [
        { name: 'newPassword', type: sql.VarChar, value: hashedPassword },
        { name: 'email', type: sql.VarChar, value: email },
      ];

      await queryDatabase(updateQuery, updateParams);

      // Remove token if used
      if (token) {
        resetTokens.delete(token);
      }

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

    // Remove token if used
    if (token) {
      resetTokens.delete(token);
    }

    return res.status(200).json({
      message: 'Password has been set successfully',
      redirectTo: '/login',
    });
  } catch (error) {
    console.error('Error setting password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}