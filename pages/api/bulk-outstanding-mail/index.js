 // pages/api/email/bulk-outstanding-mail/index.js

import { queryDatabase } from "lib/db";
import sql from "mssql";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { outstandingFilter = "Payment Pending" } = req.body;

  if (outstandingFilter === "Payment Done") {
    return res.status(400).json({
      success: false,
      message: "Cannot send mail for 'Payment Done' records",
    });
  }

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;

  try {
    // Fetch all customer codes from OCRD table that have email addresses
    const customerQuery = `
      SELECT CardCode, E_Mail, CardName 
      FROM OCRD 
      WHERE E_Mail IS NOT NULL 
      AND E_Mail != ''
      AND CardType = 'C'
      ORDER BY CardCode
    `;
    
    const customers = await queryDatabase(customerQuery, []);
    
    if (!customers || customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No customers found with email addresses",
      });
    }

    console.log(`📧 Starting bulk email process for ${customers.length} customers...`);

    // Process each customer one by one
    for (const customer of customers) {
      const { CardCode: customerCode, E_Mail: email, CardName: customerName } = customer;
      
      try {

        // Fetch all outstanding invoices for this customer
        const outstandingUrl = `${protocol}://${host}/api/customers/${customerCode}/outstanding?getAll=true&filterType=${outstandingFilter}`;
        const outstandingRes = await fetch(outstandingUrl);
        
        if (!outstandingRes.ok) {
          throw new Error("Failed to fetch outstanding data");
        }

        const { customerOutstandings } = await outstandingRes.json();

        if (!customerOutstandings || customerOutstandings.length === 0) {
          results.push({
            customerCode,
            customerName,
            email,
            success: false,
            message: "No outstanding invoices found",
          });
          failureCount++;
          continue;
        }

        // Get all invoice numbers for this customer
        const allInvoiceNumbers = customerOutstandings.map(item => item["Invoice No."]);

        // Call the send-single API
        const sendMailUrl = `${protocol}://${host}/api/email/bulk-outstanding-mail/send-single`;
        const mailRes = await fetch(sendMailUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerCode,
            email,
            selectedInvoices: allInvoiceNumbers,
            outstandingFilter
          }),
        });

        const mailResult = await mailRes.json();

        if (mailRes.ok) {
          results.push({
            customerCode,
            customerName,
            email,
            success: true,
            messageId: mailResult.messageId,
            invoiceCount: allInvoiceNumbers.length,
          });
          successCount++;
          console.log(`✅ Email sent to ${customerCode} - ${customerName} (${email})`);
        } else {
          results.push({
            customerCode,
            customerName,
            email,
            success: false,
            message: mailResult.message || "Failed to send email",
          });
          failureCount++;
          console.error(`❌ Failed to send to ${customerCode}: ${mailResult.message}`);
        }

        // Add 1 second delay between emails
        await delay(1000);

      } catch (error) {
        console.error(`❌ Error processing ${customerCode}:`, error);
        
        results.push({
          customerCode,
          customerName,
          success: false,
          message: error.message || "Unknown error",
        });
        
        failureCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk email process completed. Success: ${successCount}, Failed: ${failureCount}`,
      successCount,
      failureCount,
      totalProcessed: customers.length,
      results,
    });

  } catch (error) {
    console.error("❌ Database error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers from database",
      error: error.message,
    });
  }
}