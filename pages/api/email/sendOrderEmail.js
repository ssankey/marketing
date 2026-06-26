// import { getOrderDetails } from "../../../lib/models/orders";
// import { queryDatabase } from "../../../lib/db";
// import sql from "mssql";
// import { formatDate } from "utils/formatDate";
// import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

// export default async function handler(req, res) {
//   const start = Date.now();

//   if (req.method !== "POST") {
//     console.error(`[sendOrderEmail] Invalid method: ${req.method}`);
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const { docEntry, docNum } = req.body;
//   console.log(
//     `[sendOrderEmail] Started for DocEntry=${docEntry}, DocNum=${docNum}`
//   );

//   try {
//     // 0) Check if email already sent
//     const statusRows = await queryDatabase(
//       `SELECT U_EmailSentDT, U_EmailSentTM ,CardCode, CardName 
//        FROM ORDR 
//        WHERE DocEntry = @docEntry`,
//       [{ name: "docEntry", type: sql.Int, value: docEntry }]
//     );

//     const status = statusRows[0] || {};

//         // Check if email is disabled based on CardCode
//     if (status.CardCode === "C000021" || status.CardCode === "C000020") {
//       console.warn(
//         `[sendOrderEmail] Email sending disabled for: ${status.CardCode} (${status.CardName})`
//       );
//       return res.status(200).json({
//         success: false,
//         message: `Email disabled for ${status.CardName || "this customer"}`,
//       });
//     }

//     if (status.U_EmailSentDT || status.U_EmailSentTM) {
//       console.log(
//         `[sendOrderEmail] Already sent at ${status.U_EmailSentDT} / ${status.U_EmailSentTM}`
//       );
//       return res.status(200).json({
//         success: false,
//         message: `Email already sent on ${new Date(status.U_EmailSentDT).toLocaleString()}`,
//       });
//     }

//     // 1) Fetch order details
//     const details = await getOrderDetails(docEntry, docNum);
//     if (!details) {
//       console.error(`[sendOrderEmail] Order not found: DocEntry=${docEntry}`);
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // 2) Validate recipient
//     const toEmail = details.Email;
//     const SalesPerson_Email = details.SalesPerson_Email;
//     const ContactPersonEmail = details.ContactPersonEmail;

//     if (!toEmail) {
//       console.warn(
//         `[sendOrderEmail] No email address for DocEntry=${docEntry}`
//       );
//       return res.status(400).json({ error: "No email for this order" });
//     }

//     // 3) Build HTML body (same as batch version)
//     const lineItems = details.LineItems.map(
//       (item) => `
//         <tr>
//           <td>${item.ItemCode}</td>
//           <td>${item.Description}</td>
//           <td>${item.U_CasNo || "N/A"}</td>
//           <td>${item.Quantity}</td>
//           <td>${item.UnitMsr}</td>
//           <td>${formatNumberWithIndianCommas(item.Price)}</td>
//           <td>${formatNumberWithIndianCommas(item.LineTotal)}</td>
//           <td>${item.StockStatus}</td>
//           <td>${formatDate(item.DeliveryDate)}</td>
//         </tr>
//       `
//     ).join("");

//     const html = `
//       <div style="font-family: Arial, sans-serif;">
//         <p>Dear Valued Customer,</p>
//         <p>We are pleased to confirm your Purchase order <strong>${details.CustomerPONo}</strong> placed on <strong>${formatDate(details.DocDate)}</strong>.<br/>Our Sales order ref# ${details.DocNum} dated ${formatDate(details.DocDate)}</p>

//         <p><strong>Order Summary:</strong></p>
//         <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
//           <thead style="background-color: #007BFF; color: white;">
//             <tr>
//               <th>Item Code</th><th>Description</th><th>CAS No.</th><th>Qty</th><th>Unit</th>
//               <th>Price</th><th>Line Total</th><th>Stock</th><th>Delivery Date</th>
//             </tr>
//           </thead>
//           <tbody>${lineItems}</tbody>
//         </table>
//         <br/>
//         <p><strong>Billing Address:</strong> ${details.BillToAddress || "N/A"}</p>
//         <p><strong>Payment Terms:</strong> ${details.PaymentTerms || "N/A"}</p>

//         <p>Should you have any inquiries or require further assistance, please do not hesitate to contact our customer service team at sales@densitypharmachem.com<br/><br>
//         Thank you for your patronage. We greatly appreciate your business and look forward to serving you again.</p><br/>

//         <p><strong>Yours Sincerely,<br/></strong></p>
//         <p>${details.SalesEmployee}</p>

//         <strong>Website: www.densitypharmachem.com</strong><br/><br/>
//         DENSITY PHARMACHEM PRIVATE LIMITED<br/><br/>
//         Sy No 615/A & 624/2/1, Pudur Village<br/>
//         Medchal-Malkajgiri District,<br/>
//         Hyderabad, Telangana, India-501401<br/>
//       </div>
//     `;

