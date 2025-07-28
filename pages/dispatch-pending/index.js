// pages/dispatch-pending/index.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner, Alert, Button, Badge, Row, Col } from "react-bootstrap";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import Link from "next/link";

export default function DispatchInvoicePage() {
  const router = useRouter();
  const { docEntry, docNum } = router.query;
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docEntry || !docNum) return;

    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch invoice data without authentication
        const response = await fetch(`/api/invoices/public-detail?docEntry=${docEntry}&docNum=${docNum}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch invoice: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data.LineItems || data.LineItems.length === 0) {
          throw new Error('No invoice found with these details');
        }

        // Process line items to include COA links using the public endpoint
        const processedLineItems = await Promise.all(
          data.LineItems.map(async (item) => {
            if (item.ItemCode && item.VendorBatchNum) {
              try {
                const coaResponse = await fetch('/api/invoices/check-coa-availability', {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    itemCode: item.ItemCode, 
                    vendorBatchNum: item.VendorBatchNum 
                  }),
                });
                
                if (coaResponse.ok) {
                  const coaResult = await coaResponse.json();
                  return {
                    ...item,
                    coaAvailable: coaResult.available,
                    coaUrl: coaResult.downloadUrl
                  };
                }
              } catch (coaError) {
                console.warn(`Could not check COA for item ${item.ItemCode}:`, coaError);
              }
            }
            return item;
          })
        );

        setInvoiceData({
          ...data,
          LineItems: processedLineItems
        });
      } catch (error) {
        console.error("Error fetching invoice:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [docEntry, docNum]);

  const columns = [
    {
      accessorKey: "InvoiceNo",
      header: "Inv#",
      cell: ({ row }) => row.original.InvoiceNo || "-"
    },
    {
      accessorKey: "InvoiceDate",
      header: "INV Date",
      cell: ({ row }) => formatDate(row.original.InvoiceDate) || "-"
    },
    {
      accessorKey: "ItemNo",
      header: "Item No.",
      cell: ({ row }) => row.original.ItemCode || "-"
    },
    {
      accessorKey: "ItemDescription",
      header: "Item/Service Description",
      cell: ({ row }) => row.original.Description || "-"
    },
    {
      accessorKey: "CasNo",
      header: "CAS No.",
      cell: ({ row }) => row.original.CasNo || "-"
    },
    {
      accessorKey: "Unit",
      header: "Unit",
      cell: ({ row }) => row.original.UnitMsr || "-"
    },
    {
      accessorKey: "PackSize",
      header: "Packsize",
      cell: ({ row }) => row.original.PackSize || "-"
    },
    {
      accessorKey: "UnitSalesPrice",
      header: "Unit Sales Price",
      cell: ({ row }) => formatCurrency(row.original.Price) || "-"
    },
    {
      accessorKey: "Qty",
      header: "QTY",
      cell: ({ row }) => row.original.Quantity || "-"
    },
    {
      accessorKey: "TotalSalesPrice",
      header: "Total Sales Price",
      cell: ({ row }) => formatCurrency(row.original.LineTotal) || "-"
    },
    {
      accessorKey: "COA",
      header: "COA",
      cell: ({ row }) => {
        if (row.original.coaAvailable && row.original.coaUrl) {
          return (
            <Link 
              href={row.original.coaUrl} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-decoration-none"
            >
              COA
            </Link>
          );
        }
        return "-";
      }
    }
  ];

  const table = useReactTable({
    data: invoiceData?.LineItems || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExportExcel = () => {
    if (!invoiceData) return;

    const exportData = invoiceData.LineItems.map(item => ({
      "Inv#": invoiceData.DocNum,
      "INV Date": formatDate(invoiceData.DocDate),
      "Item No.": item.ItemCode,
      "Item/Service Description": item.Description,
      "CAS No.": item.CasNo || "-",
      "Unit": item.UnitMsr,
      "Packsize": item.PackSize || "-",
      "Unit Sales Price": formatCurrency(item.Price).slice(1),
      "QTY": item.Quantity,
      "Total Sales Price": formatCurrency(item.LineTotal).slice(1),
      "COA": item.coaAvailable ? "Available" : "-"
    }));

    downloadExcel(exportData, `Invoice_${invoiceData.DocNum}_Details`);
  };

  if (error) {
    return (
      <div className="container mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error loading invoice</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => router.back()}>
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {invoiceData && (
        <>
          <div className="mb-4 p-3 border rounded bg-light">
            <Row>
              <Col md={4}>
                <p><strong>Invoice #:</strong> {invoiceData.DocNum}</p>
                <p><strong>Date:</strong> {formatDate(invoiceData.DocDate)}</p>
                <p><strong>Status:</strong> 
                  <Badge 
                    bg={
                      invoiceData.DocStatusDisplay === 'Closed' ? 'success' : 
                      invoiceData.DocStatusDisplay === 'Cancelled' ? 'danger' : 
                      'primary'
                    } 
                    className="ms-2"
                  >
                    {invoiceData.DocStatusDisplay}
                  </Badge>
                </p>
                <p><strong>Customer PO #:</strong> {invoiceData.CustomerPONo || '-'}</p>
              </Col>
              <Col md={4}>
                <p><strong>Customer:</strong> {invoiceData.CardName} ({invoiceData.CardCode})</p>
                <p><strong>Sales Person:</strong> {invoiceData.SalesEmployee}</p>
                <p><strong>Payment Terms:</strong> {invoiceData.PaymentTerms}</p>
              </Col>
              <Col md={4}>
                <p><strong>Total Amount:</strong> {formatCurrency(invoiceData.DocTotal)}</p>
                <p><strong>Subtotal:</strong> {formatCurrency(invoiceData.Subtotal)}</p>
                <p><strong>Tax:</strong> {formatCurrency(invoiceData.TaxTotal)}</p>
              </Col>
            </Row>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Invoice Line Items</h2>
            <div>
              <Button variant="outline-secondary" onClick={() => router.back()} className="me-2">
                Back
              </Button>
              <Button variant="success" onClick={handleExportExcel}>
                Export to Excel
              </Button>
            </div>
          </div>
        </>
      )}

      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div className="table-responsive" style={{ height: 'calc(100vh - 250px)' }}>
          <table className="table table-striped table-hover">
            <thead className="table-dark sticky-top">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

DispatchInvoicePage.seo = {
  title: "Invoice Details | Dispatch",
  description: "View detailed invoice information for dispatch",
  keywords: "invoice, dispatch, details, sales",
};