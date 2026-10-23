// // pages/api/email/sendInvoiceEmail.js
// import { queryDatabase } from "../../../lib/db";
// import sql from "mssql";
// import { formatDate } from "utils/formatDate";
// import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

// export default async function handler(req, res) {
//   const start = Date.now();

//   if (req.method !== "POST") {
//     console.error(`[sendInvoiceEmail] Invalid method: ${req.method}`);
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const { docEntry, docNum } = req.body;
//   console.log(
//     `[sendInvoiceEmail] Started for DocEntry=${docEntry}, DocNum=${docNum}`
//   );

//   try {
//     // 0) Check if email already sent
//     const statusRows = await queryDatabase(
//       `SELECT U_EmailSentDT, U_EmailSentTM ,CardCode, CardName 
//        FROM OINV 
//        WHERE DocNum = @docNum
       
//       `,
//       [{ name: "docNum", type: sql.Int, value: docNum }]
//     );

//     const status = statusRows[0] || {};
//     // Check if email is disabled based on CardCode
//     if (status.CardCode === "C000021" || status.CardCode === "C000020") {
//       console.warn(
//         `[sendInvoiceEmail] Email sending disabled for: ${status.CardCode} (${status.CardName})`
//       );
//       return res.status(200).json({
//         success: false,
//         message: `Email disabled for ${status.CardName || "this customer"}`,
//       });
//     }
//     if (status.U_EmailSentDT || status.U_EmailSentTM) {
//       console.log(
//         `[sendInvoiceEmail] Already sent at ${status.U_EmailSentDT} / ${status.U_EmailSentTM}`
//       );
//       return res.status(200).json({
//         success: false,
//         message: `Email already sent on ${new Date(status.U_EmailSentDT).toLocaleString()}`,
//       });
//     }

//     // 1) Fetch invoice details
//     const detailQuery = `
//       SELECT
//         T0.DocNum                AS InvoiceNo,
//         T0.DocDate               AS InvoiceDate,
//         T4.DocNum                AS OrderNo,
//         T4.DocDate               AS OrderDate,
//         T0.TrackNo               AS TrackingNumber,
//         T0.U_TrackingNoUpdateDT  AS TrackingUpdatedDate,
//         T0.U_DispatchDate        AS DispatchDate,
//         T0.U_DeliveryDate        AS DeliveryDate,
//         T0.U_AirlineName         AS ShippingMethod,
//         SHP.TrnspName            AS TranspportName,
//         T0.CardName              AS CustomerName,
//         T0.CardCode              AS CustomerCode,
//         T7.Name                  AS ContactPerson,
//         T0.SlpCode               AS SalesPersonID,
//         T5.SlpName               AS SalesPersonName,
//         T5.Email                 AS SalesPersonEmail,
//         T7.E_MailL               AS ContactPersonEmail,
//         T6.PymntGroup            AS PaymentTerms,
//         T0.NumAtCard             AS CustomerPONo,
//         T1.ItemCode              AS ItemNo,
//         T1.Dscription            AS ItemDescription,
//         T1.U_CasNo               AS CasNo,
//         T1.UnitMsr               AS Unit,
//         T1.U_PackSize            AS PackSize,
//         T1.Price                 AS UnitSalesPrice,
//         T1.Quantity              AS Qty,
//         T1.LineTotal             AS TotalSalesPrice,
//         T9.E_Mail                AS CustomerEmail
//       FROM OINV  T0
//       LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
//       INNER JOIN INV1  T1 ON T1.DocEntry = T0.DocEntry
//       LEFT JOIN DLN1  T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
//       LEFT JOIN ODLN  T3 ON T3.DocEntry = T2.DocEntry
//       LEFT JOIN RDR1  T8 ON T8.DocEntry = T2.BaseEntry AND T8.LineNum = T2.BaseLine AND T2.BaseType = 17
//       LEFT JOIN ORDR  T4 ON T4.DocEntry = T8.DocEntry
//       INNER JOIN OCRD T9 ON T9.CardCode = T0.CardCode
//       LEFT JOIN OCPR  T7 ON T0.CntctCode = T7.CntctCode
//       INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//       INNER JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
//       WHERE T0.DocNum = @docNum
//       ORDER BY T1.LineNum;
//     `;

