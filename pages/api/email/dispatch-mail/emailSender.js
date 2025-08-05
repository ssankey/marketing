// // pages/api/email/dispatch-mail/emailSender.js

// // Function to send dispatch email
// export const sendDispatchEmail = async (emailContent, baseUrl) => {
//     const { subject, html } = emailContent;

//     const sendRes = await fetch(
//         `${baseUrl}/api/email/base_mail`,
//         {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 from: "prakash@densitypharmachem.com",
//                 to: ["chandraprakashyadav1110@gmail.com"],
//                 subject: subject,
//                 body: html,
//             }),
//         }
//     );

//     // Handle email send failure
//     if (!sendRes.ok) {
//         const errText = await sendRes.text();
//         throw new Error(`base_mail failed: ${errText}`);
//     }

//     return true;
// };

// pages/api/email/dispatch-mail/emailSender.js

// Function to send dispatch email
export const sendDispatchEmail = async (emailContent, contactPersonEmail, salesPersonEmail, baseUrl) => {
    const { subject, html } = emailContent;

    // Console log the email IDs for checking
    console.log('Contact Person Email in senddispatch:', contactPersonEmail);
    console.log('Sales Person Email in senddispatch:', salesPersonEmail);
    
    const sendRes = await fetch(
        `${baseUrl}/api/email/base_mail`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            from: "sales@densitypharmachem.com",
            to: [ContactPersonEmail],
            cc: [SalesPersonEmail],
            bcc: ["chandraprakashyadav1110@gmail.com"],
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