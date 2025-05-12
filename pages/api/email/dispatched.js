// // pages/api/email/dispatched.js

// import { queryDatabase } from "../../../lib/db";
// import sql from "mssql";

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     res.setHeader("Allow", ["POST"]);
//     return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
//   }

//   try {
//     const recentInvoicesQuery = `
//       SELECT T0.DocEntry, T0.DocNum, T0.CardCode, T0.CardName, T0.TrackNo
//       FROM OINV T0
//       WHERE T0.TrackNo IS NOT NULL
//         AND T0.UpdateDate >= DATEADD(MINUTE, -5, GETDATE())
//       ORDER BY T0.UpdateDate ASC
//     `;

//     const recentInvoices = await queryDatabase(recentInvoicesQuery);
//     if (!recentInvoices.length) {
//       return res
//         .status(200)
//         .json({ message: "No new dispatched invoices in last 5 mins." });
//     }

//     const { DocEntry, CardCode, CardName, TrackNo } = recentInvoices[0];

//     const invoiceQuery = `
//       SELECT 
//         T0.DocNum AS "Invoice No.",
//         T0.DocDate AS "AR Invoice Date",
//         T0.TrackNo AS "Tracking Number",
//         T0.U_DeliveryDate AS "Delivery Date",
//         T0.U_DispatchDate AS "Dispatch Date",
//         T4.DocNum AS "Order No",
//         T4.DocDate AS "Order Date",
//         T0.U_AirlineName,
//         T0.CardName,
//         T0.CardCode,
//         T0.NumAtCard AS "SO No",
//         T1.ItemCode AS "Item No.",
//         T1.Dscription AS "Item/Service Description",
//         T1.Quantity,
//         T1.UnitMsr,
//         T3.E_Mail AS "Customer Email"
//       FROM OINV T0
//       INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//       LEFT JOIN ORDR T4 ON T1.BaseEntry = T4.DocEntry 
//       LEFT JOIN OCRD T3 ON T3.CardCode = T0.CardCode
//       WHERE T0.DocEntry = @docEntry
//     `;

//     const invoiceParams = [
//       { name: "docEntry", type: sql.Int, value: DocEntry },
//     ];

//     const data = await queryDatabase(invoiceQuery, invoiceParams);
//     if (!data.length)
//       return res.status(404).json({ error: "Invoice not found" });

//     const to = data[0]["Customer Email"];
//     const customerName = data[0].CardName;

//     if (!to)
//       return res
//         .status(400)
//         .json({ error: "Customer email not found in OCRD." });

//     function formatDate(dateString) {
//       if (!dateString) return "N/A";
//       const date = new Date(dateString);
//       return date.toLocaleDateString();
//     }

//     const invoiceDetails = data[0];
//     const invoiceNo = invoiceDetails["Invoice No."] || "N/A";
//     const invoiceDate = formatDate(invoiceDetails["AR Invoice Date"]);

//     const items = data
//       .map(
//         (item, index) => `
//       <tr>
//         <td style="text-align: center;">${index + 1}</td>
//         <td style="text-align: center;">${item["Item No."] || "N/A"}</td>
//         <td style="text-align: center;">${item["Item/Service Description"] || "N/A"}</td>
//         <td style="text-align: center;">${item.Quantity || "N/A"}</td>
//         <td style="text-align: center;">${item.UnitMsr || "N/A"}</td>
//       </tr>
//     `
//       )
//       .join("");

//     const html = `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//         <p>Dear Sir / Madam,</p>
//         <p>Greetings of the day!</p>
//         <p>Thank you for choosing us as your preferred partner. We would like to notify you that the following item(s) have been dispatched.</p>

//         <h2>Order Details</h2>
//         <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
//           <thead style="background-color: #f2f2f2;"><tr><th>Order#</th><th>Order Date</th></tr></thead>
//           <tbody><tr><td style="text-align: center;">${invoiceDetails["Order No"] || "N/A"}</td><td style="text-align: center;">${formatDate(invoiceDetails["Order Date"])}</td></tr></tbody>
//         </table>