//     const rows = await queryDatabase(detailQuery, [
//       { name: "docNum", type: sql.Int, value: docNum },
//     ]);

//     if (!rows.length) {
//       throw new Error("No details found for DocNum=" + docNum);
//     }

//     const {
//       InvoiceNo,
//       InvoiceDate,
//       OrderNo,
//       OrderDate,
//       CustomerName,
//       CustomerEmail,
//       ShippingMethod,
//       TranspportName,
//       CustomerPONo,
//       SalesPersonName,
//       SalesPersonEmail,
//       ContactPersonEmail,
//       PaymentTerms,
//       TrackingNumber,
//       TrackingUpdatedDate,
//       DeliveryDate,
//     } = rows[0];

//     console.log("Contac Person Email", ContactPersonEmail);
//     console.log("Sales Person Email", SalesPersonEmail);

//     // 2) Validate recipient
//     if (!ContactPersonEmail || !ContactPersonEmail.trim()) {
//       throw new Error(`Missing Contact Person Email for Invoice ${InvoiceNo}`);
//     }

//     // 3) Build HTML body
//     const bulletsHtml = `
//       <ul>
//         <li><strong>Carrier name:</strong> ${TranspportName}</li>
//         <li><strong>Tracking Number:</strong> ${TrackingNumber || "N/A"} – Dated # ${TrackingUpdatedDate ? formatDate(TrackingUpdatedDate) : "N/A"}</li>
//         <li><strong>Estimated Delivery Date:</strong> ${DeliveryDate ? formatDate(DeliveryDate) : "N/A"}</li>
//         <li><strong>Our Invoice Number:</strong> ${InvoiceNo}</li>
//       </ul>
//     `;

//     const htmlRows = rows
//       .map(
//         (r) => `
//       <tr>
//         <td style="border:1px solid #ccc; padding:4px;">${r.InvoiceNo}</td>
//         <td style="border:1px solid #ccc; padding:4px;">${formatDate(r.InvoiceDate)}</td>
//         <td style="border:1px solid #ccc; padding:4px;">${r.ItemNo}</td>
//         <td style="border:1px solid #ccc; padding:4px;">${r.ItemDescription}</td>
//         <td style="border:1px solid #ccc; padding:4px;">${r.CasNo || ""}</td>
//         <td style="border:1px solid #ccc; padding:4px;">${r.Unit}</td>
//         <td style="border:1px solid #ccc; padding:4px;">${r.PackSize || ""}</td>
//         <td style="border:1px solid #ccc; padding:4px; text-align:right;">${formatNumberWithIndianCommas(r.UnitSalesPrice)}</td>
//         <td style="border:1px solid #ccc; padding:4px; text-align:center;">${r.Qty}</td>
//         <td style="border:1px solid #ccc; padding:4px; text-align:right;">${formatNumberWithIndianCommas(r.TotalSalesPrice)}</td>
//       </tr>
//     `
//       )
//       .join("");

//     const html = `
//       <div style="font-family: Arial, sans-serif; line-height:1.4; color:#333;">
//         <p>Dear Valued Customer,</p>
//         <p>Your order <strong>${CustomerPONo}</strong> has been shipped.</p>
//         <p><strong>Here are the tracking details:</strong></p>
//         ${bulletsHtml}
//         <p><strong>Items Shipped:</strong></p>
//         <table style="border-collapse:collapse; width:100%; margin-top:8px; margin-bottom:16px;">
//           <thead>
//             <tr style="background:#f7f7f7;">
//               <th style="border:1px solid #ccc; padding:6px; text-align:left;">Inv#</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:left;">INV Date</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:left;">Item No.</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:left;">Item/Service Description</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:left;">CAS No.</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:left;">Unit</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:left;">Packsize</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:right;">Unit Sales Price</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:center;">QTY</th>
//               <th style="border:1px solid #ccc; padding:6px; text-align:right;">Total Sales Price</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${htmlRows}
//           </tbody>
//         </table>
//         <p>
//           If you have any questions or need assistance, please don't hesitate to reach out to us at sales@densitypharmachem.com.
//         </p>
//         <p>Thank you for your purchase and support!</p>
//         <strong>Website: www.densitypharmachem.com</strong><br/><br/>
//         DENSITY PHARMACHEM PRIVATE LIMITED<br/>
//         Sy No 615/A & 624/2/1, Pudur Village<br/>
//         Medchal-Malkajgiri District,<br/>
//         Hyderabad, Telangana, India-501401<br/>
//       </div>
//     `;

