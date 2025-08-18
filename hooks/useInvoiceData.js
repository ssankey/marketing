

// components/hooks/useInvoiceData.js
import { useState, useEffect } from "react";

export default function useInvoiceData(docEntry, docNum, refNo) {
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const [isPdfAvailable, setIsPdfAvailable] = useState(false);
  const [pdfCheckCompleted, setPdfCheckCompleted] = useState(false);

  const checkPdfAvailability = async (invoiceNo) => {
    if (!invoiceNo) return;
    
    try {
      const response = await fetch('/api/invoices/check-pdf-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docNum: invoiceNo }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setIsPdfAvailable(result.available);
      } else {
        setIsPdfAvailable(false);
      }
    } catch (error) {
      console.error('PDF check failed:', error);
      setIsPdfAvailable(false);
    } finally {
      setPdfCheckCompleted(true);
    }
  };

  // Function to check if COA PDF is actually available
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

  const generateCoaUrl = (row) => {
    const { CoaSource, LocalCOAFilename, EnergyCoaUrl, ItemNo, VendorBatchNum } = row;
    
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
          return `/api/coa/download/${encodedFilename}`;
        }
        break;
        
      case 'ENERGY':
        if (ItemNo && VendorBatchNum && VendorBatchNum.trim() !== '') {
          // Use the existing download-energy endpoint with item code and batch number
          return `/api/coa/download-energy/${encodeURIComponent(ItemNo)}/${encodeURIComponent(VendorBatchNum.trim())}`;
        }
        break;
        
      case 'NONE':
      default:
        return null;
    }
    
    return null;
  };

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/invoices/public-detail?docEntry=${docEntry}&docNum=${docNum}${refNo ? `&refNo=${encodeURIComponent(refNo)}` : ''}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'No dispatch details found');
        }
        throw new Error(`Failed to fetch invoice: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.LineItems) {
        throw new Error('No dispatch details found');
      }

      // Generate COA URLs and check availability for each line item
      const lineItemsWithCOA = await Promise.all(
        data.LineItems.map(async (item) => {
          const coaUrl = generateCoaUrl(item);
          let isCoaAvailable = false;
          
          if (coaUrl) {
            try {
              isCoaAvailable = await checkCoaAvailability(coaUrl);
            } catch (error) {
              console.error(`Error checking COA availability for ${item.ItemNo}:`, error);
              isCoaAvailable = false;
            }
          }
          
          return {
            ...item,
            COA: isCoaAvailable ? coaUrl : null, // Only set COA if it's actually available
            isCoaChecked: true
          };
        })
      );

      const headerInfo = {
        InvoiceNo: data.InvoiceNo,
        InvoiceDate: data.InvoiceDate,
        CustomerPONo: data.CustomerPONo,
        CarrierName: data.CarrierName,
        TrackingNumber: data.TrackingNo || "N/A",
        TransportName: data.CarrierName || "null",
        TrackingUpdatedDate: data.TrackingUpdatedDate || data.InvoiceDate,
        DeliveryDate: data.DeliveryDate,
      };

      setHeaderData(headerInfo);
      setInvoiceData(lineItemsWithCOA);
      
      await checkPdfAvailability(headerInfo.InvoiceNo);
      
    } catch (error) {
      setError(error.message);
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!docEntry || !docNum) return;
    fetchInvoiceDetails();
  }, [docEntry, docNum, refNo]);

  // Only consider COA available if at least one item has a verified COA URL
  const isCOAAvailable = invoiceData.some(item => item.COA && item.COA.trim() !== '');

  return {
    invoiceData,
    loading,
    error,
    headerData,
    isPdfAvailable,
    pdfCheckCompleted,
    isCOAAvailable
  };
}