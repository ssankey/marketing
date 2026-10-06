// pages/api/email/bulk-outstanding-mail/check-status.js

import { queryDatabase } from "lib/db";

/**
 * API to check mail status for customers
 * Returns count of customers by mail status
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ========================================
    // Get count of customers by mail status
    // ========================================
    const statusQuery = `
      SELECT 
        COUNT(CASE WHEN IsMailSent = 'YES' THEN 1 END) as MailSentCount,
        COUNT(CASE WHEN IsMailSent = 'NO' OR IsMailSent IS NULL THEN 1 END) as MailNotSentCount,
        COUNT(*) as TotalCustomers
      FROM OCRD 
      WHERE E_Mail IS NOT NULL 
        AND E_Mail != ''
        AND CardType = 'C'
    `;

    const statusResult = await queryDatabase(statusQuery, []);
    const stats = statusResult[0];

    // ========================================
    // Get list of customers pending email
    // ========================================
    const pendingQuery = `
      SELECT TOP 10
        CardCode, 
        CardName, 
        E_Mail,
        IsMailSent
      FROM OCRD 
      WHERE E_Mail IS NOT NULL 
        AND E_Mail != ''
        AND CardType = 'C'
        AND (IsMailSent = 'NO' OR IsMailSent IS NULL)
      ORDER BY CardCode
    `;

    const pendingCustomers = await queryDatabase(pendingQuery, []);

    // ========================================
    // Return results
    // ========================================
    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers: stats.TotalCustomers || 0,
        mailSent: stats.MailSentCount || 0,
        mailNotSent: stats.MailNotSentCount || 0,
      },
      pendingCustomers: pendingCustomers.slice(0, 10), // First 10 customers pending email
      message: `${stats.MailNotSentCount || 0} customers are pending email`,
    });
  } catch (error) {
    console.error("❌ Error checking mail status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check mail status",
      error: error.message,
    });
  }
}