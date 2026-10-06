

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