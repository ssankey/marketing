// pages/api/auth/login.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { queryDatabase } from 'lib/db';
import sql from 'mssql';

// Admin credentials
const ADMIN_CREDENTIALS = {
    email: 'satish@densitypharmachem.com',
    password: 'Satish@123'
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, password, contactCode } = req.body;

    // Check for admin login
    if (email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
        if (!password) {
            // Prompt frontend to show password field
            return res.status(200).json({ message: 'SHOW_PASSWORD_FIELD' });
        }

        if (password !== ADMIN_CREDENTIALS.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            email: ADMIN_CREDENTIALS.email,
            role: 'admin',
        }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict; Secure`);

        return res.status(200).json({
            message: 'Login_successful',
            token,
            user: {
                email: ADMIN_CREDENTIALS.email,
                role: 'admin',
                name: 'Admin'
            }
        });
    }

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Debug log the incoming request
        console.log('Request body:', {
            email,
            contactCode,
            hasPassword: !!password
        });

        const query = `SELECT CntctCode, Name, E_MailL, CardCode, Password FROM ocpr WHERE E_MailL = @email`;
        const results = await queryDatabase(query, [
            { name: 'email', type: sql.VarChar, value: email }
        ]);

        // Debug log the database results
        console.log('Database results:', results.map(user => ({
            CntctCode: user.CntctCode,
            Name: user.Name,
            Email: user.E_MailL,
            hasPassword: !!user.Password
        })));

        if (!results || results.length === 0) {
            return res.status(401).json({ message: 'User Not Found' });
        }

        // If multiple users found and no contact code provided, return user list
        if (results.length > 1 && !contactCode) {
            const users = results.map(({ Name, CntctCode }) => ({
                Name,
                CntctCode: CntctCode.toString().trim() // Ensure consistent format
            }));
            console.log('Multiple users found, returning list:', users);
            return res.status(200).json({
                message: 'SELECT_USER',
                users
            });
        }

        // Find user by contact code with type handling
        let user = null;
        if (contactCode) {
            console.log('Searching for contact code:', contactCode);
            console.log('Available contact codes:', results.map(u => ({
                code: u.CntctCode,
                type: typeof u.CntctCode
            })));

            // Try different type comparisons
            user = results.find(u => {
                const dbCode = u.CntctCode?.toString().trim();
                const inputCode = contactCode.toString().trim();
                console.log('Comparing:', { dbCode, inputCode });
                return dbCode === inputCode;
            });
        } else {
            user = results[0];
        }

        if (!user) {
            console.log('User not found after contact code check');
            return res.status(401).json({ message: 'User not found' });
        }

        console.log('Selected user:', {
            CntctCode: user.CntctCode,
            Name: user.Name,
            hasPassword: !!user.Password
        });

        // Check if Password field exists and has a value
        if (!user.Password || user.Password.trim() === '') {
            return res.status(200).json({
                message: 'PASSWORD_NOT_SET',
                email: user.E_MailL,
                contactCode: user.CntctCode.toString().trim()
            });
        }

        // If password exists but not provided in request, show password field
        if (!password) {
            return res.status(200).json({
                message: 'SHOW_PASSWORD_FIELD'
            });
        }

        // Verify password if provided
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect Password' });
        }

        // Create JWT token
        const token = jwt.sign({
            email: user.E_MailL,
            role: 'contact_person',
            contactCode: user.CntctCode.toString().trim()
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        });

        res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict; Secure`);

        return res.status(200).json({
            message: 'Login_successful',
            token,
            user: {
                email: user.E_MailL,
                role: 'contact_person',
                name: user.Name,
                cntctCode: user.CntctCode,
                cardCode: user.CardCode
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
