//  // pages/api/inbound/sendEmail.js
// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     const { formData, attachmentFiles } = req.body;

//     // Format date helper
//     const formatDisplayDate = (isoDate) => {
//       if (!isoDate) return "N/A";
//       const date = new Date(isoDate);
//       const day = date.getDate();
//       const month = date.toLocaleString('en-US', { month: 'short' });
//       const year = date.getFullYear();
//       return `${day}-${month}-${year}`;
//     };

//     // Extract CHA team name
//     const chaTeamName = formData.chaName 
//       ? formData.chaName.split(' - ')[1] || formData.chaName 
//       : "CHA Team";

//     // Build HTML email body
//     const htmlBody = `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//         <p>Dear Team ${chaTeamName},</p>
        
//         <p>Please find below the shipment details for clearance:</p>
        
//         <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Vendor:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.vendor || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.name || "N/A"}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Country:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.country || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Product Category:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.productCategory || "N/A"}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Product Owners:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.productOwners || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Pre-Alert Form from Supplier:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.preAlertFormSupplier)}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Supplier Invoice No.:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.supplierInvoiceNumber || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Supplier Invoice Date:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.supplierInvoiceNumberDate)}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Invoice Value:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.invoiceValue || "N/A"} ${formData.currency || ""}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Port of Landing:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.portOfLanding || "N/A"}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Type of BOE:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.typeBOE || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Documents Sent to CHA Date:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.documentssentToCHADate)}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">CHA Name:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.chaName || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">MAWB / HAWB:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.mawbHawb || "N/A"}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">MAWB/HAWB Date:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.mawbHawbDate)}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Landing Date:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.landingDate)}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">PKG:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.pkg || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Weight:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.weight || "N/A"}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">BOE / SB No.:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.boeSbNo || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">BOE Date:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.boeDt)}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">AV:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.av || "N/A"}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Duty:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.duty || "N/A"}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Duty Paid Date:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.dutyPaidDate)}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Status:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formData.status || "N/A"}</td>
//           </tr>
//           <tr style="background-color: #f3f4f6;">
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Cleared Date:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.clearedDate)}</td>
//           </tr>
//           <tr>
//             <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Delivery Date:</td>
//             <td style="padding: 10px; border: 1px solid #ddd;">${formatDisplayDate(formData.deliveryDate)}</td>
//           </tr>
//         </table>
        
//         <p>Kindly proceed with the required clearance formalities. Please confirm upon completion.</p>
        
//         <p><strong>Best Regards,</strong><br/>
//         Density Pharmachem Team</p>
//       </div>
//     `;

//     // Prepare attachments for base_mail API
//     const attachments = [];
//     if (attachmentFiles) {
//       Object.entries(attachmentFiles).forEach(([fieldKey, files]) => {
//         files.forEach(file => {
//           if (file.content && file.name) {
//             attachments.push({
//               filename: file.name,
//               content: file.content, // Already base64 from frontend
//               contentType: file.type || 'application/octet-stream'
//             });
//           }
//         });
//       });
//     }

//     console.log(`📎 Preparing to send ${attachments.length} attachments`);

//     // Send email using base_mail API with attachments
//     const emailRes = await fetch(
//       `${process.env.API_BASE_URL || ''}/api/email/base_mail`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           from: "prakash@densitypharmachem.com",
//           to: ["chandraprakashyadav1110@gmail.com"],
//           subject: `Import Shipment Details for Clearance — BOE No: ${formData.boeSbNo}`,
//           body: htmlBody,
//           attachments: attachments.length > 0 ? attachments : undefined,
//         }),
//       }
//     );

//     const result = await emailRes.json();
    
//     if (!emailRes.ok) {
//       throw new Error(result.message || "Failed to send email");
//     }

//     console.log(`✅ Email sent successfully for BOE No: ${formData.boeSbNo}`);
//     console.log(`📎 Attachments sent: ${attachments.length}`);