//     // 4) Send email
//     const subject = `Shipment tracking details # order no- ${CustomerPONo}`;
//     const emailRes = await fetch(
//       `${process.env.API_BASE_URL}/api/email/base_mail`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           from: "sales@densitypharmachem.com",
//           to: [ContactPersonEmail],
//           cc: [SalesPersonEmail],
//           bcc: ["chandraprakashyadav1110@gmail.com"],
//           //   from: "prakash@densitypharmachem.com",
//           //   to: "chandraprakashyadav1110@gmail.com",
//           subject: subject,
//           body: html,
//         }),
//       }
//     );

//     if (!emailRes.ok) {
//       const errText = await emailRes.text();
//       throw new Error(`base_mail failed: ${errText}`);
//     }

//     // 5) Update sent timestamp
//     const now = new Date();
//     const totalMinutes = now.getHours() * 60 + now.getMinutes();

//     await queryDatabase(
//       `UPDATE OINV
//        SET U_EmailSentDT = GETDATE(),
//            U_EmailSentTM = @time
//        WHERE DocNum = @docNum`,
//       [
//         { name: "time", type: sql.SmallInt, value: totalMinutes },
//         { name: "docNum", type: sql.Int, value: docNum },
//       ]
//     );

//     console.log(
//       `[sendInvoiceEmail] Success for DocNum=${docNum} in ${Date.now() - start}ms`
//     );
//     return res.status(200).json({
//       success: true,
//       EmailSentDT: now.toISOString(),
//       EmailSentTM: totalMinutes,
//     });
//   } catch (err) {
//     console.error(
//       `[sendInvoiceEmail] Uncaught error for DocNum=${docNum}:`,
//       err.stack
//     );
//     return res.status(500).json({ success: false, error: err.message });
//   }
// }


// pages/api/email/sendInvoiceEmail.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";
import { formatDate } from "utils/formatDate";
import { formatCurrency } from "utils/formatCurrency";

// Helper function to generate tracking link
const generateTrackingLink = (transportName, trackingNumber) => {
    if (!transportName || !trackingNumber) return null;
    
    const lowerTransportName = transportName.toLowerCase();
    
    if (lowerTransportName.includes('shree maruti')) {
        return `https://trackcourier.io/track-and-trace/shree-maruti-courier/${trackingNumber}`;
    } else if (lowerTransportName.includes('bluedart') || lowerTransportName.includes('blue dart')) {
        return `https://trackcourier.io/track-and-trace/blue-dart-courier/${trackingNumber}`;
    }
    
    return null;
};

// Helper function to generate tracking link HTML
const generateTrackingLinkHtml = (trackingLink) => {
    if (!trackingLink) return '';
    return `<li>
        <strong>Click to Track shipment:</strong>
        <a href="${trackingLink}" target="_blank" style="display: inline-block; background-color: #007bff; color: white !important; padding: 4px 12px; font-size: 14px; text-decoration: none !important; border-radius: 4px; font-weight: bold; margin-left: 8px; vertical-align: middle;">
            🚚 Track Shipment
        </a>
    </li>`;
};

// Function to check PDF availability
const checkPdfAvailability = async (invoiceNo, baseUrl) => {
    let pdfLinkHtml = '';
    let isPdfAvailable = false;
    
    try {
        const pdfCheckResponse = await fetch(
            `${baseUrl}/api/invoices/check-pdf-availability`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ docNum: invoiceNo }),
            }
        );
        
        if (pdfCheckResponse.ok) {
            const pdfResult = await pdfCheckResponse.json();
            if (pdfResult.available) {
                isPdfAvailable = true;
                // HARDCODED BASE URL for email links
                const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
                pdfLinkHtml = `${hardcodedBaseUrl}${pdfResult.downloadUrl}?download=true`;
            }
        }
    } catch (error) {
        console.error('PDF check failed:', error);
    }

    return { pdfLinkHtml, isPdfAvailable };
};

