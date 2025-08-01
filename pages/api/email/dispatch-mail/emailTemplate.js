
// api/email/dispatch-mail/emailTemplate.js

import { formatDate } from "utils/formatDate";
import { formatCurrency } from "utils/formatCurrency";
import { generateTrackingLink, checkPdfAvailability, checkCoaAvailability } from "./invoiceService";

const generateTrackingLinkHtml = (trackingLink) => {
    if (!trackingLink) return '';
    return `<li>
        <strong>Click to Track shipment:</strong>
        <a href="${trackingLink}" target="_blank" style="display: inline-block; background-color: #007bff; color: white !important; padding: 4px 12px; font-size: 14px; text-decoration: none !important; border-radius: 4px; font-weight: bold; margin-left: 8px; vertical-align: middle;">
            Track Shipment
        </a>
    </li>`;
};

const generateTableRows = async (rows, docEntry, invoiceNo, baseUrl, customerPONo) => {
    const htmlRows = [];
    let hasCOA = false;

    for (const r of rows) {
        let coaLinkDisplay = '';
        
        // Get VendorBatchNum from invoice detail API
        if (r.ItemNo) {
            try {
                const detailResponse = await fetch(
                    `${baseUrl}/api/invoices/detail?docEntry=${docEntry}&docNum=${invoiceNo}`
                );
                
                if (detailResponse.ok) {
                    const invoiceDetail = await detailResponse.json();
                    
                    // Find the matching line item
                    const matchingItem = invoiceDetail?.LineItems?.find(item => 
                        item.ItemCode === r.ItemNo
                    );
                    
                    if (matchingItem && matchingItem.VendorBatchNum) {
                        const coaCheckResponse = await fetch(
                            `${baseUrl}/api/invoices/check-coa-availability`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                    itemCode: r.ItemNo, 
                                    vendorBatchNum: matchingItem.VendorBatchNum 
                                }),
                            }
                        );
                        
                        if (coaCheckResponse.ok) {
                            const coaResult = await coaCheckResponse.json();
                            if (coaResult.available) {
                                hasCOA = true;
                                // Create direct download link to the actual COA file
                                coaLinkDisplay = `<a href="${coaResult.downloadUrl}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">COA</a>`;
                                console.log(`✅ COA direct link generated for ${r.ItemNo}:`, coaResult.downloadUrl);
                            }
                        }
                    }
                }
            } catch (coaError) {
                console.warn(`Could not check COA availability for item ${r.ItemNo}:`, coaError);
            }
        }

        htmlRows.push(`
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">${r.InvoiceNo}</td>
                <td style="border:1px solid #ccc; padding:4px;">${formatDate(r.InvoiceDate)}</td>
                <td style="border:1px solid #ccc; padding:4px;">${r.ItemNo}</td>
                <td style="border:1px solid #ccc; padding:4px;">${r.ItemDescription}</td>
                <td style="border:1px solid #ccc; padding:4px;">${r.CasNo || ""}</td>
                <td style="border:1px solid #ccc; padding:4px;">${r.Unit}</td>
                <td style="border:1px solid #ccc; padding:4px;">${r.PackSize || ""}</td>
                <td style="border:1px solid #ccc; padding:4px; text-align:right;">${formatCurrency(r.UnitSalesPrice)}</td>
                <td style="border:1px solid #ccc; padding:4px; text-align:center;">${r.Qty}</td>
                <td style="border:1px solid #ccc; padding:4px; text-align:right;">${formatCurrency(r.TotalSalesPrice)}</td>
                <td style="border:1px solid #ccc; padding:4px; text-align:center;">${coaLinkDisplay}</td>
            </tr>
        `);
    }

    return { htmlRows, hasCOA };
};

