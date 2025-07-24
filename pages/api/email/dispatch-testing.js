
// pages/api/email/dispatch-testing.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

import { formatDate } from "utils/formatDate";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        Query to get recent invoices with tracking info updated yesterday
        const recentInvoicesQuery = `SELECT 
            DocEntry,
            DocNum                         AS InvoiceNo,
            TrackNo                        AS TrackingNumber,
            U_TrackingNoUpdateDT           AS TrackingUpdatedDate,
            U_TrackingNoUpdateTM           AS TrackingUpdatedTime,
            U_DispatchDate                 AS DispatchDate,
            U_DeliveryDate                 AS DeliveryDate,
            OINV.CardCode,
            U_EmailSentDT,
            U_EmailSentTM
        FROM OINV
        WHERE
            TrackNo IS NOT NULL
            AND U_TrackingNoUpdateDT IS NOT NULL
            AND CAST(U_TrackingNoUpdateDT AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)
            AND OINV.CardCode NOT IN ('C000021', 'C000020')
        `;

        // Execute the query to get invoices
        const invoices = await queryDatabase(recentInvoicesQuery);

        // Return early if no invoices found
        if (!invoices.length) {
            return res.status(200).json({ message: "No new shipments to notify." });
        }

        // Track success/failure counts
        let success = 0,
            failure = 0;

        // Get the base URL from environment or construct it
        const baseUrl = process.env.API_BASE_URL ;

        // Process each invoice
        for (const inv of invoices) {
            const {
                DocEntry,
                InvoiceNo,
                TrackingNumber,
                TrackingUpdatedDate,
                DispatchDate,
                DeliveryDate,
            } = inv;

            try {
                // Query to get detailed invoice information
                const detailQuery = `
                    SELECT
                        T0.DocNum                AS InvoiceNo,
                        T0.DocDate               AS InvoiceDate,
                        T4.DocNum                AS OrderNo,
                        T4.DocDate               AS OrderDate,
                        T0.TrackNo               AS TrackingNumber,
                        T0.U_TrackingNoUpdateDT  AS TrackingUpdatedDate,
                        T0.U_DispatchDate        AS DispatchDate,
                        T0.U_DeliveryDate        AS DeliveryDate,
                        T0.U_AirlineName         AS ShippingMethod,
                        SHP.TrnspName            AS TranspportName,
                        T0.CardName              AS CustomerName,
                        T0.CardCode              AS CustomerCode,
                        T7.Name                  AS ContactPerson,
                        T0.SlpCode               AS SalesPersonID,
                        T5.SlpName               AS SalesPersonName,
                        T5.Email                 AS SalesPersonEmail,
                        T7.E_MailL               AS ContactPersonEmail,
                        T6.PymntGroup            AS PaymentTerms,
                        T0.NumAtCard             AS CustomerPONo,
                        T1.ItemCode              AS ItemNo,
                        T1.Dscription            AS ItemDescription,
                        T1.U_CasNo               AS CasNo,
                        T1.UnitMsr               AS Unit,
                        T1.U_PackSize            AS PackSize,
                        T1.Price                 AS UnitSalesPrice,
                        T1.Quantity              AS Qty,
                        T1.LineTotal             AS TotalSalesPrice,
                        T9.E_Mail                AS CustomerEmail
                    FROM OINV  T0
                    LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
                    INNER JOIN INV1  T1 ON T1.DocEntry = T0.DocEntry
                    LEFT JOIN DLN1  T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
                    LEFT JOIN ODLN  T3 ON T3.DocEntry = T2.DocEntry
                    LEFT JOIN RDR1  T8 ON T8.DocEntry = T2.BaseEntry AND T8.LineNum = T2.BaseLine AND T2.BaseType = 17
                    LEFT JOIN ORDR  T4 ON T4.DocEntry = T8.DocEntry
                    INNER JOIN OCRD T9 ON T9.CardCode = T0.CardCode
                    LEFT JOIN OCPR  T7 ON T0.CntctCode = T7.CntctCode
                    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
                    INNER JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
                    WHERE T0.DocNum = @docNum
                    ORDER BY T1.LineNum;
                `;

                // Set parameters for the detail query
                const params = [{ name: "docNum", type: sql.Int, value: InvoiceNo }];
                const rows = await queryDatabase(detailQuery, params);
                
                // Throw error if no details found
                if (!rows.length) {
                    throw new Error("No details found for DocNum=" + DocEntry);
                }

                // Extract common fields from first row
                const {
                    InvoiceDate,
                    OrderNo,
                    OrderDate,
                    CustomerName,
                    CustomerEmail,
                    ShippingMethod,
                    TranspportName,
                    CustomerPONo,
                    SalesPersonName,
                    SalesPersonEmail,
                    ContactPersonEmail,
                    PaymentTerms,
                } = rows[0];

                // Log email addresses for debugging
                console.log(`Invoice ${InvoiceNo} → CustomerEmail:`, CustomerEmail);
                console.log(`Invoice ${InvoiceNo} → SalesPersonEmail:`, SalesPersonEmail);
                console.log(`Invoice ${InvoiceNo} -> Contact Person Email:`, ContactPersonEmail);

                // Validate contact person email exists
                if (!ContactPersonEmail || !ContactPersonEmail.trim()) {
                    throw new Error(`Missing Contact Person Email for Invoice ${InvoiceNo}`);
                }

                // Check if invoice PDF is available
                let pdfLinkHtml = '';
                try {
                    console.log(`🔍 Checking PDF availability for invoice ${InvoiceNo}...`);
                    console.log(`📡 API URL: ${baseUrl}/api/invoices/check-pdf-availability`);

                    const pdfCheckResponse = await fetch(
                        `${baseUrl}/api/invoices/check-pdf-availability`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ docNum: InvoiceNo }),
                        }
                    );

                    console.log(`📊 PDF check response status for invoice ${InvoiceNo}:`, pdfCheckResponse.status);
                    
                    if (pdfCheckResponse.ok) {
                        const pdfResult = await pdfCheckResponse.json();
                        console.log(`📋 PDF check result for invoice ${InvoiceNo}:`, pdfResult);

                        if (pdfResult.available) {
                            // Construct PDF download link
                            const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
                            const fullPdfUrl = `${hardcodedBaseUrl}${pdfResult.downloadUrl}?download=true`;
                            // const fullPdfUrl = `https://marketing.densitypharmachem.com${pdfResult.downloadUrl}?download=true`;
                            pdfLinkHtml = ` - <a href="${fullPdfUrl}" style="color: #007bff; text-decoration: underline;">PDF</a>`;
                            console.log(`✅ PDF link generated for invoice ${InvoiceNo}:`, pdfLinkHtml);
                        }
                        else {
                            console.log(`❌ PDF not available for invoice ${InvoiceNo}:`, pdfResult.message);
                        }
                    }
                     else {
                        const errorText = await pdfCheckResponse.text();
                        console.error(`🚨 PDF check failed for invoice ${InvoiceNo}:`, pdfCheckResponse.status, errorText);
                    }
                    
                    
                }
                catch (pdfError) {
                    console.error(`💥 Could not check PDF availability for invoice ${InvoiceNo}:`, pdfError);
                }

                // Check COA availability for each item and build table rows
                const htmlRows = [];
 
                // Create HTML bullet points for shipment details
                
                for (const r of rows) {
                    let coaLinkHtml = '';
                    
                    // Get VendorBatchNum from invoice detail API
                    if (r.ItemNo) {
                        try {
                            const detailResponse = await fetch(
                                `${baseUrl}/api/invoices/detail?docEntry=${DocEntry}&docNum=${InvoiceNo}`
                            );
                            
                            if (detailResponse.ok) {
                                const invoiceDetail = await detailResponse.json();
                                
                                // Find the matching line item
                                const matchingItem = invoiceDetail?.LineItems?.find(item => 
                                    item.ItemCode === r.ItemNo
                                );
                                
                                if (matchingItem && matchingItem.VendorBatchNum) {
                                    const coaCheckResponse = await fetch(
                                        `${baseUrl}/api/invoices/check-coa-availability`,
                                        {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ 
                                                itemCode: r.ItemNo, 
                                                vendorBatchNum: matchingItem.VendorBatchNum 
                                            }),
                                        }
                                    );
                                    
                                    if (coaCheckResponse.ok) {
                                        const coaResult = await coaCheckResponse.json();
                                        if (coaResult.available) {
                                            // Create filename for COA
                                            const coaFilename = `COA_${r.ItemNo}_${matchingItem.VendorBatchNum}.pdf`;
                                            
                                            // Use download proxy instead of direct link
                                            const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
                                            const proxyDownloadUrl = `${baseUrl}/api/invoices/download-coa?url=${encodeURIComponent(coaResult.downloadUrl)}&filename=${encodeURIComponent(coaFilename)}`;
                                            
                                            coaLinkHtml = `<a href="${proxyDownloadUrl}" style="color: #007bff; text-decoration: underline;">COA</a>`;
                                            
                                            console.log(`✅ COA proxy link generated for ${r.ItemNo}:`, proxyDownloadUrl);
                                        }
                                    }
                                }
                            }
                        } catch (coaError) {
                            console.warn(`Could not check COA availability for item ${r.ItemNo}:`, coaError);
                        }
                    }

                    // Add row to HTML table (rest remains the same)
                    htmlRows.push(`
                        <tr>
                            <td style="border:1px solid #ccc; padding:4px;">${r.InvoiceNo}</td>
                            <td style="border:1px solid #ccc; padding:4px;">${formatDate(r.InvoiceDate)}</td>
                            <td style="border:1px solid #ccc; padding:4px;">${r.ItemNo}</td>
                            <td style="border:1px solid #ccc; padding:4px;">${r.ItemDescription}</td>
                            <td style="border:1px solid #ccc; padding:4px;">${r.CasNo || ""}</td>
                            <td style="border:1px solid #ccc; padding:4px;">${r.Unit}</td>
                            <td style="border:1px solid #ccc; padding:4px;">${r.PackSize || ""}</td>
                            <td style="border:1px solid #ccc; padding:4px; text-align:right;">${formatNumberWithIndianCommas(r.UnitSalesPrice)}</td>
                            <td style="border:1px solid #ccc; padding:4px; text-align:center;">${r.Qty}</td>
                            <td style="border:1px solid #ccc; padding:4px; text-align:right;">${formatNumberWithIndianCommas(r.TotalSalesPrice)}</td>
                            <td style="border:1px solid #ccc; padding:4px; text-align:center;">${coaLinkHtml}</td>
                        </tr>
                    `);
                }

                const bulletsHtml = `
                    <ul>
                        <li><strong>Carrier name:</strong> ${TranspportName}</li>
                        <li><strong>Tracking Number:</strong> ${TrackingNumber} – Dated # ${formatDate(TrackingUpdatedDate)}</li>
                        <li><strong>Estimated Delivery Date:</strong> ${formatDate(DeliveryDate)}</li>
                        <li><strong>Our Invoice Number:</strong> ${InvoiceNo}${pdfLinkHtml}</li>
                    </ul>
                `;

                // Construct full HTML email content
                const html = `
                    <div style="font-family: Arial, sans-serif;font-size: 14px; line-height:1.4; color:#333;">
                        <p>Dear Valued Customer,</p>
                        <p>Your order <strong>${CustomerPONo}</strong> has been shipped.</p>
                        <p><strong>Here are the tracking details:</strong></p>
                        ${bulletsHtml}
                        <p><strong>Items Shipped:</strong></p>
                        <table style="border-collapse:collapse; width:100%; margin-top:8px; margin-bottom:16px;">
                            <thead>
                                <tr style="background:#f7f7f7;">
                                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Inv#</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">INV Date</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Item No.</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Item/Service Description</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">CAS No.</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Unit</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Packsize</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:right;">Unit Sales Price</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:center;">QTY</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:right;">Total Sales Price</th>
                                    <th style="border:1px solid #ccc; padding:6px; text-align:center;">COA</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${htmlRows.join('')}
                            </tbody>
                        </table>
                        <p>
                            If you have any questions or need assistance, please don't hesitate to reach out to us at sales@densitypharmachem.com.
                        </p>
                        <p>Thank you for your purchase and support!</p>
                        <strong>Website: www.densitypharmachem.com</strong><br/><br/>
                        DENSITY PHARMACHEM PRIVATE LIMITED<br/>
                        Sy No 615/A & 624/2/1, Pudur Village<br/>
                        Medchal-Malkajgiri District,<br/>
                        Hyderabad, Telangana, India-501401<br/>
                        <img src="https://marketing.densitypharmachem.com/assets/Density_LOGO.jpg" 
                        alt="Density Pharmachem" 
                        width="180" 
                        style="height:60px; width:auto; max-width:180px; margin-top:10px; border:0; display:block;">

                    </div>
                `;

                // Set email subject and send
                const subject = `Shipment tracking details # order no- ${CustomerPONo}`;
                const sendRes = await fetch(
                    `${baseUrl}/api/email/base_mail`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            from: "prakash@densitypharmachem.com",
                            to: ["chandraprakashyadav1110@gmail.com"],  
                            subject: subject,
                            body: html,
                        }),
                    }
                );

                // Handle email send failure
                if (!sendRes.ok) {
                    const errText = await sendRes.text();
                    throw new Error(`base_mail failed: ${errText}`);
                }

                success++;
            } catch (err) {
                console.error(`Invoice ${InvoiceNo} failed:`, err);
                failure++;
            }
        }

        // Return final results
        return res.status(200).json({
            success: true,
            message: `Notified ${success} shipments, ${failure} failures.`,
        });
    } catch (err) {
        console.error("sendShipmentNotification error:", err);
        return res.status(500).json({ error: err.message });
    }
}