

// pages/api/email/dispatched.js

import { Resend } from 'resend';
import { queryDatabase } from '../../../lib/db';
import sql from 'mssql';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Step 1: Get all invoices updated in last 5 minutes and not present in TrackNoUpdateLog
    const recentInvoicesQuery = `
      SELECT T0.DocEntry, T0.DocNum, T0.CardCode, T0.CardName, T0.TrackNo
      FROM OINV T0
      WHERE T0.TrackNo IS NOT NULL
        AND T0.UpdateDate >= DATEADD(MINUTE, -5000, GETDATE())
       
      ORDER BY T0.UpdateDate ASC
    `;

    const recentInvoices = await queryDatabase(recentInvoicesQuery);
    if (!recentInvoices.length) {
      return res
        .status(200)
        .json({ message: "No new dispatched invoices in last 5 mins." });
    }

    // Process the first pending invoice
    const { DocEntry, CardCode, CardName, TrackNo } = recentInvoices[0];

    // Step 2: Fetch invoice and item details
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
  T1.LineNum,
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
      return res.status(404).json({ error: "Invoice not found" });
    }

    const to = data[0]["Customer Email"];
    const customerName = data[0].CardName;

    if (!to) {
      return res
        .status(400)
        .json({ error: "Customer email not found in OCRD." });
    }

    function formatDate(dateString) {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString();
    }

    const invoiceDetails = data[0];
    const invoiceNo = invoiceDetails["Invoice No."] || "N/A";
    const invoiceDate = formatDate(invoiceDetails["AR Invoice Date"]) || "N/A";

    const items = data.map((item,index) => ({
      srNo: index + 1,
      itemCode: item["Item No."] || "N/A",
      description: item["Item/Service Description"] || "N/A",
      quantity: item.Quantity || "N/A",
      unit: item.UnitMsr || "N/A",
    }));

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Dear Sir / Madam,</p>
        <p>Greetings of the day!</p>
        <p>
          Thank you for choosing us as your preferred partner. We would like to
          notify you that the following item(s) have been dispatched. Your order
          is on the way. Please find the shipment details.
        </p>

        <h2>Order Details</h2>
        <table
          border="1"
          cellpadding="6"
          cellspacing="0"
          style="border-collapse: collapse; width: 100%; margin-bottom: 20px;"
        >
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th>Order#</th>
              <th>Order Date</th>
              
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">
                ${invoiceDetails["Order No"] || "N/A"}
              </td>
              <td style="text-align: center;">
                ${formatDate(invoiceDetails["Order Date"]) || "N/A"}
              </td>
              
            </tr>
          </tbody>
        </table>

        <h2>Track your Shipment</h2>
        <table
          border="1"
          cellpadding="6"
          cellspacing="0"
          style="border-collapse: collapse; width: 100%; margin-bottom: 20px;"
        >
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th>Tracking No</th>
              
              <th>Dispatch Date</th>
              <th>Delivery Date</th>
              <th>Airline Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">
                ${invoiceDetails["Tracking Number"] || "N/A"}
              </td>
              
              <td style="text-align: center;">
                ${formatDate(invoiceDetails["Dispatch Date"]) || "N/A"}
              </td>
              <td style="text-align: center;">
                ${formatDate(invoiceDetails["Delivery Date"]) || "N/A"}
              </td>
              <td style="text-align: center;">
                ${invoiceDetails.U_AirlineName || "N/A"}
              </td>
            </tr>
          </tbody>
        </table>

        <h2>Shipped Items</h2>
        <p>
          Invoice# <strong>${invoiceNo}</strong> dated
          <strong>${invoiceDate}</strong>
        </p>
        <table
          border="1"
          cellpadding="6"
          cellspacing="0"
          style="border-collapse: collapse; width: 100%; margin-bottom: 20px;"
        >
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th>Sr No</th>
              <th>Item Code</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
  ${items
    .map(
      (item) => `
        <tr>
          <td style="text-align: center;">${item.srNo}</td>
          <td style="text-align: center;">${item.itemCode}</td>
          <td style="text-align: center;">${item.description}</td>
          <td style="text-align: center;">${item.quantity} </td>
          <td style="text-align: center;">${item.unit}</td>
        </tr>
      `
    )
    .join("")}
</tbody>

        </table>

        <p>
          Regards,
          <br />
          <img
            src="https://tinypic.host/images/2025/05/05/Density_LOGO.jpg"
            alt="Logo"
            style="height: 70px; width: auto; max-width: 400px; display: block; margin-bottom: 10px;"
          />
          <br />
          <strong>Website: www.densitypharmachem.com</strong>
          <br />
          <br />
          DENSITY PHARMACHEM PRIVATE LIMITED
          <br />
          <br />
          Sy No 615/A & 624/2/1, Pudur Village
          <br />
          Medchal-Malkajgiri District,
          <br />
          Hyderabad, Telangana, India-501401
          <br />
        </p>
      </div>
    `;
    const { data: emailData, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      //   to: to,
      to: "chandraprakashyadav1110@gmail.com",
      //   subject: `Shipment Dispatched Notification - Order ${invoiceDetails["SO No"] || ""}`,
      subject: `Shipment Dispatched Notification`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email." });
    }

    // const insertQuery = `
    //   INSERT INTO TrackNoUpdateLog (DocEntry, DocNum, CardCode, CardName, TrackNo, EmailSent, UpdatedAt)
    //   VALUES (@DocEntry, @DocNum, @CardCode, @CardName, @TrackNo, 1, GETDATE())
    // `;

    // await queryDatabase(insertQuery, [
    //   { name: "DocEntry", type: sql.Int, value: DocEntry },
    //   { name: "DocNum", type: sql.Int, value: invoiceDetails["Invoice No."] },
    //   { name: "CardCode", type: sql.VarChar, value: CardCode },
    //   { name: "CardName", type: sql.NVarChar, value: CardName },
    //   { name: "TrackNo", type: sql.VarChar, value: TrackNo },
    // ]);

    return res.status(200).json({ success: true, data: emailData });
  } catch (err) {
    console.error('Error in sendDispatchedMail:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}




// <thead style="background-color: #f2f2f2;">
//             <tr>
//               <th>SO#</th>
//               <th>Order Date</th>
//               <th>Delivery Date</th>
//               <th>Product Count</th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td style="text-align: center;">
//                 ${invoiceDetails["SO No"] || "N/A"}
//               </td>
//               <td style="text-align: center;">
//                 ${formatDate(invoiceDetails["SO Date"]) || "N/A"}
//               </td>
//               <td style="text-align: center;">
//                 ${formatDate(invoiceDetails["Delivery Date"]) || "N/A"}
//               </td>
//               <td style="text-align: center;">${data.length}</td>
//             </tr>
//           </tbody>
//         </table>