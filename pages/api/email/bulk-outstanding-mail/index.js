
// pages/api/email/bulk-outstanding-mail/index.js

import { queryDatabase } from "lib/db";
import sql from "mssql";

/**
 * Utility: small delay to avoid hammering the server
 */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Utility: robust JSON fetch that surfaces non-JSON/HTML responses cleanly
 */
async function fetchJSON(url, init) {
  const res = await fetch(url, init);
  const bodyPreview = async () => {
    try {
      const t = await res.text();
      return t.slice(0, 500);
    } catch {
      return "";
    }
  };

  if (!res.ok) {
    const preview = await bodyPreview();
    throw new Error(
      `Fetch failed ${res.status} ${res.statusText} for ${url}\n` +
      `Body: ${preview}`
    );
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const preview = await bodyPreview();
    throw new Error(
      `Expected JSON but got '${ct}' from ${url}\n` +
      `Body: ${preview}`
    );
  }

  return res.json();
}

/**
 * Main handler for bulk outstanding email API
 * - Sends outstanding invoice emails to all (or a subset) of customers
 * - Updates OCRD.IsMailSent = 'YES' when sent
 *
 * Request body:
 *   {
 *     "outstandingFilter": "Payment Pending" | "Payment Done",
 *     "cardCodes": ["C000011", "C000123"]   // optional; process only these
 *   }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    outstandingFilter = "Payment Pending",
    cardCodes = null, // optional array
  } = req.body || {};

  if (outstandingFilter === "Payment Done") {
    return res.status(400).json({
      success: false,
      message: "Cannot send mail for 'Payment Done' records",
    });
  }

  const results = [];
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // Build absolute base (server-side safe)
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const BASE =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${protocol}://${host}`;

  try {
    // =========================================================
    // STEP 1: Fetch customers with valid email, not yet mailed
    // =========================================================
    // NOTE: Use alias T0 to safely reference ValidFor (SAP B1 OCRD)
    let customerQuery = `
      SELECT T0.CardCode, T0.E_Mail, T0.CardName, T0.IsMailSent
      FROM OCRD T0
      WHERE T0.CardType = 'C'
        AND T0.ValidFor = 'Y'
        AND T0.E_Mail IS NOT NULL
        AND LTRIM(RTRIM(T0.E_Mail)) <> ''
        AND (T0.IsMailSent = 'NO' OR T0.IsMailSent IS NULL)
    `;

    const queryParams = [];

    if (Array.isArray(cardCodes) && cardCodes.length > 0) {
      const placeholders = cardCodes.map((_, i) => `@cardCode${i}`).join(", ");
      customerQuery += ` AND T0.CardCode IN (${placeholders})`;

      cardCodes.forEach((code, i) => {
        queryParams.push({
          name: `cardCode${i}`,
          type: sql.NVarChar,
          value: String(code).trim().toUpperCase(),
        });
      });

      console.log(`🎯 Limiting to CardCodes: ${cardCodes.join(", ")}`);
    }

    customerQuery += ` ORDER BY T0.CardCode`;

    const customers = await queryDatabase(customerQuery, queryParams);

    if (!customers || customers.length === 0) {
      const message =
        Array.isArray(cardCodes) && cardCodes.length > 0
          ? "No customers found for provided CardCodes with email and IsMailSent = 'NO'"
          : "No customers found with email and IsMailSent = 'NO'";
      return res.status(400).json({
        success: false,
        message,
        requestedCardCodes: cardCodes || "All customers",
      });
    }

    console.log(`📧 Starting bulk email for ${customers.length} customers...`);

    // =========================================================
    // STEP 2: Process each customer
    // =========================================================
    for (const c of customers) {
      const customerCode = c.CardCode;
      const email = c.E_Mail;
      const customerName = c.CardName;
      const mailStatus = c.IsMailSent;

      try {
        // 2.1: Skip if already YES (double-safety)
        if ((mailStatus || "").toUpperCase() === "YES") {
          results.push({
            customerCode,
            customerName,
            email,
            success: false,
            message: "Email already sent (IsMailSent = 'YES')",
          });
          skippedCount++;
          console.log(`⏭️ Skipped ${customerCode} - already sent`);
          continue;
        }

        // 2.2: Fetch outstanding invoices
        const outstandingUrl = `${BASE}/api/customers/${encodeURIComponent(
          customerCode
        )}/outstanding?getAll=true&filterType=${encodeURIComponent(
          outstandingFilter
        )}`;

        const { customerOutstandings } = await fetchJSON(outstandingUrl, {
          method: "GET",
        });

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

        // 2.3: Collect all invoice numbers
        const allInvoiceNumbers = customerOutstandings.map(
          (row) => row["Invoice No."]
        );

        // 2.4: Call send-single
        const sendMailUrl = `${BASE}/api/email/bulk-outstanding-mail/send-single`;
        const mailResult = await fetchJSON(sendMailUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerCode,
            email, // <-- send to customer email
            selectedInvoices: allInvoiceNumbers,
            outstandingFilter,
          }),
        });

        // 2.5: Update OCRD.IsMailSent
        try {
          const updateQuery = `
            UPDATE OCRD
            SET IsMailSent = 'YES'
            WHERE CardCode = @customerCode
          `;
          await queryDatabase(updateQuery, [
            { name: "customerCode", type: sql.NVarChar, value: customerCode },
          ]);
          console.log(
            `✅ Sent to ${customerCode} (${email}) | IsMailSent updated`
          );
        } catch (updateErr) {
          console.error(
            `⚠️ Email sent but failed to update IsMailSent for ${customerCode}:`,
            updateErr
          );
        }

        results.push({
          customerCode,
          customerName,
          email,
          success: true,
          messageId: mailResult.messageId,
          invoiceCount: mailResult.invoiceCount,
          isMailSentUpdated: true,
        });
        successCount++;

        // 2.6: Pace it
        await delay(1000);
      } catch (err) {
        console.error(`❌ Error processing ${customerCode}:`, err);
        results.push({
          customerCode,
          customerName,
          email,
          success: false,
          message: err.message || "Unknown error",
        });
        failureCount++;
      }
    }

    // =========================================================
    // STEP 3: Respond
    // =========================================================
    return res.status(200).json({
      success: true,
      message: `Bulk email done. Success: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`,
      successCount,
      failureCount,
      skippedCount,
      totalProcessed: customers.length,
      filterApplied:
        Array.isArray(cardCodes) && cardCodes.length > 0
          ? "Specific CardCodes"
          : "All customers",
      requestedCardCodes: cardCodes || "All",
      results,
    });
  } catch (error) {
    console.error("❌ Top-level error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers from database",
      error: error.message,
    });
  }
}
