// pages/api/email/bulk-outstanding-mail/reset-mail-status.js

import { queryDatabase } from "lib/db";

/**
 * API to reset IsMailSent flag in OCRD table
 * Useful for testing or re-sending emails
 * 
 * Options:
 * - Reset for all customers
 * - Reset for specific customer (by CardCode)
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Extract parameters from request body
    const { customerCode, resetAll = false } = req.body;

    // ========================================
    // OPTION 1: Reset for specific customer
    // ========================================
    if (customerCode) {
      const updateQuery = `
        UPDATE OCRD 
        SET IsMailSent = 'NO' 
        WHERE CardCode = @customerCode
      `;

      await queryDatabase(updateQuery, [
        { name: "customerCode", type: "VarChar", value: customerCode },
      ]);

      console.log(`✅ IsMailSent reset to 'NO' for customer: ${customerCode}`);

      return res.status(200).json({
        success: true,
        message: `IsMailSent flag reset successfully for customer: ${customerCode}`,
        customerCode,
      });
    }

    // ========================================
    // OPTION 2: Reset for ALL customers
    // ========================================
    if (resetAll === true) {
      const updateQuery = `
        UPDATE OCRD 
        SET IsMailSent = 'NO' 
        WHERE CardType = 'C'
          AND E_Mail IS NOT NULL 
          AND E_Mail != ''
      `;

      const result = await queryDatabase(updateQuery, []);

      console.log(`✅ IsMailSent reset to 'NO' for all customers with emails`);

      return res.status(200).json({
        success: true,
        message: "IsMailSent flag reset successfully for all customers",
        resetAll: true,
      });
    }

    // ========================================
    // Invalid request
    // ========================================
    return res.status(400).json({
      success: false,
      message:
        "Please provide either 'customerCode' or 'resetAll: true' in request body",
    });
  } catch (error) {
    console.error("❌ Error resetting IsMailSent:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset IsMailSent flag",
      error: error.message,
    });
  }
}