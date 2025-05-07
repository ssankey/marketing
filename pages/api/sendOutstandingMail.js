


// pages/api/sendOutstandingMail.js
import { Resend } from 'resend';
 
import sql from 'mssql';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { to, customerName, data } = req.body;

    if (!to || !data || !data.length) {
      return res.status(400).json({ error: 'Missing email or data.' });
    }

    function formatCurrency(amount) {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, // no decimals
  }).format(Math.round(amount));
}


  
    const totalInvoiceAmount = data.reduce((sum, row) => sum + Math.round(row["Invoice Total"] || 0), 0);
const totalBalanceDue = data.reduce((sum, row) => sum + Math.round(row["Balance Due"] || 0), 0);


 
const summaryLine = `
  <p>
    The <strong>total outstanding amount</strong> is <strong>₹${totalInvoiceAmount.toLocaleString("en-IN")}</strong>,
    out of which <strong>₹${totalBalanceDue.toLocaleString("en-IN")}</strong> is <strong>overdue for payment.</strong>
  </p>
`;


   
//     const tableRows = data.map(row => `
//   <tr>
//     <td>${row["Customer Name"] || 'N/A'}</td>
//     <td>${formatDate(row["Delivery Date"])}</td>
//     <td>${row["Invoice No."] || 'N/A'}</td>
//     <td>${formatDate(row["AR Invoice Date"])}</td>
//     <td>${formatCurrency(row["Invoice Total"])}</td>
//     <td>${formatCurrency(row["Balance Due"])}</td>
//     <td>${row["Overdue Days"] || 'N/A'}</td>
//     <td>${row["Payment Terms"] || 'N/A'}</td>
//   </tr>
// `).join('');

const tableRows = data.map(row => `
  <tr>
    <td style="text-align: center;">${row["Customer Name"] || 'N/A'}</td>
    <td style="text-align: center;">${formatDate(row["Delivery Date"])}</td>
    <td style="text-align: center;">${row["Invoice No."] || 'N/A'}</td>
    <td style="text-align: center;">${formatDate(row["AR Invoice Date"])}</td>
    <td style="text-align: center;">${formatCurrency(row["Invoice Total"])}</td>
    <td style="text-align: center;">${formatCurrency(row["Balance Due"])}</td>
    <td style="text-align: center;">${row["Overdue Days"] || 'N/A'}</td>
    <td style="text-align: center;">${row["Payment Terms"] || 'N/A'}</td>
  </tr>
`).join('');

    
    const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Dear Sir / Madam,</p>
    <p>Greetings of the day!</p>
    <p>
      Kindly find below the list of outstanding invoices currently showing as unpaid in our accounts.<br/>
      We request you to please verify whether all these invoices have been recorded in your books, 
      and arrange to make the payment for the due bills as per the agreed credit terms.
      Kindly also share the payment details once processed.
    </p>
    ${summaryLine}
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead style="background-color: #f2f2f2;">
        <tr>
          <th>Customer/Vendor Name</th>
          <th>Delivery Date</th>
          <th>Invoice No</th>
          <th>AR Invoice Date</th>
          <th>Invoice Total</th>
          <th>Balance Due</th>
          <th>Overdue Days</th>
          <th>Payment Terms Code</th>
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
       <img
  src="https://tinypic.host/images/2025/05/05/Density_LOGO.jpg"
  alt="Logo"
  style="height: 50px; width: auto; max-width: 200px; display: block; margin-bottom: 10px;"
/><br/>
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
  </div>
`;

    // Send email
    const { data: emailData, error } = await resend.emails.send({
      // from: process.env.MAIL_SENDER || 'onboarding@resend.dev',
      from : 'onboarding@resend.dev',
      to: to,
    
      // subject: `Outstanding Invoices - ${customerName || 'Customer'}`,
      subject: `Request for Confirmation and Payment of Outstanding Invoices`,
      html: html,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email.' });
    }

    return res.status(200).json({ success: true, data: emailData });
  } catch (err) {
    console.error('Error in sendOutstandingMail:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}