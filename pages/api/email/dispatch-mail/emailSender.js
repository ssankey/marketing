
// pages/api/email/dispatch-mail/emailSender.js
// Function to send dispatch email with conditional BCC and CC
import { buildToList } from "../../../../lib/emailOverrides";

export const sendDispatchEmail = async (
    emailContent,
    contactPersonEmail,
    salesPersonEmail,
    cardCode,
    specialCardCodes,
    baseUrl,
    managerEmail = null
) => {
    const { subject, html } = emailContent;

    // Console log the email IDs for checking
    console.log('Contact Person Email in senddispatch:', contactPersonEmail);
    console.log('Sales Person Email in senddispatch:', salesPersonEmail);
    console.log('CardCode in senddispatch:', cardCode);
    
    // Build BCC list based on CardCode
    const bccList = [];

    
    
    // Add prashant@densitypharmachem.com if CardCode matches
    if (specialCardCodes.includes(cardCode)) {
        bccList.push("prashant@densitypharmachem.com");
        console.log(`📌 Added Prashant to BCC for CardCode: ${cardCode}`);
    }
    
    // Build CC list - start with sales person email
    const ccList = [salesPersonEmail];

    // If this invoice's salesperson is mapped as someone's subordinate in
    // OHEM.salesPrson, CC that senior person too.
    if (managerEmail && !ccList.includes(managerEmail)) {
        ccList.push(managerEmail);
        console.log(`📌 Added manager email to CC: ${managerEmail}`);
    }

    // Add Mankind Pharma emails if CardCode is C000224
    if (cardCode === 'C000224') {
        ccList.push("Invoices@mankindpharma.com", "aman.bhatt@mankindpharma.com");
        console.log(`📌 Added Mankind Pharma emails to CC for CardCode: ${cardCode}`);
    }

    // Jubilant Biosys (CardCode C000072): Store.BiosysNoida@jubilantbiosys.com
    // used to be added here as CC — it's now one of the addresses buildToList()
    // adds to To instead (lib/emailOverrides.js), so it isn't duplicated in CC too.

    const sendRes = await fetch(
        `${baseUrl}/api/email/base_mail`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                from: "customerservice@densitypharmachem.com",
                to: buildToList([contactPersonEmail], cardCode),
                cc: ccList, // Dynamic CC list
                bcc: bccList, // Dynamic BCC list
                subject: subject,
                body: html,
            }),
        }
    );

    // Handle email send failure
    if (!sendRes.ok) {
        const errText = await sendRes.text();
        throw new Error(`base_mail failed: ${errText}`);
    }

    return true;
};