//     // // 4) Send email
//     // const emailRes = await fetch(
//     //   `${process.env.API_BASE_URL}/api/email/base_mail`,
//     //   {
//     //     method: "POST",
//     //     headers: { "Content-Type": "application/json" },
//     //     body: JSON.stringify({
//     //       from: "sales@densitypharmachem.com",
//     //       to: [toEmail],
//     //       cc: [SalesPerson_Email],
//     //       bcc: ["chandraprakashyadav1110@gmail.com"],
//     //       subject: `Order confirmation- SO # ${details.DocNum}`,
//     //       body: html,
//     //     }),
//     //   }
//     // );

//      // 4) Send email
//     const emailRes = await fetch(
//       `${process.env.API_BASE_URL}/api/email/base_mail`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           from: "prakash@densitypharmachem.com",
//           to: ["chandraprakashyadav1110@gmail.com"],
          
//           bcc: ["chandraprakashyadav1110@gmail.com"],
//           subject: `Order confirmation- SO # ${details.DocNum}`,
//           body: html,
//         }),
//       }
//     );

//     const text = await emailRes.text();
//     if (!emailRes.ok) {
//       console.error(
//         `[sendOrderEmail] base_mail FAILED ${emailRes.status}: ${text}`
//       );
//       throw new Error(`base_mail error ${emailRes.status}`);
//     }

//     // 5) Update sent timestamp
//     const now = new Date();
//     const totalMinutes = now.getHours() * 60 + now.getMinutes();

//     // await queryDatabase(
//     //   `
//     //   UPDATE ORDR
//     //   SET U_EmailSentDT = GETDATE(),
//     //       U_EmailSentTM = @time
//     //   WHERE DocEntry = @docEntry
//     //   `,
//     //   [
//     //     { name: "time", type: sql.SmallInt, value: totalMinutes },
//     //     { name: "docEntry", type: sql.Int, value: docEntry },
//     //   ]
//     // );

//     console.log(
//       `[sendOrderEmail] Success for DocEntry=${docEntry} in ${Date.now() - start}ms`
//     );
//     return res.status(200).json({
//       success: true,
//       message: "Order confirmation email sent successfully!",
//       EmailSentDT: now.toISOString(),
//       EmailSentTM: totalMinutes,
//     });
//   } catch (err) {
//     console.error(
//       `[sendOrderEmail] Uncaught error for DocEntry=${docEntry}:`,
//       err.stack
//     );
//     return res.status(500).json({ success: false, error: err.message });
//   }
// }


import { getOrderDetails } from "../../../lib/models/orders";
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";
import { formatDate } from "utils/formatDate";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