//     // ✅ After email sent successfully — update sent date in DB
//     try {
//     const timestamp = new Date().toISOString();
//     await fetch(`${process.env.API_BASE_URL || ''}/api/inbound/updateSentDate`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//         boeSbNo: formData.boeSbNo,
//         sentDate: timestamp
//         }),
//     });
//     console.log(`📅 Sent date saved for BOE No: ${formData.boeSbNo} → ${timestamp}`);
//     } catch (err) {
//     console.error("⚠️ Failed to save sent date:", err);
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Email sent successfully with ${attachments.length} attachment(s)`,
//       messageId: result.messageId,
//     });

//   } catch (error) {
//     console.error("Send Inbound Email Error:", error);
//     return res.status(500).json({ 
//       success: false, 
//       error: error.message,
//       message: "Failed to send email"
//     });
//   }
// }

// pages/api/inbound/sendEmail.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { formData, remarksData, attachmentFiles } = req.body;
    
    // Generate timestamp for sent date
    const sentDate = new Date().toISOString();

    // Format date helper
    const formatDisplayDate = (isoDate) => {
      if (!isoDate) return "N/A";
      const date = new Date(isoDate);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Extract CHA team name
    const chaTeamName = formData.chaName 
      ? formData.chaName.split(' - ')[1] || formData.chaName 
      : "CHA Team";

    // Field name mapping (matching fieldConfig.js)
    const fieldNameMapping = {
      vendor: "Vendor",
      name: "Name",
      country: "Country",
      productCategory: "Product Category",
      productOwners: "Product Owners",
      preAlertFormSupplier: "Pre Alert from Supplier Date",
      supplierInvoiceNumber: "Supplier Invoice Number",
      supplierInvoiceNumberDate: "Supplier Invoice Number Date",
      invoiceValue: "Invoice Value",
      currency: "Currency",
      portOfLanding: "Port of Landing",
      typeBOE: "TYPE BOE",
      documentssentToCHADate: "Documents sent to CHA-Date",
      chaName: "CHA Name",
      mawbHawb: "MAWB/HAWB",
      mawbHawbDate: "MAWB/HAWB Date",
      landingDate: "Landing Date",
      pkg: "PKG",
      weight: "WEIGHT",
      boeSbNo: "BOE/SB NO",
      boeDt: "BOE DT",
      av: "AV",
      duty: "Duty",
      dutyPaidDate: "Duty Paid date",
      status: "Status",
      clearedDate: "Cleared Date at Density",
      deliveryDate: "Delivery Date at Density"
    };

    // Build HTML email body with remarks
    let tableRows = '';
    let isAlternate = false;
    
    Object.keys(fieldNameMapping).forEach(key => {
      // Skip currency as it's shown with invoice value
      if (key === 'currency') return;
      
      const label = fieldNameMapping[key];
      let value = formData[key] || "N/A";
      
      // Format dates
      if (key.toLowerCase().includes("date") || key === "boeDt") {
        value = formatDisplayDate(formData[key]);
      }
      
      // Add currency to invoice value
      if (key === "invoiceValue" && formData.invoiceValue) {
        value = `${formData.invoiceValue} ${formData.currency || ""}`;
      }
      
      // Add remarks if present
      const remarks = remarksData && remarksData[key];
      if (remarks && remarks.trim()) {
        value = `${value} <span style="color: #6b7280; font-style: italic;">(${remarks.trim()})</span>`;
      }
      
      tableRows += `
        <tr${isAlternate ? ' style="background-color: #f3f4f6;"' : ''}>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%;">${label}:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${value}</td>
        </tr>
      `;
      
      isAlternate = !isAlternate;
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Dear Team ${chaTeamName},</p>
        
        <p>Please find below the shipment details for clearance:</p>
        
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          ${tableRows}
        </table>
        
        <p>Kindly proceed with the required clearance formalities. Please confirm upon completion.</p>
        
        <p><strong>Best Regards,</strong><br/>
        Density Pharmachem Team</p>
      </div>
    `;

    // Prepare attachments for base_mail API
    const attachments = [];
    if (attachmentFiles) {
      Object.entries(attachmentFiles).forEach(([fieldKey, files]) => {
        files.forEach(file => {
          if (file.content && file.name) {
            attachments.push({
              filename: file.name,
              content: file.content,
              contentType: file.type || 'application/octet-stream'
            });
          }
        });
      });
    }

    console.log(`📎 Preparing to send ${attachments.length} attachments`);

    // Send email using base_mail API with attachments
    const emailRes = await fetch(
      `${process.env.API_BASE_URL || ''}/api/email/base_mail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "prakash@densitypharmachem.com",
          to: ["chandraprakashyadav1110@gmail.com","satish@densitypharmachem.com"],
          subject: `Import Shipment Details for Clearance — BOE No: ${formData.boeSbNo}`,
          body: htmlBody,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      }
    );

    const result = await emailRes.json();
    
    if (!emailRes.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    console.log(`✅ Email sent successfully for BOE No: ${formData.boeSbNo}`);
    console.log(`📎 Attachments sent: ${attachments.length}`);

    return res.status(200).json({
      success: true,
      message: `Email sent successfully with ${attachments.length} attachment(s)`,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error("Send Inbound Email Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      message: "Failed to send email"
    });
  }
}