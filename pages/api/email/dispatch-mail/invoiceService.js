
// pages/api/email/dispatch-mail/invoiceService.js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

// Function to get detailed invoice information
export const getInvoiceDetails = async (invoiceNo, docEntry, baseUrl) => {
    // Query to get detailed invoice information with both local COA and energy URL
    // FIXED: Proper COA prioritization logic
    const detailQuery = `
      SELECT TOP 6
            T0.DocNum                AS InvoiceNo,
            T0.DocDate               AS InvoiceDate,
            T0.DocCur                AS Currency,
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
            T9.E_Mail                AS CustomerEmail,
            ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum,
            T15.U_COA                AS LocalCOAFilename,
            
            -- Energy URL (fallback COA) - ONLY when no local COA exists
            CASE 
              WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS VARCHAR(500)))) <> '' 
              THEN ''  -- Don't generate energy URL if local COA exists
              WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND T1.ItemCode <> '' 
              THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' + 
                    LEFT(T1.ItemCode, CHARINDEX('-', T1.ItemCode + '-') - 1) + '_' + T15.U_vendorbatchno + '.pdf'
              ELSE ''
            END AS EnergyCoaUrl,
            
            -- COA Source determination
            CASE 
              WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS VARCHAR(500)))) <> '' 
              THEN 'LOCAL'
              WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND T1.ItemCode <> '' 
              THEN 'ENERGY'
              ELSE 'NONE'
            END AS CoaSource
            
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
    
    console.log(`\n=== SQL Query Results for Invoice ${invoiceNo} ===`);
    rows.forEach((row, index) => {
        console.log(`Row ${index + 1}: ${row.ItemNo}`);
        console.log(`  LocalCOAFilename: "${row.LocalCOAFilename}"`);
        console.log(`  EnergyCoaUrl: "${row.EnergyCoaUrl}"`);
        console.log(`  CoaSource: "${row.CoaSource}"`);
        console.log(`  VendorBatchNum: "${row.VendorBatchNum}"`);
    });
    console.log(`=== End SQL Results ===\n`);
    
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
        Currency,
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
        Currency,
    };
};

// Function to check if COA PDF is actually available (same logic as React component)
const checkCoaAvailability = async (coaUrl) => {
    if (!coaUrl) return false;
    
    try {
        // For local COA files, try a HEAD request first
        const response = await fetch(coaUrl, {
            method: 'HEAD',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        // If HEAD request fails, try GET with small range
        if (!response.ok) {
            const getResponse = await fetch(coaUrl, {
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1',
                    'Cache-Control': 'no-cache'
                }
            });
            
            return getResponse.ok || getResponse.status === 206;
        }
        
        // Check content type to ensure it's a PDF, not JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            console.log('COA returned JSON instead of PDF, marking as unavailable');
            return false;
        }
        
        return response.ok;
        
    } catch (error) {
        console.error('Error checking COA availability:', error);
        return false;
    }
};

// Helper function to generate COA URL based on source type (NOW WITH HARDCODED BASE URL)
export const generateCoaUrl = (row, baseUrl) => {
    // HARDCODED BASE URL for email links (to prevent localhost issues on mobile)
    const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
    
    const { CoaSource, LocalCOAFilename, EnergyCoaUrl, ItemNo, VendorBatchNum } = row;
    
    console.log(`Generating COA URL for ${ItemNo}:`, {
        CoaSource,
        LocalCOAFilename: LocalCOAFilename ? `"${LocalCOAFilename}"` : 'null/empty',
        EnergyCoaUrl: EnergyCoaUrl ? `"${EnergyCoaUrl}"` : 'null/empty',
        VendorBatchNum: VendorBatchNum ? `"${VendorBatchNum}"` : 'null/empty'
    });
    
    switch (CoaSource) {
        case 'LOCAL':
            if (LocalCOAFilename && LocalCOAFilename.trim() !== '') {
                // Extract just the filename from the full path
                let filename = LocalCOAFilename.trim();
                
                // Handle Windows paths - extract filename after last backslash
                if (filename.includes('\\')) {
                    const pathParts = filename.split('\\');
                    filename = pathParts[pathParts.length - 1];
                }
                
                // Handle Unix paths - extract filename after last forward slash
                if (filename.includes('/')) {
                    const pathParts = filename.split('/');
                    filename = pathParts[pathParts.length - 1];
                }
                
                const encodedFilename = encodeURIComponent(filename);
                // Use hardcoded base URL instead of dynamic baseUrl
                const localUrl = `${hardcodedBaseUrl}/api/coa/download/${encodedFilename}`;
                console.log(`  Extracted filename: "${filename}"`);
                console.log(`  Generated LOCAL URL (hardcoded): ${localUrl}`);
                return localUrl;
            }
            break;
            
        case 'ENERGY':
            if (ItemNo && VendorBatchNum && VendorBatchNum.trim() !== '') {
                // Use our proxy endpoint for Energy COAs to force download (with hardcoded base URL)
                const proxyUrl = `${hardcodedBaseUrl}/api/coa/download-energy/${encodeURIComponent(ItemNo)}/${encodeURIComponent(VendorBatchNum.trim())}`;
                console.log(`  Generated ENERGY PROXY URL (hardcoded): ${proxyUrl}`);
                return proxyUrl;
            }
            break;
            
        case 'NONE':
        default:
            console.log(`  No COA available`);
            return null;
    }
    
    console.log(`  Fallback: No valid COA URL found`);
    return null;
};

// NEW: Function to generate COA URL and check availability (similar to React component logic)
export const generateAndCheckCoaUrl = async (row, baseUrl) => {
    const coaUrl = generateCoaUrl(row, baseUrl);
    
    if (!coaUrl) {
        console.log(`No COA URL generated for ${row.ItemNo}`);
        return null;
    }
    
    console.log(`Checking availability for ${row.ItemNo}: ${coaUrl}`);
    const isAvailable = await checkCoaAvailability(coaUrl);
    
    if (isAvailable) {
        console.log(`COA available for ${row.ItemNo}`);
        return coaUrl;
    } else {
        console.log(`COA not available for ${row.ItemNo}`);
        return null;
    }
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
                // HARDCODED BASE URL (same as before)
                const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
                pdfLinkHtml = `${hardcodedBaseUrl}${pdfResult.downloadUrl}?download=true`;
            }
        }
    } catch (error) {
        console.error('PDF check failed:', error);
    }

    return { pdfLinkHtml, isPdfAvailable };
};

// DEPRECATED: This function is now replaced by generateAndCheckCoaUrl
export const checkCoaAvailability_DEPRECATED = async (itemNo, docEntry, invoiceNo, baseUrl) => {
    console.warn('checkCoaAvailability is deprecated - use generateAndCheckCoaUrl instead');
    return false;
};