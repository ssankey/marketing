

// pages/api/email/bulk-outstanding-mail/send-single.js

import { formatDate } from "utils/formatDate";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

/**
 * Utility: robust JSON fetch that surfaces non-JSON/HTML responses cleanly
 */
async function fetchJSON(url, init) {
  const res = await fetch(url, init);
  const bodyPreview = async () => {
    try {
      const t = await res.text();
      return t.slice(0, 500);
    } catch {
      return "";
    }
  };

  if (!res.ok) {
    const preview = await bodyPreview();
    throw new Error(
      `Fetch failed ${res.status} ${res.statusText} for ${url}\n` +
      `Body: ${preview}`
    );
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const preview = await bodyPreview();
    throw new Error(
      `Expected JSON but got '${ct}' from ${url}\n` +
      `Body: ${preview}`
    );
  }

  return res.json();
}

/**
 * Sends outstanding invoice email to a single customer
 * Body: { customerCode, email, selectedInvoices[], outstandingFilter }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { customerCode, email, selectedInvoices, outstandingFilter } =
    req.body || {};

  if (!customerCode || !email || !selectedInvoices) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: customerCode, email, selectedInvoices",
    });
  }

  try {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const BASE =
      process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // =========================================================
    // STEP 1: Fetch all outstanding for this customer
    // =========================================================
    const outstandingUrl = `${BASE}/api/customers/${encodeURIComponent(
      customerCode
    )}/outstanding?getAll=true&filterType=${encodeURIComponent(
      outstandingFilter || "Payment Pending"
    )}`;

    const { customerOutstandings } = await fetchJSON(outstandingUrl, {
      method: "GET",
    });

    // =========================================================
    // STEP 2: Filter to selected invoices
    // =========================================================
    const selectedSet = new Set(
      (selectedInvoices || []).map((v) => String(v).trim())
    );

    const selectedData = (customerOutstandings || []).filter((row) =>
      selectedSet.has(String(row["Invoice No."]).trim())
    );

    if (selectedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No matching invoices found",
      });
    }

    // =========================================================
    // STEP 3: Sort by Overdue Days (desc)
    // =========================================================
    selectedData.sort((a, b) => {
      const aOverdue = parseInt(a["Overdue Days"]) || 0;
      const bOverdue = parseInt(b["Overdue Days"]) || 0;
      return bOverdue - aOverdue;
    });

    // =========================================================
    // STEP 4: Build rows + totals
    // =========================================================
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
            <td style="text-align:center;">${overdueDays > 0 ? overdueDays : ""}</td>
            <td style="text-align:center;">${row["Tracking no"] || "N/A"}</td>
            <td style="text-align:center;">${formatDate(row["Dispatch Date"])}</td>
            <td style="text-align:center;">${row["SalesEmployee"] || "N/A"}</td>
          </tr>
        `;
      })
      .join("");

    const totalInvoiceAmount = selectedData.reduce(
      (sum, row) => sum + (Number(row["Invoice Total"]) || 0),
      0
    );
    const totalBalanceDueValue = selectedData.reduce((sum, row) => {
      const overdue = parseInt(row["Overdue Days"], 10) || 0;
      const balance = Number(row["Balance Due"]) || 0;
      return sum + (overdue > 0 ? balance : 0);
    }, 0);

    const summaryLine = `
      <p>
        The <strong>total outstanding amount</strong> is 
        <strong>₹${totalInvoiceAmount.toLocaleString("en-IN")}</strong>,
        out of which 
        <strong>₹${totalBalanceDueValue.toLocaleString("en-IN")}</strong> 
        is <strong>overdue for payment.</strong>
      </p>
    `;

    // =========================================================
    // STEP 5: Build email HTML
    // =========================================================
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
      <p>
        Regards,<br/>
        Shafique Khan<br/>
        Manager - Accounts<br/><br/>
        
        <strong>Website: www.densitypharmachem.com</strong><br/><br/>
        DENSITY PHARMACHEM PRIVATE LIMITED<br/><br/>
        Sy No 615/A & 624/2/1, Pudur Village<br/>
        Medchal-Malkajgiri District,<br/>
        Hyderabad, Telangana, India-501401<br/>
        Mobile: +91-9029298654<br/><br/>
        
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
    `;

    // Optional CC (salesperson)
    const salesPersonEmail = selectedData[0]?.SalesEmployeeMail;
    const ccList = [];
    if (salesPersonEmail) ccList.push(salesPersonEmail);

    // =========================================================
    // STEP 6: Call SMTP sender (/api/email/base_mail)
    // =========================================================
    const mailResult = await fetchJSON(`${BASE}/api/email/base_mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // from: "prakash@densitypharmachem.com",
        from: "shafique@densitypharmachem.com",
        to: [email],           // <-- send to the customer's email
        // to:"chandraprakashyadav310@gmail.com",
        bcc:"chandraprakashyadav1110@gmail.com",
        cc: ccList,         // uncomment if you want CC
        subject: "Request for Confirmation and Payment of Outstanding Invoices",
        body,
      }),
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: mailResult.messageId,
      invoiceCount: selectedData.length,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unknown error occurred",
    });
  }
}