//         <h2>Track your Shipment</h2>
//         <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
//           <thead style="background-color: #f2f2f2;"><tr><th>Tracking No</th><th>Dispatch Date</th><th>Delivery Date</th><th>Airline Name</th></tr></thead>
//           <tbody>
//             <tr>
//               <td style="text-align: center;">${invoiceDetails["Tracking Number"] || "N/A"}</td>
//               <td style="text-align: center;">${formatDate(invoiceDetails["Dispatch Date"])}</td>
//               <td style="text-align: center;">${formatDate(invoiceDetails["Delivery Date"])}</td>
//               <td style="text-align: center;">${invoiceDetails.U_AirlineName || "N/A"}</td>
//             </tr>
//           </tbody>
//         </table>

//         <h2>Shipped Items</h2>
//         <p>Invoice# <strong>${invoiceNo}</strong> dated <strong>${invoiceDate}</strong></p>
//         <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
//           <thead style="background-color: #f2f2f2;"><tr><th>Sr No</th><th>Item Code</th><th>Description</th><th>Quantity</th><th>Unit</th></tr></thead>
//           <tbody>${items}</tbody>
//         </table>

//         <p>Regards,<br/>
//         <img src="https://tinypic.host/images/2025/05/05/Density_LOGO.jpg" alt="Logo" style="height: 70px;"/><br/>
//         <strong>Website: www.densitypharmachem.com</strong><br/><br/>
//         DENSITY PHARMACHEM PRIVATE LIMITED<br/>
//         Sy No 615/A & 624/2/1, Pudur Village<br/>
//         Medchal-Malkajgiri District, Hyderabad, Telangana, India-501401
//         </p>
//       </div>
//     `;

//     const protocol = req.headers["x-forwarded-proto"] || "http";
//     const host = req.headers.host;

//     const mailRes = await fetch(`${protocol}://${host}/api/email/base_mail`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         from: "prakash@densitypharmachem.com",
//         to: "chandraprakashyadav1110@gmail.com",
//         subject: `Shipment Dispatched Notification - ${invoiceNo}`,
//         body: html,
//       }),
//     });

//     const result = await mailRes.json();
//     if (!mailRes.ok) throw new Error(result.message || "Failed to send email");

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     console.error("Error in dispatched email:", err);
//     return res.status(500).json({ error: "Internal server error." });
//   }
// }


// pages/api/email/dispatched.js