// Function to check if COA PDF is actually available
const checkCoaAvailability = async (coaUrl) => {
    if (!coaUrl) return false;
    
    try {
        const response = await fetch(coaUrl, {
            method: 'HEAD',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            const getResponse = await fetch(coaUrl, {
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1',
                    'Cache-Control': 'no-cache'
                }
            });
            
            return getResponse.ok || getResponse.status === 206;
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            console.log('COA returned JSON instead of PDF, marking as unavailable');
            return false;
        }
        
        return response.ok;
        
    } catch (error) {
        console.error('Error checking COA availability:', error);
        return false;
    }
};

// Helper function to generate COA URL based on source type
const generateCoaUrl = (row, baseUrl) => {
    // HARDCODED BASE URL for email links (to prevent localhost issues on mobile)
    const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
    
    const { CoaSource, LocalCOAFilename, EnergyCoaUrl, ItemNo, VendorBatchNum } = row;
    
    console.log(`Generating COA URL for ${ItemNo}:`, {
        CoaSource,
        LocalCOAFilename: LocalCOAFilename ? `"${LocalCOAFilename}"` : 'null/empty',
        EnergyCoaUrl: EnergyCoaUrl ? `"${EnergyCoaUrl}"` : 'null/empty',
        VendorBatchNum: VendorBatchNum ? `"${VendorBatchNum}"` : 'null/empty'
    });
    
    switch (CoaSource) {
        case 'LOCAL':
            if (LocalCOAFilename && LocalCOAFilename.trim() !== '') {
                let filename = LocalCOAFilename.trim();
                
                if (filename.includes('\\')) {
                    const pathParts = filename.split('\\');
                    filename = pathParts[pathParts.length - 1];
                }
                
                if (filename.includes('/')) {
                    const pathParts = filename.split('/');
                    filename = pathParts[pathParts.length - 1];
                }
                
                const encodedFilename = encodeURIComponent(filename);
                const localUrl = `${hardcodedBaseUrl}/api/coa/download/${encodedFilename}`;
                console.log(`  Generated LOCAL URL (hardcoded): ${localUrl}`);
                return localUrl;
            }
            break;
            
        case 'ENERGY':
            if (ItemNo && VendorBatchNum && VendorBatchNum.trim() !== '') {
                const proxyUrl = `${hardcodedBaseUrl}/api/coa/download-energy/${encodeURIComponent(ItemNo)}/${encodeURIComponent(VendorBatchNum.trim())}`;
                console.log(`  Generated ENERGY PROXY URL (hardcoded): ${proxyUrl}`);
                return proxyUrl;
            }
            break;
            
        case 'NONE':
        default:
            console.log(`  No COA available`);
            return null;
    }
    
    console.log(`  Fallback: No valid COA URL found`);
    return null;
};

// Function to generate COA URL and check availability
const generateAndCheckCoaUrl = async (row, baseUrl) => {
    const coaUrl = generateCoaUrl(row, baseUrl);
    
    if (!coaUrl) {
        console.log(`No COA URL generated for ${row.ItemNo}`);
        return null;
    }
    
    console.log(`Checking availability for ${row.ItemNo}: ${coaUrl}`);
    const isAvailable = await checkCoaAvailability(coaUrl);
    
    if (isAvailable) {
        console.log(`COA available for ${row.ItemNo}`);
        return coaUrl;
    } else {
        console.log(`COA not available for ${row.ItemNo}`);
        return null;
    }
};

