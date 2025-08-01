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
         const recentInvoicesQuery = `
            SELECT 
            DocEntry,
            DocNum                         AS InvoiceNo,
            TrackNo                        AS TrackingNumber,
            U_TrackingNoUpdateDT           AS TrackingUpdatedDate,
            U_TrackingNoUpdateTM           AS TrackingUpdatedTime,
            U_DispatchDate                 AS DispatchDate,
            U_DeliveryDate                 AS DeliveryDate,
            OINV.CardCode,
            U_EmailSentDT,
            U_EmailSentTM
        FROM OINV
        WHERE
            TrackNo IS NOT NULL
            AND U_TrackingNoUpdateDT IS NOT NULL
            AND CAST(U_TrackingNoUpdateDT AS DATE) = CAST(DATEADD(DAY, -2, GETDATE()) AS DATE)
            AND OINV.CardCode NOT IN ('C000021', 'C000020');
                `;
        
            const invoices = await queryDatabase(recentInvoicesQuery);

        // const invoices = [
        // {
        //     DocEntry: 2156,
        //     InvoiceNo: 25220020,
        //     TrackingNumber: "555-4274 4984",
        //     TrackingUpdatedDate: "2025-07-17 00:00:00.000",
        //     TrackingUpdatedTime: null,
        //     DispatchDate: "2025-07-15 00:00:00.000",
        //     DeliveryDate: "2025-07-18 00:00:00.000",
        //     CardCode: "C000011",
        //     U_EmailSentDT: "2025-07-17 12:49:41.960",
        //     U_EmailSentTM: "440"
        // },
        //  {
        //     DocEntry: 3346,
        //     InvoiceNo: 25212363,
        //     TrackingNumber: "25020250021531",
        //     TrackingUpdatedDate: "2025-07-24 00:00:00.000",
        //     TrackingUpdatedTime: null,
        //     DispatchDate: "2025-07-24 00:00:00.000",
        //     DeliveryDate: null,
        //     CardCode: "C000048",
        //     U_EmailSentDT: "2025-07-24 19:49:55.353",
        //     U_EmailSentTM: "860"
        // },

        // ];

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

                // Send email
                await sendDispatchEmail(emailContent, baseUrl);

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