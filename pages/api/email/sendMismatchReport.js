// pages/api/email/sendMismatchReport-test.js

import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

// Helper function to query specific database
async function queryTestDatabase(query, params = []) {
  const testConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.TEST_DB_DATABASE, // Use test_density database
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 60000,
    requestTimeout: 30000,
  };

  try {
    const pool = await sql.connect(testConfig);
    const request = pool.request();
    
    // Add parameters to the request
    params.forEach(param => {
      if (!param.name || !param.type || param.value === undefined) {
        throw new Error(`Invalid parameter: ${JSON.stringify(param)}`);
      }
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);
    await pool.close();
    return result.recordset;
    
  } catch (error) {
    console.error('Test database query error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Query that compares TEST_DENSITY.chemical_density with DENSITY_LIVE tables
    const mismatchQuery = `
      SELECT 
        cd.cat_size_main,
        -- Mismatch indicators
        CASE WHEN ISNULL(ow.OnHand, 0) != cd.stock THEN 'YES' ELSE 'NO' END as Stock_Mismatch,
        CASE WHEN o.U_WebsiteDisplay != cd.u_website_display THEN 'YES' ELSE 'NO' END as WebsiteDisplay_Mismatch,
        CASE 
          WHEN (valid_price.U_Price IS NULL OR valid_price.U_Price = 0) 
               AND (cd.price_in_inr IS NULL OR cd.price_in_inr = 0) THEN 'NO'
          WHEN valid_price.U_Price IS NULL AND cd.price_in_inr > 0 THEN 'YES'
          WHEN valid_price.U_Price > 0 AND cd.price_in_inr IS NULL THEN 'YES'
          WHEN valid_price.U_Price != cd.price_in_inr THEN 'YES'
          ELSE 'NO'
        END as PriceINR_Mismatch,
        CASE 
          WHEN (valid_price.U_PriceUSD IS NULL OR valid_price.U_PriceUSD = 0) 
               AND (cd.price_usd IS NULL OR cd.price_usd = 0) THEN 'NO'
          WHEN valid_price.U_PriceUSD IS NULL AND cd.price_usd > 0 THEN 'YES'
          WHEN valid_price.U_PriceUSD > 0 AND cd.price_usd IS NULL THEN 'YES'
          WHEN valid_price.U_PriceUSD != cd.price_usd THEN 'YES'
          ELSE 'NO'
        END as PriceUSD_Mismatch,
        -- Values
        ISNULL(ow.OnHand, 0) as Source_Stock,
        cd.stock as Backup_Stock,
        o.U_WebsiteDisplay as Source_WebsiteDisplay,
        cd.u_website_display as Backup_WebsiteDisplay,
        valid_price.U_Price as Source_Price_INR,
        cd.price_in_inr as Backup_Price_INR,
        valid_price.U_PriceUSD as Source_Price_USD,
        cd.price_usd as Backup_Price_USD,
        cd.UpdatedDate
      FROM chemical_density cd  -- This is from TEST_DENSITY database (current context)
      INNER JOIN DENSITY_LIVE.dbo.OITM o ON cd.cat_size_main = o.ItemCode  -- From LIVE database
      LEFT JOIN DENSITY_LIVE.dbo.OITW ow ON o.ItemCode = ow.ItemCode  -- From LIVE database
      OUTER APPLY (
        SELECT TOP 1 
          pr.U_Price,
          pr.U_PriceUSD
        FROM DENSITY_LIVE.dbo.[@PRICING_H] ph  -- From LIVE database
        INNER JOIN DENSITY_LIVE.dbo.[@PRICING_R] pr ON ph.DocEntry = pr.DocEntry  -- From LIVE database
        WHERE ph.U_Code = o.ItemCode 
        AND pr.U_Price IS NOT NULL
        ORDER BY ph.DocEntry DESC
      ) valid_price
      WHERE 
        ISNULL(ow.OnHand, 0) != cd.stock 
        OR o.U_WebsiteDisplay != cd.u_website_display
        OR (
          NOT (
            (valid_price.U_Price IS NULL OR valid_price.U_Price = 0) 
            AND (cd.price_in_inr IS NULL OR cd.price_in_inr = 0)
          )
          AND (
            valid_price.U_Price IS NULL OR 
            cd.price_in_inr IS NULL OR 
            valid_price.U_Price != cd.price_in_inr
          )
        )
        OR (
          NOT (
            (valid_price.U_PriceUSD IS NULL OR valid_price.U_PriceUSD = 0) 
            AND (cd.price_usd IS NULL OR cd.price_usd = 0)
          )
          AND (
            valid_price.U_PriceUSD IS NULL OR 
            cd.price_usd IS NULL OR 
            valid_price.U_PriceUSD != cd.price_usd
          )
        )
      ORDER BY cd.UpdatedDate DESC
    `;

    // Use the test database query function (this connects to TEST_DENSITY)
    const mismatches = await queryTestDatabase(mismatchQuery);

    if (!mismatches.length) {
      return res.status(200).json({
        success: true,
        message: "No data mismatches found between LIVE and TEST databases."
      });
    }

    // Filter ONLY the mismatched records for each category
    const stockMismatches = mismatches.filter(row => row.Stock_Mismatch === 'YES');
    const priceINRMismatches = mismatches.filter(row => row.PriceINR_Mismatch === 'YES');
    const priceUSDMismatches = mismatches.filter(row => row.PriceUSD_Mismatch === 'YES');
    const websiteDisplayMismatches = mismatches.filter(row => row.WebsiteDisplay_Mismatch === 'YES');

    // Generate HTML tables - ONLY show tables that actually have mismatches
    const generateTableHTML = (data, title, columns) => {
      if (!data.length) {
        return ''; // Return empty string if no mismatches in this category
      }

      const tableRows = data.map(row => `
        <tr>
          ${columns.map(col => `<td>${row[col] || 'N/A'}</td>`).join('')}
        </tr>
      `).join('');

      return `
        <h3>${title} (${data.length} records)</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
          <thead style="background-color: #f2f2f2;">
            <tr>
              ${columns.map(col => `<th style="text-align: left; padding: 8px;">${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    };

    // Build email content - only include tables that have data
    let emailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #d9534f;">Database Sync Mismatch Report</h2>
        <p><strong>Comparison:</strong> DENSITY_LIVE (Source) vs TEST_DENSITY (Backup)</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total records with mismatches: ${mismatches.length}</p>
    `;

    // Add tables only if they have mismatches
    const stockTable = generateTableHTML(stockMismatches, '1. Stock Mismatch', ['cat_size_main', 'Source_Stock', 'Backup_Stock']);
    const priceINRTable = generateTableHTML(priceINRMismatches, '2. Price in INR Mismatch', ['cat_size_main', 'Source_Price_INR', 'Backup_Price_INR']);
    const priceUSDTable = generateTableHTML(priceUSDMismatches, '3. Price in USD Mismatch', ['cat_size_main', 'Source_Price_USD', 'Backup_Price_USD']);
    const websiteTable = generateTableHTML(websiteDisplayMismatches, '4. Website Display Mismatch', ['cat_size_main', 'Source_WebsiteDisplay', 'Backup_WebsiteDisplay']);

    // Add tables to email content only if they have data
    if (stockTable) emailContent += stockTable;
    if (priceINRTable) emailContent += priceINRTable;
    if (priceUSDTable) emailContent += priceUSDTable;
    if (websiteTable) emailContent += websiteTable;

    // Show summary of mismatches
    emailContent += `
        <div style="margin-top: 20px; padding: 15px; background-color: #e9f7ef; border-left: 4px solid #28a745;">
          <h4>Mismatch Summary:</h4>
          <ul>
            <li>Stock Mismatches: ${stockMismatches.length}</li>
            <li>Price INR Mismatches: ${priceINRMismatches.length}</li>
            <li>Price USD Mismatches: ${priceUSDMismatches.length}</li>
            <li>Website Display Mismatches: ${websiteDisplayMismatches.length}</li>
          </ul>
        </div>
    `;

    emailContent += `
        <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
          <p><strong>Note:</strong> This report compares data between LIVE SAP system (DENSITY_LIVE) and TEST backup system (TEST_DENSITY).</p>
          <p>Source: DENSITY_LIVE database | Target: TEST_DENSITY.chemical_density table</p>
          <p>Please review and synchronize the data if needed.</p>
        </div>
      </div>
    `;

    // Send email
    const emailRes = await fetch(
      `${process.env.API_BASE_URL}/api/email/base_mail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "prakash@densitypharmachem.com",
          to: ["chandraprakashyadav1110@gmail.com","satish@densitypharmachem.com"],
          subject: `Database Sync Mismatch Report - ${new Date().toLocaleDateString()}`,
          body: emailContent,
        }),
      }
    );

    const result = await emailRes.json();
    if (!emailRes.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    console.log(`✅ Database sync mismatch report email sent successfully`);
    
    return res.status(200).json({
      success: true,
      message: `Database sync mismatch report sent successfully. Found ${mismatches.length} total records with mismatches between LIVE and TEST databases.`,
      summary: {
        totalRecords: mismatches.length,
        stockMismatches: stockMismatches.length,
        priceINRMismatches: priceINRMismatches.length,
        priceUSDMismatches: priceUSDMismatches.length,
        websiteDisplayMismatches: websiteDisplayMismatches.length
      }
    });

  } catch (error) {
    console.error("Send Database Sync Mismatch Report Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}