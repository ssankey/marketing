// pages/api/email/dispatch-mail/invoiceService.js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

// Function to get detailed invoice information
export const getInvoiceDetails = async (invoiceNo, docEntry, baseUrl) => {
    // Query to get detailed invoice information
    const detailQuery = `
      SELECT TOP 6
            T0.DocNum                AS InvoiceNo,
            T0.DocDate               AS InvoiceDate,
            T4.DocNum                AS OrderNo,
            T4.DocDate               AS OrderDate,
            T0.TrackNo               AS TrackingNumber,
            T0.U_TrackingNoUpdateDT  AS TrackingUpdatedDate,
            T0.U_DispatchDate        AS DispatchDate,
            T0.U_DeliveryDate        AS DeliveryDate,
            T0.U_AirlineName         AS ShippingMethod,
            SHP.TrnspName            AS TransportName,
            T0.CardName              AS CustomerName,
            T0.CardCode              AS CustomerCode,
            T7.Name                  AS ContactPerson,
            T0.SlpCode               AS SalesPersonID,
            T5.SlpName               AS SalesPersonName,
            T5.Email                 AS SalesPersonEmail,
            T7.E_MailL               AS ContactPersonEmail,
            T6.PymntGroup            AS PaymentTerms,
            T0.NumAtCard             AS CustomerPONo,
            T1.ItemCode              AS ItemNo,
            T1.Dscription            AS ItemDescription,
            T1.U_CasNo               AS CasNo,
            T1.UnitMsr               AS Unit,
            T1.U_PackSize            AS PackSize,
            T1.Price                 AS UnitSalesPrice,
            T1.Quantity              AS Qty,
            T1.LineTotal             AS TotalSalesPrice,
            T9.E_Mail                AS CustomerEmail
            FROM OINV T0
            LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
            INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
            LEFT JOIN DLN1 T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
            LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
            LEFT JOIN RDR1 T8 ON T8.DocEntry = T2.BaseEntry AND T8.LineNum = T2.BaseLine AND T2.BaseType = 17
            LEFT JOIN ORDR T4 ON T4.DocEntry = T8.DocEntry
            INNER JOIN OCRD T9 ON T9.CardCode = T0.CardCode
            LEFT JOIN OCPR T7 ON T0.CntctCode = T7.CntctCode
            INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
            INNER JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
           
            LEFT JOIN IBT1 T10 ON T10.CardCode = T3.CardCode 
                AND T10.ItemCode = T2.ItemCode 
                AND T10.BaseNum = T3.DocNum 
                AND T10.BaseEntry = T3.DocEntry 
                AND T10.BaseType = 15 
                AND T10.BaseLinNum = T2.LineNum 
                AND T10.Direction = 1
            LEFT JOIN OIBT T15 ON T10.ItemCode = T15.ItemCode 
                AND T10.BatchNum = T15.BatchNum
          
            WHERE T0.DocNum = @docNum
            ORDER BY T1.LineNum;
    `;

    // Set parameters for the detail query
    const params = [{ name: "docNum", type: sql.Int, value: invoiceNo }];
    const rows = await queryDatabase(detailQuery, params);
    
    // Throw error if no details found
    if (!rows.length) {
        throw new Error("No details found for DocNum=" + docEntry);
    }

    // Extract common fields from first row
    const {
        InvoiceDate,
        OrderNo,
        OrderDate,
        CustomerName,
        CustomerEmail,
        ShippingMethod,
        TransportName,
        CustomerPONo,
        SalesPersonName,
        SalesPersonEmail,
        ContactPersonEmail,
        PaymentTerms,
    } = rows[0];

    // Log email addresses for debugging
    console.log(`Invoice ${invoiceNo} → CustomerEmail:`, CustomerEmail);
    console.log(`Invoice ${invoiceNo} → SalesPersonEmail:`, SalesPersonEmail);
    console.log(`Invoice ${invoiceNo} -> Contact Person Email:`, ContactPersonEmail);

    return {
        rows,
        InvoiceDate,
        OrderNo,
        OrderDate,
        CustomerName,
        CustomerEmail,
        ShippingMethod,
        TransportName,
        CustomerPONo,
        SalesPersonName,
        SalesPersonEmail,
        ContactPersonEmail,
        PaymentTerms,
    };
};




export const generateTrackingLink = (transportName, trackingNumber) => {
    if (!transportName || !trackingNumber) return null;
    
    const lowerTransportName = transportName.toLowerCase();
    
    if (lowerTransportName.includes('shree maruti')) {
        return `https://trackcourier.io/track-and-trace/shree-maruti-courier/${trackingNumber}`;
    } else if (lowerTransportName.includes('bluedart') || lowerTransportName.includes('blue dart')) {
        return `https://trackcourier.io/track-and-trace/blue-dart-courier/${trackingNumber}`;
    }
    
    return null;
};

export const checkPdfAvailability = async (invoiceNo, baseUrl) => {
    let pdfLinkHtml = '';
    let isPdfAvailable = false;
    
    try {
        const pdfCheckResponse = await fetch(
            `${baseUrl}/api/invoices/check-pdf-availability`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ docNum: invoiceNo }),
            }
        );
        
        if (pdfCheckResponse.ok) {
            const pdfResult = await pdfCheckResponse.json();
            if (pdfResult.available) {
                isPdfAvailable = true;
                const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
                pdfLinkHtml = `${hardcodedBaseUrl}${pdfResult.downloadUrl}?download=true`;
            }
        }
    } catch (error) {
        console.error('PDF check failed:', error);
    }

    return { pdfLinkHtml, isPdfAvailable };
};

export const checkCoaAvailability = async (itemNo, docEntry, invoiceNo, baseUrl) => {
    try {
        const detailResponse = await fetch(
            `${baseUrl}/api/invoices/detail?docEntry=${docEntry}&docNum=${invoiceNo}`
        );
        
        if (detailResponse.ok) {
            const invoiceDetail = await detailResponse.json();
            const matchingItem = invoiceDetail?.LineItems?.find(item => 
                item.ItemCode === itemNo
            );
            
            if (matchingItem?.VendorBatchNum) {
                const coaCheckResponse = await fetch(
                    `${baseUrl}/api/invoices/check-coa-availability`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            itemCode: itemNo, 
                            vendorBatchNum: matchingItem.VendorBatchNum 
                        }),
                    }
                );
                
                if (coaCheckResponse.ok) {
                    const coaResult = await coaCheckResponse.json();
                    return coaResult.available;
                }
            }
        }
    } catch (error) {
        console.warn(`Could not check COA availability for item ${itemNo}:`, error);
    }
    return false;
};
