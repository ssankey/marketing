// pages/api/email/testCustomerService.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("📧 Initiating test email from Customer Service...");

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007BFF;">Testing Mail from Customer Service</h2>
        <p>Dear Team,</p>
        <p>This is a <strong>test email</strong> sent from <code>customerservice@densitypharmachem.com</code>.</p>
        <p>If you're receiving this, the email configuration is working correctly! ✅</p>
        <br/>
        <p>Timestamp: <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></p>
        <br/>
        <hr/>
        <p style="color: #666; font-size: 12px;">
          <strong>Customer Service Department</strong><br/>
          Density Pharmachem Private Limited<br/>
          
          Email: customerservice@densitypharmachem.com<br/>
          Website: www.densitypharmachem.com
        </p>
      </div>
    `;

    // Use base_mail API for consistent email handling
    const emailRes = await fetch(
      `${process.env.API_BASE_URL}/api/email/base_mail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "customerservice@densitypharmachem.com",
          to: ["chandraprakashyadav1110@gmail.com"],
          subject: "Test Email from Customer Service",
          body: html,
        }),
      }
    );

    const result = await emailRes.json();

    if (!emailRes.ok) {
      throw new Error(result.message || "Failed to send test email");
    }

    console.log("✅ Test email sent successfully via base_mail!");
    console.log("📧 Message ID:", result.messageId);

    return res.status(200).json({
      success: true,
      message: "Test email sent successfully from customerservice@densitypharmachem.com",
      messageId: result.messageId,
      to: "chandraprakashyadav1110@gmail.com",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Test Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message || error.toString(),
    });
  }
}