export const generateEmailContent = async (invoiceDetails, trackingData, baseUrl) => {
    const { rows, InvoiceDate, TransportName, CustomerPONo } = invoiceDetails;
    const { TrackingNumber, TrackingUpdatedDate, DeliveryDate, DocEntry, InvoiceNo } = trackingData;

    // Check PDF availability
    const { pdfLinkHtml, isPdfAvailable } = await checkPdfAvailability(InvoiceNo, baseUrl);
    
    // Generate table rows and check for COA availability
    const { htmlRows, hasCOA } = await generateTableRows(rows, DocEntry, InvoiceNo, baseUrl, CustomerPONo);

    // Generate tracking link
    const trackingLink = generateTrackingLink(TransportName, TrackingNumber);
    const trackingLinkHtml = generateTrackingLinkHtml(trackingLink);

    // Create download links section
    let downloadLinksHtml = '';
    if (isPdfAvailable && hasCOA) {
        downloadLinksHtml = `
            <p><strong>Click here to download:</strong> 
                <a href="${pdfLinkHtml}" 
                   style="color: #007bff; text-decoration: underline;">Invoice</a> and 
                <a href="https://marketing.densitypharmachem.com/dispatch?docEntry=${DocEntry}&docNum=${InvoiceNo}&refNo=${encodeURIComponent(CustomerPONo)}&COAdownload=true" 
                   style="color: #007bff; text-decoration: underline;">COA</a>
            </p>
        `;
    } else if (isPdfAvailable) {
        downloadLinksHtml = `
            <p><strong>Click here to download:</strong> 
                <a href="${pdfLinkHtml}" 
                   style="color: #007bff; text-decoration: underline;">Invoice</a>
            </p>
        `;
    } else if (hasCOA) {
        downloadLinksHtml = `
            <p><strong>Click here to download:</strong> 
                <a href="https://marketing.densitypharmachem.com/dispatch?docEntry=${DocEntry}&docNum=${InvoiceNo}&refNo=${encodeURIComponent(CustomerPONo)}&COAdownload=true" 
                   style="color: #007bff; text-decoration: underline;">COA</a>
            </p>
        `;
    }

    const html = `
    <div style="font-family: Arial, sans-serif;font-size: 14px; line-height:1.4; color:#333;">
        <p>Dear Valued Customer,</p>
        <p>Your order <strong>${CustomerPONo}</strong> has been shipped.</p>
        <p><strong>Here are the tracking details:</strong></p>
        <ul>
            <li><strong>Our Invoice Number:</strong> ${InvoiceNo} – Dated # ${formatDate(InvoiceDate)}</li>
            <li><strong>Carrier name:</strong> ${TransportName}</li>
            <li><strong>Tracking Number:</strong> ${TrackingNumber} – Dated # ${formatDate(TrackingUpdatedDate)}</li>
            ${trackingLinkHtml}
            <li><strong>Estimated Delivery Date:</strong> ${DeliveryDate ? formatDate(DeliveryDate) : 'N/A'}</li>
        </ul>
        ${downloadLinksHtml}
        <p><strong>Items Shipped:</strong></p>
        <table style="border-collapse:collapse; width:100%; margin-top:8px; margin-bottom:16px;">
            <thead>
                <tr style="background:#f7f7f7;">
                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Inv#</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">INV Date</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Item No.</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Item/Service Description</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">CAS No.</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Unit</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:left;">Packsize</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:right;">Unit Sales Price</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:center;">QTY</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:right;">Total Sales Price</th>
                    <th style="border:1px solid #ccc; padding:6px; text-align:center;">COA</th>
                </tr>
            </thead>
            <tbody>
                ${htmlRows.slice(0, 5).join('')}
            </tbody>
        </table>
        ${htmlRows.length > 5 ? `
        <p style="margin-top: 10px; margin-bottom: 20px;">
            <a href="https://marketing.densitypharmachem.com/dispatch?docEntry=${DocEntry}&docNum=${InvoiceNo}&refNo=${encodeURIComponent(CustomerPONo)}" 
                style="color: #007bff; text-decoration: underline; font-weight: bold;" 
                target="_blank">
                Click to see all items 
            </a>
        </p>` : ''}
        <p>
          If you have any questions or need assistance, please don't hesitate to reach out to us at sales@densitypharmachem.com.
        </p>
        <p>Thank you for your purchase and support!</p>
        <strong>Website: www.densitypharmachem.com</strong><br/><br/>
        DENSITY PHARMACHEM PRIVATE LIMITED<br/>
        Sy No 615/A & 624/2/1, Pudur Village<br/>
        Medchal-Malkajgiri District,<br/>
        Hyderabad, Telangana, India-501401<br/>
        <img src="https://marketing.densitypharmachem.com/assets/Density_LOGO.jpg" 
             alt="Density Pharmachem" 
             width="180" 
             style="height:auto; width:180px; max-width:100%; margin-top:10px; border:0;">
    </div>
`;
    const subject = `Shipment tracking details# for order- ${CustomerPONo}`;
    return { subject, html };
};