// Updated table row generation with COA availability checking
const generateTableRows = async (rows, docEntry, invoiceNo, baseUrl) => {
    const htmlRows = [];
    let hasCOA = false;

    console.log(`Generating table rows for ${rows.length} items`);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let coaLink = '';
        let coaText = '';
        
        console.log(`Processing row ${i + 1} - ItemNo: ${row.ItemNo}`);
        console.log(`  LocalCOAFilename: "${row.LocalCOAFilename}"`);
        console.log(`  EnergyCoaUrl: "${row.EnergyCoaUrl}"`);
        console.log(`  CoaSource: "${row.CoaSource}"`);

        coaLink = await generateAndCheckCoaUrl(row, baseUrl);
        
        if (coaLink) {
            if (row.CoaSource === 'LOCAL') {
                coaText = 'COA';
            } else if (row.CoaSource === 'ENERGY') {
                coaText = 'COA';
            } else {
                coaText = 'View COA';
            }
            hasCOA = true;
            console.log(`  Using ${row.CoaSource} COA: ${coaLink}`);
        } else {
            console.log(`  No COA available for this item`);
        }

        htmlRows.push(`
            <tr>
                <td style="border:1px solid #ccc; padding:6px; text-align:left;">${row.InvoiceNo || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:left;">${formatDate(row.InvoiceDate) || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:left;">${row.ItemNo || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:left;">${row.ItemDescription || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:left;">${row.CasNo || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:left;">${row.Unit || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:left;">${row.PackSize || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:right;">${formatCurrency(row.UnitSalesPrice) || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:center;">${row.Qty || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:right;">${formatCurrency(row.TotalSalesPrice) || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:center;">
                    ${coaLink ? 
                        `<a href="${coaLink}" target="_blank" style="color: #007bff; text-decoration: underline; font-size: 12px;">
                            ${coaText}
                        </a>` 
                        : '<span style="font-size: 0.75rem; color: #6c757d;"> </span>'}
                </td>
            </tr>
        `);
    }

    console.log(`Generated ${htmlRows.length} table rows, hasCOA: ${hasCOA}`);
    return { htmlRows, hasCOA };
};

