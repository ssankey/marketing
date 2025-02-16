// pages/api/auth/login.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { queryDatabase } from 'lib/db';
import sql from 'mssql';
import { serialize } from 'cookie';

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 3600 // 1 hour in seconds
};
const ADMIN_CREDENTIALS = {
    email: 'satish@densitypharmachem.com',
    password: 'Satish@123'
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, password } = req.body;

    // Check for admin login
    if (email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
        if (!password) {
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

        // Set cookie
        res.setHeader('Set-Cookie', serialize('token', token, COOKIE_OPTIONS));

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
        const query = `SELECT CntctCode, Name, E_MailL, CardCode, Password FROM ocpr WHERE E_MailL = @email`;
        const results = await queryDatabase(query, [
            { name: 'email', type: sql.VarChar, value: email }
        ]);

        if (!results || results.length === 0) {
            return res.status(401).json({ message: 'User Not Found' });
        }

        const contactCodes = results.map(user => user.CntctCode.toString().trim());
        const cardCodes = [...new Set(results.map(user => user.CardCode.toString().trim()))]; // Unique card codes
        const userWithPassword = results.find(user => user.Password && user.Password.trim() !== '');

        if (!userWithPassword) {
            const token = jwt.sign({
                email,
                role: 'contact_person',
                contactCodes,
                cardCodes, // Store multiple card codes
            }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            });

            // Set cookie
            res.setHeader('Set-Cookie', serialize('token', token, COOKIE_OPTIONS));

            return res.status(200).json({
                message: 'PASSWORD_NOT_SET',
                token,
                email
            });
        }

        if (!password) {
            return res.status(200).json({
                message: 'SHOW_PASSWORD_FIELD'
            });
        }

        const isMatch = await bcrypt.compare(password, userWithPassword.Password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect Password' });
        }

        const token = jwt.sign({
            email,
            role: 'contact_person',
            contactCodes,
            cardCodes, // Store multiple card codes
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        });

        // Set cookie
        res.setHeader('Set-Cookie', serialize('token', token, COOKIE_OPTIONS));

        return res.status(200).json({
            message: 'Login_successful',
            token,
            user: {
                email,
                role: 'contact_person',
                name: userWithPassword.Name,
                cardCodes, // Return all card codes
                contactCodes
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