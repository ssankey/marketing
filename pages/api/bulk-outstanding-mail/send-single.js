// pages/api/email/bulk-outstanding-mail/send-single.js

import { formatDate } from "utils/formatDate";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { customerCode, email, selectedInvoices, outstandingFilter } = req.body;

  if (!customerCode || !email || !selectedInvoices) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    // Fetch outstanding data
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const outstandingUrl = `${protocol}://${host}/api/customers/${customerCode}/outstanding?getAll=true&filterType=${outstandingFilter}`;

    const outstandingRes = await fetch(outstandingUrl);
    if (!outstandingRes.ok) {
      throw new Error("Failed to fetch outstanding data");
    }

    const { customerOutstandings } = await outstandingRes.json();

    // Filter for selected invoices
    const selectedData = customerOutstandings.filter((item) =>
      selectedInvoices.includes(item["Invoice No."])
    );

    if (selectedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No matching invoices found",
      });
    }

    // Sort by Overdue Days (descending)
    selectedData.sort((a, b) => {
      const aOverdue = parseInt(a["Overdue Days"]) || 0;
      const bOverdue = parseInt(b["Overdue Days"]) || 0;
      return bOverdue - aOverdue;
    });

    // Build table rows
    const tableRows = selectedData
      .map((row) => {
        const overdueDays = parseInt(row["Overdue Days"]) || 0;
        return `
     <tr>
  <td style="text-align:center;">${row["Invoice No."] || "N/A"}</td>
  <td style="text-align:center;">${formatDate(row["AR Invoice Date"])}</td>
  <td style="text-align:center;">${row["Customer Name"] || "N/A"}</td>
  <td style="text-align:center;">${row["CustomerPONo"] || "N/A"}</td>
  <td style="text-align:center;">${formatNumberWithIndianCommas(row["Invoice Total"])}</td>
  <td style="text-align:center;">${formatNumberWithIndianCommas(row["Balance Due"])}</td>
  <td style="text-align: center;">${overdueDays > 0 ? overdueDays : ""}</td>
  <td style="text-align:center;">${row["Tracking no"] || "N/A"}</td>
  <td style="text-align:center;">${formatDate(row["Dispatch Date"])}</td>
  <td style="text-align:center;">${row["SalesEmployee"] || "N/A"}</td>
</tr>
    `;
      })
      .join("");

    // Calculate totals
    const totalInvoiceAmount = selectedData.reduce(
      (sum, row) => sum + (row["Invoice Total"] || 0),
      0
    );

    const totalBalanceDueValue = selectedData.reduce((sum, row) => {
      const overdue = parseInt(row["Overdue Days"], 10) || 0;
      const balance = parseFloat(row["Balance Due"]) || 0;
      return sum + (overdue > 0 ? balance : 0);
    }, 0);

    const formattedInvoiceAmount = totalInvoiceAmount.toLocaleString("en-IN");
    const formattedBalanceDueAmount = totalBalanceDueValue.toLocaleString("en-IN");

    const summaryLine = `
  <p>
    The <strong>total outstanding amount</strong> is 
    <strong>₹${formattedInvoiceAmount}</strong>,
    out of which 
    <strong>₹${formattedBalanceDueAmount}</strong> 
    is <strong>overdue for payment.</strong>
  </p>
`;

    // Build email body
    const body = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>Dear Sir / Madam,</p>
  <p>Greetings of the day!</p>
  <p>Kindly find below the list of outstanding invoices currently showing as unpaid in our accounts.</p>
  <p>We request you to please verify whether all these invoices have been recorded in your books, 
     and arrange to make the payment for the due bills as per the agreed credit terms.</p>
  <p>
    <span style="color: red; text-decoration: underline;">
      If the payment has already been made, please disregard this message. Otherwise, 
      we would appreciate it if you could process the payment at your earliest convenience.
    </span>
  </p>
</div>
          
        ${summaryLine}
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
         <thead>
    <tr>
      <th>Invoice No.</th>
      <th>Invoice Date</th>
      <th>Customer Name</th>
      <th>SO Customer Ref. No</th>
      <th>Invoice Total</th>
      <th>Balance Due</th>
      <th>Overdue Days</th>
      <th>Tracking no</th>
      <th>Dispatch Date</th>
      <th>Sales Person</th>
    </tr>
  </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p>Looking forward to your confirmation.</p>
        <p>Regards,<br/>
           Shafique Khan<br/>

           Manager - Accounts<br/><br/>
           
           <strong>Website:www.densitypharmachem.com</strong><br/><br/>
           DENSITY PHARMACHEM PRIVATE LIMITED<br/><br/>
           Sy No 615/A & 624/2/1, Pudur Village<br/>
           Medchal-Malkajgiri District,<br/>
           Hyderabad, Telangana, India-501401<br/>
           Mobile : +91-9029298654<br/><br/>
           <strong>Bank Details</strong><br/>
           Name: Density Pharmachem Private Limited<br/>
           Bank Name: HDFC Bank Ltd<br/>
           Branch: Hyderguda<br/>
           Account Number: 99999989991174<br/>
           IFSC Code: HDFC0001996
        </p>
         <p style="color: red; font-weight: bold;">
    GST Number: 36AAKCD9426G1ZE<br/>
    MSME Number: UDYAM-TS-20-0101328
  </p>
      </div>
    `;

    // Get sales person email
    const salesPersonEmail = selectedData[0]?.SalesEmployeeMail;
    const ccList = ["shafique@densitypharmachem.com"];
    if (salesPersonEmail && salesPersonEmail !== "shafique@densitypharmachem.com") {
      ccList.push(salesPersonEmail);
    }

    // Use your existing base_mail API
    const mailRes = await fetch(`${protocol}://${host}/api/email/base_mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "shafique@densitypharmachem.com",
        to: [email],
        cc: ccList,
        subject: "Request for Confirmation and Payment of Outstanding Invoices",
        body,
      }),
    });

    const result = await mailRes.json();

    if (mailRes.ok) {
      return res.status(200).json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to send email",
      });
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unknown error",
    });
  }
}