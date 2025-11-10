
// // // pages/api/email/dispatch-mail/emailSender.js

// // // Function to send dispatch email
// // export const sendDispatchEmail = async (emailContent, contactPersonEmail, salesPersonEmail, baseUrl) => {
// //     const { subject, html } = emailContent;

// //     // Console log the email IDs for checking
// //     console.log('Contact Person Email in senddispatch:', contactPersonEmail);
// //     console.log('Sales Person Email in senddispatch:', salesPersonEmail);
    
// //     const sendRes = await fetch(
// //         `${baseUrl}/api/email/base_mail`,
// //         {
// //             method: "POST",
// //             headers: { "Content-Type": "application/json" },
// //             body: JSON.stringify({
// //             from: "sales@densitypharmachem.com",
// //             to: [contactPersonEmail],
// //             cc: [salesPersonEmail],
// //             bcc: ["chandraprakashyadav1110@gmail.com"],
// //             subject: subject,
// //             body: html,
// //             }),
// //         }
// //     );
// //     // const sendRes = await fetch(
// //     //     `${baseUrl}/api/email/base_mail`,
// //     //     {
// //     //         method: "POST",
// //     //         headers: { "Content-Type": "application/json" },
// //     //         body: JSON.stringify({
// //     //         from: "prakash@densitypharmachem.com",
// //     //         to: ["chandraprakashyadav1110@gmail.com"],
                
           
// //     //         subject: subject,
// //     //         body: html,
// //     //         }),
// //     //     }
// //     // );

// //     // Handle email send failure
// //     if (!sendRes.ok) {
// //         const errText = await sendRes.text();
// //         throw new Error(`base_mail failed: ${errText}`);
// //     }

// //     return true;
// // };



// // ===================================================
// // pages/api/email/dispatch-mail/emailSender.js
// // ===================================================

// // Function to send dispatch email with conditional BCC
// export const sendDispatchEmail = async (
//     emailContent, 
//     contactPersonEmail, 
//     salesPersonEmail, 
//     cardCode,
//     specialCardCodes,
//     baseUrl
// ) => {
//     const { subject, html } = emailContent;

//     // Console log the email IDs for checking
//     console.log('Contact Person Email in senddispatch:', contactPersonEmail);
//     console.log('Sales Person Email in senddispatch:', salesPersonEmail);
//     console.log('CardCode in senddispatch:', cardCode);
    
//     // Build BCC list based on CardCode
//     const bccList = ["chandraprakashyadav1110@gmail.com"];
    
//     // Add prashant@densitypharmachem.com if CardCode matches
//     if (specialCardCodes.includes(cardCode)) {
//         bccList.push("prashant@densitypharmachem.com");
//         console.log(`📌 Added Prashant to BCC for CardCode: ${cardCode}`);
//     }
    
//     const sendRes = await fetch(
//         `${baseUrl}/api/email/base_mail`,
//         {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 from: "sales@densitypharmachem.com",
//                 to: [contactPersonEmail],
//                 cc: [salesPersonEmail],
//                 bcc: bccList, // Dynamic BCC list
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


// Function to send dispatch email with conditional BCC
export const sendDispatchEmail = async (
    emailContent, 
    contactPersonEmail, 
    salesPersonEmail, 
    cardCode,
    specialCardCodes,
    baseUrl
) => {
    const { subject, html } = emailContent;

    // Console log the email IDs for checking
    console.log('Contact Person Email in senddispatch:', contactPersonEmail);
    console.log('Sales Person Email in senddispatch:', salesPersonEmail);
    console.log('CardCode in senddispatch:', cardCode);
    
    // Build BCC list based on CardCode
    const bccList = ["chandraprakashyadav1110@gmail.com"];
    
    // Add prashant@densitypharmachem.com if CardCode matches
    if (specialCardCodes.includes(cardCode)) {
        bccList.push("prashant@densitypharmachem.com");
        console.log(`📌 Added Prashant to BCC for CardCode: ${cardCode}`);
    }
    
    const sendRes = await fetch(
        `${baseUrl}/api/email/base_mail`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                from: "sales@densitypharmachem.com",
                to: [contactPersonEmail],
                cc: [salesPersonEmail],
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