import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Find invoices where TrackNo was updated in the last 5 minutes
    // and TrackNo is not null, empty, or 'N/A'
    const recentInvoicesQuery = `
      SELECT T0.DocEntry, T0.DocNum, T0.CardCode, T0.CardName, T0.TrackNo
      FROM OINV T0
      WHERE T0.TrackNo IS NOT NULL
        AND T0.TrackNo <> ''
        AND T0.TrackNo <> 'N/A'
        AND T0.UpdateDate >= DATEADD(MINUTE, -5, GETDATE())
      ORDER BY T0.UpdateDate DESC
    `;

    const recentInvoices = await queryDatabase(recentInvoicesQuery);
    
    if (!recentInvoices.length) {
      return res
        .status(200)
        .json({ message: "No new dispatched invoices in last 5 mins." });
    }

    console.log(`Found ${recentInvoices.length} dispatched invoices to process`);
    let successCount = 0;
    let failureCount = 0;

    // Process each invoice that has an updated tracking number
    for (const invoice of recentInvoices) {
      try {
        const { DocEntry, DocNum, TrackNo } = invoice;

        // Get detailed invoice information
        const invoiceQuery = `
          SELECT 
            T0.DocNum AS "Invoice No.",
            T0.DocDate AS "AR Invoice Date",
            T0.TrackNo AS "Tracking Number",
            T0.U_DeliveryDate AS "Delivery Date",
            T0.U_DispatchDate AS "Dispatch Date",
            T4.DocNum AS "Order No",
            T4.DocDate AS "Order Date",
            T0.U_AirlineName,
            T0.CardName,
            T0.CardCode,
            T0.NumAtCard AS "SO No",
            T1.ItemCode AS "Item No.",
            T1.Dscription AS "Item/Service Description",
            T1.Quantity,
            T1.UnitMsr,
            T3.E_Mail AS "Customer Email"
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          LEFT JOIN ORDR T4 ON T1.BaseEntry = T4.DocEntry 
          LEFT JOIN OCRD T3 ON T3.CardCode = T0.CardCode
          WHERE T0.DocEntry = @docEntry
        `;

        const invoiceParams = [
          { name: "docEntry", type: sql.Int, value: DocEntry },
        ];

        const data = await queryDatabase(invoiceQuery, invoiceParams);
        if (!data.length) {
          console.error(`Invoice details not found for DocEntry: ${DocEntry}`);
          failureCount++;
          continue;
        }

        const to = data[0]["Customer Email"];
        const customerName = data[0].CardName;

        if (!to) {
          console.error(`Customer email not found for invoice ${DocNum}`);
          failureCount++;
          continue;
        }

        // Format the email content
        function formatDate(dateString) {
          if (!dateString) return "N/A";
          const date = new Date(dateString);
          return date.toLocaleDateString();
        }

        const invoiceDetails = data[0];
        const invoiceNo = invoiceDetails["Invoice No."] || "N/A";
        const invoiceDate = formatDate(invoiceDetails["AR Invoice Date"]);

        const items = data
          .map(
            (item, index) => `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;">${item["Item No."] || "N/A"}</td>
            <td style="text-align: center;">${item["Item/Service Description"] || "N/A"}</td>
            <td style="text-align: center;">${item.Quantity || "N/A"}</td>
            <td style="text-align: center;">${item.UnitMsr || "N/A"}</td>
          </tr>
        `
          )
          .join("");

        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Dear Sir / Madam,</p>
            <p>Greetings of the day!</p>
            <p>Thank you for choosing us as your preferred partner. We would like to notify you that the following item(s) have been dispatched.</p>

            <h2>Order Details</h2>
            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
              <thead style="background-color: #f2f2f2;"><tr><th>Order#</th><th>Order Date</th></tr></thead>
              <tbody><tr><td style="text-align: center;">${invoiceDetails["Order No"] || "N/A"}</td><td style="text-align: center;">${formatDate(invoiceDetails["Order Date"])}</td></tr></tbody>
            </table>

            <h2>Track your Shipment</h2>
            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
              <thead style="background-color: #f2f2f2;"><tr><th>Tracking No</th><th>Dispatch Date</th><th>Delivery Date</th><th>Airline Name</th></tr></thead>
              <tbody>
                <tr>
                  <td style="text-align: center;">${invoiceDetails["Tracking Number"] || "N/A"}</td>
                  <td style="text-align: center;">${formatDate(invoiceDetails["Dispatch Date"])}</td>
                  <td style="text-align: center;">${formatDate(invoiceDetails["Delivery Date"])}</td>
                  <td style="text-align: center;">${invoiceDetails.U_AirlineName || "N/A"}</td>
                </tr>
              </tbody>
            </table>

            <h2>Shipped Items</h2>
            <p>Invoice# <strong>${invoiceNo}</strong> dated <strong>${invoiceDate}</strong></p>
            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
              <thead style="background-color: #f2f2f2;"><tr><th>Sr No</th><th>Item Code</th><th>Description</th><th>Quantity</th><th>Unit</th></tr></thead>
              <tbody>${items}</tbody>
            </table>

            <p>Regards,<br/>
            <img src="https://tinypic.host/images/2025/05/05/Density_LOGO.jpg" alt="Logo" style="height: 70px;"/><br/>
            <strong>Website: www.densitypharmachem.com</strong><br/><br/>
            DENSITY PHARMACHEM PRIVATE LIMITED<br/>
            Sy No 615/A & 624/2/1, Pudur Village<br/>
            Medchal-Malkajgiri District, Hyderabad, Telangana, India-501401
            </p>
          </div>
        `;

        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers.host;

        // Send the email
        const mailRes = await fetch(`${protocol}://${host}/api/email/base_mail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "prakash@densitypharmachem.com",
            to: "chandraprakashyadav1110@gmail.com", // Change to to for production
            subject: `Shipment Dispatched Notification - ${invoiceNo}`,
            body: html,
          }),
        });

        const result = await mailRes.json();
        if (!mailRes.ok) {
          throw new Error(result.message || "Failed to send email");
        }

        console.log(`✅ Dispatch notification sent for invoice: ${DocNum}, tracking: ${TrackNo}`);
        successCount++;
      } catch (invoiceError) {
        console.error(`Error processing invoice ${invoice.DocNum}:`, invoiceError);
        failureCount++;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Processed ${recentInvoices.length} invoices. Success: ${successCount}, Failed: ${failureCount}` 
    });
  } catch (err) {
    console.error("Error in dispatched email:", err);
    return res.status(500).json({ error: "Internal server error.", details: err.message });
  }
}