// components/hooks/useInvoiceData.js
import { useState, useEffect } from "react";

export default function useInvoiceData(docEntry, docNum, refNo) {
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const [isPdfAvailable, setIsPdfAvailable] = useState(false);
  const [coaAvailability, setCoaAvailability] = useState({});
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

  const checkAllCoas = async (lineItems) => {
    const availabilityMap = {};
    
    try {
      const detailResponse = await fetch(
        `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
      );
      
      if (detailResponse.ok) {
        const invoiceDetail = await detailResponse.json();
        
        if (invoiceDetail?.LineItems) {
          const batchSize = 5;
          const itemsToCheck = invoiceDetail.LineItems.filter(item => item.ItemCode && item.VendorBatchNum);
          
          for (let i = 0; i < itemsToCheck.length; i += batchSize) {
            const batch = itemsToCheck.slice(i, i + batchSize);
            await Promise.all(batch.map(async (item) => {
              try {
                const coaCheckResponse = await fetch('/api/invoices/check-coa-availability', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    itemCode: item.ItemCode, 
                    vendorBatchNum: item.VendorBatchNum 
                  }),
                });
                
                if (coaCheckResponse.ok) {
                  const result = await coaCheckResponse.json();
                  availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = {
                    available: result.available,
                    downloadUrl: result.downloadUrl
                  };
                } else {
                  availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = {
                    available: false,
                    downloadUrl: null
                  };
                }
              } catch (error) {
                console.error('COA check error:', error);
                availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = {
                  available: false,
                  downloadUrl: null
                };
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch detailed invoice data for COA checks:', error);
    }
    
    setCoaAvailability(availabilityMap);
  };

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch basic invoice data
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

      // Fetch transport details separately
      let transportData = {};
      try {
        const transportResponse = await fetch(
          `/api/invoices/transport-details?docEntry=${docEntry}`
        );
        if (transportResponse.ok) {
          transportData = await transportResponse.json();
        } else {
          console.warn('Failed to fetch transport details, using fallback values');
        }
      } catch (transportError) {
        console.error('Error fetching transport details:', transportError);
      }

      const headerInfo = {
        InvoiceNo: data.InvoiceNo,
        InvoiceDate: data.InvoiceDate,
        CustomerName: data.CustomerName,
        CustomerCode: data.CustomerCode,
        SalesPersonName: data.SalesPersonName,
        PaymentTerms: data.PaymentTerms,
        CustomerPONo: data.CustomerPONo,
        TrackingNumber: transportData.TrackingNumber || data.TrackingNumber || "N/A",
        TransportName: transportData.TransportName || data.TransportName || "null",
        TrackingUpdatedDate: transportData.TrackingUpdatedDate || data.TrackingUpdatedDate || data.InvoiceDate,
        DeliveryDate: null,
      };

      setHeaderData(headerInfo);
      setInvoiceData(data.LineItems);
      
      // Check PDF availability immediately after setting header data
      await checkPdfAvailability(headerInfo.InvoiceNo);
      
      // Pre-check COA availability for all items
      await checkAllCoas(data.LineItems);
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

  return {
    invoiceData,
    loading,
    error,
    headerData,
    isPdfAvailable,
    coaAvailability,
    pdfCheckCompleted
  };
}