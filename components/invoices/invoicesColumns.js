// components/invoices/invoicesColumns.js
import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { Badge, Button, Spinner } from "react-bootstrap";
import { useState, useEffect } from "react";

// Function to generate COA download URL
const generateCoaUrl = (row) => {
  const baseUrl = window.location.origin;
  const localCoaPath = row["COA Filename"];
  const itemNo = row["Item No."];
  const batchNum = row["BatchNum"];

  // Check if local COA exists and is not empty
  if (localCoaPath && localCoaPath.trim() !== '') {
    // Extract filename from full path
    let filename = localCoaPath.trim();
    
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
    return {
      url: `${baseUrl}/api/coa/download/${encodedFilename}`,
      type: 'local'
    };
  }
  
  // Fallback to energy URL if local COA doesn't exist and we have itemNo and batchNum
  if (itemNo && batchNum && batchNum.trim() !== '') {
    const itemPrefix = itemNo.includes('-') ? itemNo.split('-')[0] : itemNo;
    return {
      url: `${baseUrl}/api/coa/download-energy/${encodeURIComponent(itemPrefix)}/${encodeURIComponent(batchNum.trim())}`,
      type: 'energy'
    };
  }
  
  return null;
};

// Function to check if COA PDF is available
const checkCoaAvailability = async (coaInfo) => {
  if (!coaInfo) return false;
  
  try {
    // For local COA files, try a HEAD request first
    const response = await fetch(coaInfo.url, {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    // If HEAD request fails, try GET with small range
    if (!response.ok) {
      const getResponse = await fetch(coaInfo.url, {
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

// Function to handle COA download
const handleCoaDownload = (row) => {
  const coaInfo = generateCoaUrl(row);
  
  if (coaInfo) {
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = coaInfo.url;
    link.target = '_blank';
    link.download = ''; // This will use the filename from the server
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert('COA not available for this item');
  }
};

// Updated COA Cell Component - checks actual availability before showing link
const CoaCell = ({ row }) => {
  const [isAvailable, setIsAvailable] = useState(null); // null = loading, true/false = available/not available
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAvailability = async () => {
      setIsLoading(true);
      const coaInfo = generateCoaUrl(row);
      
      if (coaInfo) {
        try {
          const available = await checkCoaAvailability(coaInfo);
          setIsAvailable(available);
        } catch (error) {
          console.error('Error checking COA availability:', error);
          setIsAvailable(false);
        }
      } else {
        setIsAvailable(false);
      }
      
      setIsLoading(false);
    };
    
    checkAvailability();
  }, [row]);

  // Debug logging
  console.log('COA Status for row:', {
    itemNo: row["Item No."],
    batchNum: row["BatchNum"],
    coaFilename: row["COA Filename"],
    isLoading,
    isAvailable
  });
  
  if (isLoading) {
    return (
      <div className="d-flex align-items-center">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }
  
  if (isAvailable) {
    return (
      <Button
        variant="link"
        size="sm"
        className="p-0 text-decoration-underline"
        style={{ 
          fontSize: '0.875rem',
          color: '#007bff',
          border: 'none',
          background: 'none'
        }}
        onClick={() => handleCoaDownload(row)}
      >
        COA
      </Button>
    );
  }
  
  return <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>N/A</span>;
};

export const tableColumns = [
  {
    accessorKey: "DocNum",
    header: "Inv#",
    cell: ({ getValue, row }) => (
      <Link
        href={`/invoicedetails?d=${getValue()}&e=${row.original.DocEntry}`}
        className="text-blue-600 hover:text-blue-800"
      >
        {getValue() || 'N/A'}
      </Link>
    ),
  },
  {
    id: "Invoice Posting Dt.",
    header: "Invoice Posting Dt.",
    accessorFn: row => row["Invoice Posting Dt."],
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "SO No",
    header: "SO No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "SO Date",
    header: "SO Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "Customer ref no",
    header: "SO Customer Ref. No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Customer/Vendor Name",
    header: "Customer",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "ContactPerson",
    header: "Contact Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    id: "Item No.",
    header: "Item No.",
    accessorFn: row => row["Item No."],
    cell: ({ getValue }) => getValue() ?? "N/A",
  },
  {
    accessorKey: "Item/Service Description",
    header: "Item/Service Description",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Cas No",
    header: "Cas No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Category",
    header: "Category",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "COA Filename",
    header: "COA",
    cell: ({ row }) => <CoaCell row={row.original} />,
  },
  {
    id: "Vendor Catalog No.",
    header: "Vendor Catalog No.",
    accessorFn: row => row["Vendor Catalog No."],
    cell: ({ getValue }) => getValue() ?? "N/A",
  },
  {
    accessorKey: "Packsize",
    header: "PKZ",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    id: "Qty.",
    header: "Qty",
    accessorFn: row => row["Qty."],
    cell: ({ getValue }) => getValue() != null ? getValue() : "N/A",
  },
  {
    accessorKey: "Document Status",
    header: "STATUS",
    cell: ({ getValue }) => (
      <Badge bg={getValue() === 'Closed' ? 'success' : 'danger'}>
        {getValue() || 'N/A'}
      </Badge>
    ),
  },
  {
    accessorKey: "Tracking Number",
    header: "Tracking Number",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Dispatch Date",
    header: "Dispatch Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "Unit Sales Price",
    header: "Unit Sales Price",
    cell: ({ getValue }) => formatCurrency(getValue()),
  },
  {
    accessorKey: "Total Sales Price",
    header: "Total Sales Price/Open Value",
    cell: ({ getValue }) => formatCurrency(getValue()),
  },
  {
    accessorKey: "BatchNum",
    header: "BatchNum",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Mkt_Feedback",
    header: "Mkt_Feedback",
    cell: ({ getValue }) => getValue() || "N/A",
  },
];