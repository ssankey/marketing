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

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new COA invoice detail API
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
      setInvoiceData(data.LineItems);
      
      // Check PDF availability
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

  // Check if any COA is available in the data
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