export default async function handler(req, res) {
    const start = Date.now();

    if (req.method !== "POST") {
        console.error(`[sendInvoiceEmail] Invalid method: ${req.method}`);
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { docEntry, docNum } = req.body;
    console.log(`[sendInvoiceEmail] Started for DocEntry=${docEntry}, DocNum=${docNum}`);

    try {
        // Check if email already sent and validate CardCode
        const statusRows = await queryDatabase(
            `SELECT U_EmailSentDT, U_EmailSentTM, CardCode, CardName 
             FROM OINV 
             WHERE DocNum = @docNum`,
            [{ name: "docNum", type: sql.Int, value: docNum }]
        );

        const status = statusRows[0] || {};
        
        // Check if email is disabled based on CardCode
        if (status.CardCode === "C000021" || status.CardCode === "C000020") {
            console.warn(`[sendInvoiceEmail] Email sending disabled for: ${status.CardCode} (${status.CardName})`);
            return res.status(200).json({
                success: false,
                message: `Email disabled for ${status.CardName || "this customer"}`,
            });
        }

        if (status.U_EmailSentDT || status.U_EmailSentTM) {
            console.log(`[sendInvoiceEmail] Already sent at ${status.U_EmailSentDT} / ${status.U_EmailSentTM}`);
            return res.status(200).json({
                success: false,
                message: `Email already sent on ${new Date(status.U_EmailSentDT).toLocaleString()}`,
            });
        }

        // Updated query to match dispatch-mail structure with COA fields
        const detailQuery = `
            SELECT TOP 6
                T0.DocNum                AS InvoiceNo,
                T0.DocDate               AS InvoiceDate,
                T4.DocNum                AS OrderNo,
                T4.DocDate               AS OrderDate,
                T0.TrackNo               AS TrackingNumber,
                T0.U_TrackingNoUpdateDT  AS TrackingUpdatedDate,
                T0.U_DispatchDate        AS DispatchDate,
                T0.U_DeliveryDate        AS DeliveryDate,
                T0.U_AirlineName         AS ShippingMethod,
                SHP.TrnspName            AS TransportName,
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
                T9.E_Mail                AS CustomerEmail,
                ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum,
                T15.U_COA                AS LocalCOAFilename,
                
                -- Energy URL (fallback COA) - ONLY when no local COA exists
                CASE 
                  WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS VARCHAR(500)))) <> '' 
                  THEN ''  -- Don't generate energy URL if local COA exists
                  WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND T1.ItemCode <> '' 
                  THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' + 
                        LEFT(T1.ItemCode, CHARINDEX('-', T1.ItemCode + '-') - 1) + '_' + T15.U_vendorbatchno + '.pdf'
                  ELSE ''
                END AS EnergyCoaUrl,
                
                -- COA Source determination
                CASE 
                  WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS VARCHAR(500)))) <> '' 
                  THEN 'LOCAL'
                  WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND T1.ItemCode <> '' 
                  THEN 'ENERGY'
                  ELSE 'NONE'
                END AS CoaSource
                
                FROM OINV T0
                LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
                INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
                LEFT JOIN DLN1 T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
                LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
                LEFT JOIN RDR1 T8 ON T8.DocEntry = T2.BaseEntry AND T8.LineNum = T2.BaseLine AND T2.BaseType = 17
                LEFT JOIN ORDR T4 ON T4.DocEntry = T8.DocEntry
                INNER JOIN OCRD T9 ON T9.CardCode = T0.CardCode
                LEFT JOIN OCPR T7 ON T0.CntctCode = T7.CntctCode
                INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
                INNER JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
               
                LEFT JOIN IBT1 T10 ON T10.CardCode = T3.CardCode 
                    AND T10.ItemCode = T2.ItemCode 
                    AND T10.BaseNum = T3.DocNum 
                    AND T10.BaseEntry = T3.DocEntry 
                    AND T10.BaseType = 15 
                    AND T10.BaseLinNum = T2.LineNum 
                    AND T10.Direction = 1
                LEFT JOIN OIBT T15 ON T10.ItemCode = T15.ItemCode 
                    AND T10.BatchNum = T15.BatchNum
              
                WHERE T0.DocNum = @docNum
                ORDER BY T1.LineNum;
        `;

        const rows = await queryDatabase(detailQuery, [
            { name: "docNum", type: sql.Int, value: docNum },
        ]);

        if (!rows.length) {
            throw new Error("No details found for DocNum=" + docNum);
        }

        const {
            InvoiceNo,
            InvoiceDate,
            OrderNo,
            OrderDate,
            CustomerName,
            CustomerEmail,
            ShippingMethod,
            TransportName,
            CustomerPONo,
            SalesPersonName,
            SalesPersonEmail,
            ContactPersonEmail,
            PaymentTerms,
            TrackingNumber,
            TrackingUpdatedDate,
            DeliveryDate,
        } = rows[0];

        console.log("Contact Person Email:", ContactPersonEmail);
        console.log("Sales Person Email:", SalesPersonEmail);

        // Validate recipient
        if (!ContactPersonEmail || !ContactPersonEmail.trim()) {
            throw new Error(`Missing Contact Person Email for Invoice ${InvoiceNo}`);
        }

        // Get base URL
        const baseUrl = process.env.API_BASE_URL;

        // Check PDF availability
        const { pdfLinkHtml, isPdfAvailable } = await checkPdfAvailability(InvoiceNo, baseUrl);
        
        // Generate table rows and check for COA availability
        const { htmlRows, hasCOA } = await generateTableRows(rows, docEntry, InvoiceNo, baseUrl);

        // Generate tracking link
        const trackingLink = generateTrackingLink(TransportName, TrackingNumber);
        const trackingLinkHtml = generateTrackingLinkHtml(trackingLink);

        // Create download links section
        let downloadLinksHtml = '';
        if (isPdfAvailable && hasCOA) {
            downloadLinksHtml = `
                <p><strong>Click here to download:</strong> 
                    <a href="${pdfLinkHtml}" 
                       style="color: #007bff; text-decoration: underline;">Invoice</a> and 
                    <a href="https://marketing.densitypharmachem.com/dispatch?docEntry=${docEntry}&docNum=${InvoiceNo}&refNo=${encodeURIComponent(CustomerPONo)}" 
                       style="color: #007bff; text-decoration: underline;">COA</a>
                </p>
            `;
        } else if (isPdfAvailable) {
            downloadLinksHtml = `
                <p><strong>Click here to download:</strong> 
                    <a href="${pdfLinkHtml}" 
                       style="color: #007bff; text-decoration: underline;">Invoice</a>
                </p>
            `;
        } else if (hasCOA) {
            downloadLinksHtml = `
                <p><strong>Click here to download:</strong> 
                    <a href="https://marketing.densitypharmachem.com/dispatch?docEntry=${docEntry}&docNum=${InvoiceNo}&refNo=${encodeURIComponent(CustomerPONo)}" 
                       style="color: #007bff; text-decoration: underline;">COA</a>
                </p>
            `;
        }

        // Show first 5 rows in email
        const displayRows = htmlRows.slice(0, 5).join('');
        const showMoreLink = htmlRows.length > 5 ? `
            <p style="margin-top: 10px; margin-bottom: 20px;">
                <a href="https://marketing.densitypharmachem.com/dispatch?docEntry=${docEntry}&docNum=${InvoiceNo}&refNo=${encodeURIComponent(CustomerPONo)}" 
                    style="color: #007bff; text-decoration: underline; font-weight: bold;" 
                    target="_blank">
                    Click to see all items
                </a>
            </p>` : '';

        // Build HTML body with updated template structure
        const html = `
            <div style="font-family: Arial, sans-serif;font-size: 14px; line-height:1.4; color:#333;">
                <p>Dear Valued Customer,</p>
                <p>Your order <strong>${CustomerPONo}</strong> has been shipped.</p>
                <p><strong>Here are the tracking details:</strong></p>
                <ul>
                    <li><strong>Our Invoice Number:</strong> ${InvoiceNo} – Dated # ${formatDate(InvoiceDate)}</li>
                    <li><strong>Carrier name:</strong> ${TransportName}</li>
                    <li><strong>Tracking Number:</strong> ${TrackingNumber} – Dated # ${formatDate(TrackingUpdatedDate)}</li>
                    ${trackingLinkHtml}
                    <li><strong>Estimated Delivery Date:</strong> ${DeliveryDate ? formatDate(DeliveryDate) : 'N/A'}</li>
                </ul>
                ${downloadLinksHtml}
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
                        ${displayRows}
                    </tbody>
                </table>
                ${showMoreLink}
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
                     style="height:auto; width:180px; max-width:100%; margin-top:10px; border:0;">
            </div>
        `;

        // Send email
        const subject = `Shipment tracking details# for order- ${CustomerPONo}`;
        // const emailRes = await fetch(
        //     `${process.env.API_BASE_URL}/api/email/base_mail`,
        //     {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({
        //             from: "sales@densitypharmachem.com",
        //             to: [ContactPersonEmail],
        //             cc: [SalesPersonEmail],
        //             bcc: ["chandraprakashyadav1110@gmail.com"],
        //             subject: subject,
        //             body: html,
        //         }),
        //     }
        // );

        const emailRes = await fetch(
            `${process.env.API_BASE_URL}/api/email/base_mail`,
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

        if (!emailRes.ok) {
            const errText = await emailRes.text();
            throw new Error(`base_mail failed: ${errText}`);
        }

        // Update sent timestamp
        const now = new Date();
        const totalMinutes = now.getHours() * 60 + now.getMinutes();

        // await queryDatabase(
        //     `UPDATE OINV
        //      SET U_EmailSentDT = GETDATE(),
        //          U_EmailSentTM = @time
        //      WHERE DocNum = @docNum`,
        //     [
        //         { name: "time", type: sql.SmallInt, value: totalMinutes },
        //         { name: "docNum", type: sql.Int, value: docNum },
        //     ]
        // );

        console.log(`[sendInvoiceEmail] Success for DocNum=${docNum} in ${Date.now() - start}ms`);
        
        return res.status(200).json({
            success: true,
            EmailSentDT: now.toISOString(),
            EmailSentTM: totalMinutes,
        });
        
    } catch (err) {
        console.error(`[sendInvoiceEmail] Uncaught error for DocNum=${docNum}:`, err.stack);
        return res.status(500).json({ success: false, error: err.message });
    }
}