export default async function handler(req, res) {
  const start = Date.now();

  if (req.method !== "POST") {
    console.error(`[sendOrderEmail] Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { docEntry, docNum } = req.body;
  console.log(
    `[sendOrderEmail] Started for DocEntry=${docEntry}, DocNum=${docNum}`
  );

  try {
    // 0) Check if email already sent
    const statusRows = await queryDatabase(
      `SELECT U_EmailSentDT, U_EmailSentTM ,CardCode, CardName 
       FROM ORDR 
       WHERE DocEntry = @docEntry`,
      [{ name: "docEntry", type: sql.Int, value: docEntry }]
    );

    const status = statusRows[0] || {};

        // Check if email is disabled based on CardCode
    if (status.CardCode === "C000021" || status.CardCode === "C000020") {
      console.warn(
        `[sendOrderEmail] Email sending disabled for: ${status.CardCode} (${status.CardName})`
      );
      return res.status(200).json({
        success: false,
        message: `Email disabled for ${status.CardName || "this customer"}`,
      });
    }

    if (status.U_EmailSentDT || status.U_EmailSentTM) {
      console.log(
        `[sendOrderEmail] Already sent at ${status.U_EmailSentDT} / ${status.U_EmailSentTM}`
      );
      return res.status(200).json({
        success: false,
        message: `Email already sent on ${new Date(status.U_EmailSentDT).toLocaleString()}`,
      });
    }

    // 1) Fetch order details
    const details = await getOrderDetails(docEntry, docNum);
    if (!details) {
      console.error(`[sendOrderEmail] Order not found: DocEntry=${docEntry}`);
      return res.status(404).json({ error: "Order not found" });
    }

    // 2) Validate recipient
    const toEmail = details.Email;
    const SalesPerson_Email = details.SalesPerson_Email;
    const ContactPersonEmail = details.ContactPersonEmail;

    if (!toEmail) {
      console.warn(
        `[sendOrderEmail] No email address for DocEntry=${docEntry}`
      );
      return res.status(400).json({ error: "No email for this order" });
    }

    // 3) Build HTML body (updated with Calibri font and smaller text)
    const lineItems = details.LineItems.map(
      (item) => `
        <tr>
          <td style="font-size: 13px;">${item.ItemCode}</td>
          <td style="font-size: 13px;">${item.Description}</td>
          <td style="font-size: 13px;">${item.U_CasNo || "N/A"}</td>
          <td style="font-size: 13px;">${item.Quantity}</td>
          <td style="font-size: 13px;">${item.UnitMsr}</td>
          <td style="font-size: 13px;">${formatNumberWithIndianCommas(item.Price)}</td>
          <td style="font-size: 13px;">${formatNumberWithIndianCommas(item.LineTotal)}</td>
          <td style="font-size: 13px;">${item.StockStatus}</td>
          <td style="font-size: 13px;">${formatDate(item.DeliveryDate)}</td>
        </tr>
      `
    ).join("");

    const html = `
      <div style="font-family: Calibri, sans-serif; font-size: 14px;">
        <p>Dear Valued Customer,</p>
        <p>We are pleased to confirm your Purchase order <strong>${details.CustomerPONo}</strong> placed on <strong>${formatDate(details.DocDate)}</strong>.<br/>Our Sales order ref# ${details.DocNum} dated ${formatDate(details.DocDate)}</p>

        <p><strong>Order Summary:</strong></p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Calibri, sans-serif;">
          <thead style="background-color: #007BFF; color: white;">
            <tr>
              <th style="font-size: 13px;">Item Code</th>
              <th style="font-size: 13px;">Description</th>
              <th style="font-size: 13px;">CAS No.</th>
              <th style="font-size: 13px;">Qty</th>
              <th style="font-size: 13px;">Unit</th>
              <th style="font-size: 13px;">Price</th>
              <th style="font-size: 13px;">Line Total</th>
              <th style="font-size: 13px;">Stock</th>
              <th style="font-size: 13px;">Delivery Date</th>
            </tr>
          </thead>
          <tbody>${lineItems}</tbody>
        </table>
        <br/>
        <p><strong>Billing Address:</strong> ${details.BillToAddress || "N/A"}</p>
        <p><strong>Payment Terms:</strong> ${details.PaymentTerms || "N/A"}</p>

        <p>Should you have any inquiries or require further assistance, please do not hesitate to contact our customer service team at sales@densitypharmachem.com<br/><br>
        Thank you for your patronage. We greatly appreciate your business and look forward to serving you again.</p><br/>

        <p><strong>Yours Sincerely,<br/></strong></p>
        <p>${details.SalesEmployee}</p>

        <strong>Website: www.densitypharmachem.com</strong><br/><br/>
        DENSITY PHARMACHEM PRIVATE LIMITED<br/><br/>
        Sy No 615/A & 624/2/1, Pudur Village<br/>
        Medchal-Malkajgiri District,<br/>
        Hyderabad, Telangana, India-501401<br/>
        <img src="https://marketing.densitypharmachem.com/assets/Density_LOGO.jpg" 
                     alt="Density Pharmachem" 
                     width="180" 
                     style="height:auto; width:180px; max-width:100%; margin-top:10px; border:0;">
      </div>
    `;

    // 4) Send email
    const emailRes = await fetch(
      `${process.env.API_BASE_URL}/api/email/base_mail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "sales@densitypharmachem.com",
          to: [toEmail],
          cc: [SalesPerson_Email],
          bcc: ["chandraprakashyadav1110@gmail.com"],
          subject: `Order confirmation- SO # ${details.DocNum}`,
          body: html,
        }),
      }
    );

    

    const text = await emailRes.text();
    if (!emailRes.ok) {
      console.error(
        `[sendOrderEmail] base_mail FAILED ${emailRes.status}: ${text}`
      );
      throw new Error(`base_mail error ${emailRes.status}`);
    }

    // 5) Update sent timestamp
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();

    await queryDatabase(
      `
      UPDATE ORDR
      SET U_EmailSentDT = GETDATE(),
          U_EmailSentTM = @time
      WHERE DocEntry = @docEntry
      `,
      [
        { name: "time", type: sql.SmallInt, value: totalMinutes },
        { name: "docEntry", type: sql.Int, value: docEntry },
      ]
    );

    console.log(
      `[sendOrderEmail] Success for DocEntry=${docEntry} in ${Date.now() - start}ms`
    );
    return res.status(200).json({
      success: true,
      message: "Order confirmation email sent successfully!",
      EmailSentDT: now.toISOString(),
      EmailSentTM: totalMinutes,
    });
  } catch (err) {
    console.error(
      `[sendOrderEmail] Uncaught error for DocEntry=${docEntry}:`,
      err.stack
    );
    return res.status(500).json({ success: false, error: err.message });
  }
}