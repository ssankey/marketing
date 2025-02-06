import InvoiceDetails from 'components/invoicedetails';
import { getInvoiceDetail, getInvoiceStatusFlow } from 'lib/models/invoices';
import { useRouter } from 'next/router';
import mermaid from 'mermaid';
import { useEffect } from 'react';
import StatusFlowProgress from '../components/StatusFlow';



export default function InvoiceDetailsPage({ invoice, status, error }) {
  const router = useRouter();

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading invoice details: {error}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Invoice not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* <StatusFlowDiagram status={status} /> */}
      {/* <StatusFlowProgress status={status} /> */}
      <InvoiceDetails invoice={invoice} />
    </div>
  );
}

export async function getServerSideProps(context) {
  const { d: docNum, e: docEntry } = context.query;

  if (!docNum || !docEntry || isNaN(docEntry) || isNaN(docNum)) {
    return { notFound: true };
  }

  try {
    const [invoice, statusResponse] = await Promise.all([
      getInvoiceDetail(docEntry, docNum),
      getInvoiceStatusFlow(docNum),
    ]);

    if (!invoice) {
      return { notFound: true };
    }

    // Ensure status has all required fields with default values
    const status = {
      OrderNum: statusResponse?.OrderNum || null,
      DeliveryNum: statusResponse?.DeliveryNum || null,
      InvoiceNum: statusResponse?.InvoiceNum || null,
      OrderStatus: statusResponse?.OrderStatus || 'PENDING',
      DeliveryStatus: statusResponse?.DeliveryStatus || 'PENDING',
      InvoiceStatus: statusResponse?.InvoiceStatus || 'PENDING',
      PaymentStatus: statusResponse?.PaymentStatus || 'PENDING'
    };

    // Convert Date fields to strings and handle null values
    const processedInvoice = {
      ...invoice,
      DocDate: invoice.DocDate?.toISOString() || null,
      DocDueDate: invoice.DocDueDate?.toISOString() || null,
      ShipDate: invoice.ShipDate?.toISOString() || null,
      LineItems: invoice.LineItems?.map((item) => ({
        ...item,
        ShipDate: item.ShipDate?.toISOString() || null,
      })) || [],
    };

    return {
      props: {
        invoice: processedInvoice,
        status,
      },
    };
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return {
      props: {
        invoice: null,
        status: null,
        error: 'Failed to fetch invoice details'
      },
    };
  }
}