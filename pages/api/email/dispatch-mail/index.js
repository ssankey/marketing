
// pages/api/email/dispatch-mail/index.js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";
import { getInvoiceDetails } from "./invoiceService";
import { generateEmailContent } from "./emailTemplate";
import { sendDispatchEmail } from "./emailSender";

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
    
        //   const recentInvoicesQuery = `SELECT 
        //     DocEntry,
        //     DocNum                         AS InvoiceNo,
        //     TrackNo                        AS TrackingNumber,
        //     U_TrackingNoUpdateDT           AS TrackingUpdatedDate,
        //     U_TrackingNoUpdateTM           AS TrackingUpdatedTime,
        //     U_DispatchDate                 AS DispatchDate,
        //     U_DeliveryDate                 AS DeliveryDate,
        //     OINV.CardCode,
        //     U_EmailSentDT,
        //     U_EmailSentTM
        // FROM OINV
        // WHERE
        //     TrackNo IS NOT NULL
        //     AND U_TrackingNoUpdateDT IS NOT NULL
        //     AND CAST(U_TrackingNoUpdateDT AS DATE) = CAST(GETDATE() AS DATE)
        //     AND OINV.CardCode NOT IN ('C000021', 'C000020')
        //     AND (
        //         -- Case 1: Email not sent yet
        //         (U_EmailSentDT IS NULL AND U_EmailSentTM IS NULL)
        //         OR (CAST(U_EmailSentDT AS TIME) = '00:00:00.000')
        //         -- Case 2: Tracking updated after email was sent
        //         OR (U_EmailSentDT IS NOT NULL AND U_TrackingNoUpdateDT > U_EmailSentDT)
        //     )
        
        //         `;
        
        //     const invoices = await queryDatabase(recentInvoicesQuery);
        const invoices = [
        {
            DocEntry: 3346,
            InvoiceNo: "25212363",
            TrackingNumber: "25020250021531",
            TrackingUpdatedDate: "2025-07-24T00:00:00.000",
            TrackingUpdatedTime: null,
            DispatchDate: "2025-07-24T00:00:00.000",
            DeliveryDate: null,
            CardCode: "C000048",
            U_EmailSentDT: "2025-08-05T18:20:23.680",
            U_EmailSentTM: "1101"
        },
        {
            DocEntry: 3719,
            InvoiceNo: "25212726",
            TrackingNumber: "25020250021668",
            TrackingUpdatedDate: "2025-08-11T00:00:00.000",
            TrackingUpdatedTime: null,
            DispatchDate: "2025-08-11T00:00:00.000",
            DeliveryDate: null,
            CardCode: "C000189",
            U_EmailSentDT: "2025-08-11T19:58:42.767",
            U_EmailSentTM: "870"
        },
        {
            DocEntry: 2156,
            InvoiceNo: "25220020",
            TrackingNumber: "555-4274 4984",
            TrackingUpdatedDate: "2025-07-17T00:00:00.000",
            TrackingUpdatedTime: null,
            DispatchDate: "2025-07-15T00:00:00.000",
            DeliveryDate: "2025-07-18T00:00:00.000",
            CardCode: "C000011",
            U_EmailSentDT: "2025-08-05T18:20:19.313",
            U_EmailSentTM: "1101"
        },
        {
            DocEntry: 200,
            InvoiceNo: "24100144",
            TrackingNumber: "24020250124021",
            TrackingUpdatedDate: "2025-07-17T00:00:00.000",
            TrackingUpdatedTime: null,
            DispatchDate: "2025-07-15T00:00:00.000",
            DeliveryDate: "2025-07-18T00:00:00.000",
            CardCode: "C000016",
            U_EmailSentDT: "2025-08-05T18:20:19.313",
            U_EmailSentTM: "1101"
        }
        ];


      

        // Return early if no invoices found
        if (!invoices.length) {
            return res.status(200).json({ message: "No new shipments to notify." });
        }

        // Track success/failure counts
        let success = 0,
            failure = 0;

        // Get the base URL from environment or construct it
        const baseUrl = process.env.API_BASE_URL;

        // Process each invoice
        for (const inv of invoices) {
            const {
                DocEntry,
                InvoiceNo,
                TrackingNumber,
                TrackingUpdatedDate,
                DispatchDate,
                DeliveryDate,
            } = inv;

            try {
                // Get detailed invoice information
                const invoiceDetails = await getInvoiceDetails(InvoiceNo, DocEntry, baseUrl);
                
                // Validate contact person email exists
                if (!invoiceDetails.ContactPersonEmail || !invoiceDetails.ContactPersonEmail.trim()) {
                    throw new Error(`Missing Contact Person Email for Invoice ${InvoiceNo}`);
                }

                // Generate email content
                const emailContent = await generateEmailContent(
                    invoiceDetails, 
                    {
                        TrackingNumber,
                        TrackingUpdatedDate,
                        DispatchDate,
                        DeliveryDate,
                        DocEntry,
                        InvoiceNo
                    }, 
                    baseUrl
                );

                // Send email with contact person and sales person email IDs
                await sendDispatchEmail(
                    emailContent, 
                    invoiceDetails.ContactPersonEmail,
                    invoiceDetails.SalesPersonEmail,
                    baseUrl
                );

                // const now = new Date();
                // const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
                // await queryDatabase(
                //     `
                //     UPDATE OINV
                //     SET U_EmailSentDT = GETDATE(),
                //         U_EmailSentTM = @tm
                //     WHERE DocNum = @docNum
                //     `,
                //     [
                //     { name: "tm", type: sql.SmallInt, value: minutesSinceMidnight },
                //     { name: "docNum", type: sql.Int, value: InvoiceNo },
                //     ]
                // );

                success++;
            } catch (err) {
                console.error(`Invoice ${InvoiceNo} failed:`, err);
                failure++;
            }
        }

        // Return final results
        return res.status(200).json({
            success: true,
            message: `Notified ${success} shipments, ${failure} failures.`,
        });
    } catch (err) {
        console.error("sendShipmentNotification error:", err);
        return res.status(500).json({ error: err.message });
    }
}