
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
        AND T0.UpdateDate >= DATEADD(MINUTE, -1000, GETDATE())
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
    <p>Dear ${customerName},</p>
    
    <p>Great news! Your order ${invoiceDetails["SO No"] || "N/A"} has been shipped and is on its way to you.</p>
    
    <p>Here are the details:</p>
    
    <p>
      Our Order Number: ${invoiceDetails["Order No"] || "N/A"}-Dated # ${formatDate(invoiceDetails["Order Date"])}<br/>
      Shipping Method: ${invoiceDetails.U_AirlineName || "N/A"}<br/>
      Tracking Number: ${invoiceDetails["Tracking Number"] || "N/A"}. Dated# ${formatDate(invoiceDetails["Dispatch Date"])}<br/>
      Estimated Delivery Date: ${formatDate(invoiceDetails["Delivery Date"])}
    </p>
    
    <p>Items Shipped:</p>
    
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
      <thead style="background-color: #007BFF; color: white;">
        <tr>
          <th>Inv#</th>
          <th>INV Date</th>
          <th>Item No.</th>
          <th>Item/Service Description</th>
          <th>Cas No</th>
          <th>Unit</th>
          <th>Packsize</th>
          <th>Unit Sales Price</th>
          <th>QTY</th>
          <th>Total Sales Price</th>
          <th>Batch Number</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (item, index) => `
          <tr>
            <td style="text-align: center;">${item["Invoice No."] || "N/A"}</td>
            <td style="text-align: center;">${formatDate(item["AR Invoice Date"])}</td>
            <td style="text-align: center;">${item["Item No."] || "N/A"}</td>
            <td style="text-align: center;">${item["Item/Service Description"] || "N/A"}</td>
            <td style="text-align: center;">${item.U_CasNo || "N/A"}</td>
            <td style="text-align: center;">${item.UnitMsr || "N/A"}</td>
            <td style="text-align: center;">${item.U_PackSize || "N/A"}</td>
            <td style="text-align: center;">${item["Unit Sales Price"] || "N/A"}</td>
            <td style="text-align: center;">${item.Quantity || "N/A"}</td>
            <td style="text-align: center;">${item["Total Sales Price"] || "N/A"}</td>
            <td style="text-align: center;">${item.BatchNum || "N/A"}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    
    <p>You can track your order status anytime using the tracking link above. If you have any questions or need assistance, please don't hesitate to reach out to us at sales.</p>
    
    <p>Thank you for your purchase and support!</p>
    
    <p>Warm regards,</p>
    
    <img src="http://marketing.densitypharmachem.com/assets/Density_LOGO.jpg" alt="Logo" style="height: 70px;"/><br/>
    <strong>Website: www.densitypharmachem.com</strong><br/><br/>
    DENSITY PHARMACHEM PRIVATE LIMITED<br/><br/>
    Sy No 615/A & 624/2/1, Pudur Village<br/>
    Medchal-Malkajgiri District,<br/>
    Hyderabad, Telangana, India-501401<br/>
   
  </div>
`;

        // Update the subject line to match your requirement
        const subject = `Your Order# ${invoiceDetails["SO No"] || "N/A"} Has Shipped! Here's Your Tracking Info!-Inv #${invoiceNo}`;
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers.host;

        // Send the email
        const mailRes = await fetch(`${protocol}://${host}/api/email/base_mail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "prakash@densitypharmachem.com",
            to: "chandraprakashyadav1110@gmail.com", // Change to to for production
            // subject: `Shipment Dispatched Notification - ${invoiceNo}`,
            subject: `Your Order# ${invoiceDetails["SO No"] || "N/A"} Has Shipped! Here's Your Tracking Info!-Inv #${invoiceNo}`,
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
        // console.error(`Error processing invoice ${invoice.DocNum}:`, invoiceError);
        console.error(`❌ Failure reason for invoice ${invoice.DocNum}:`, {
          error: invoiceError.message,
          docEntry: invoice.DocEntry,
          email: to || "Missing email",
        });

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