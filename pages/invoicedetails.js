import InvoiceDetails from 'components/invoicedetails';
import { getInvoiceDetail, getInvoiceStatusFlow } from 'lib/models/invoices';
import { useRouter } from 'next/router';
import mermaid from 'mermaid';
import { useEffect } from 'react';
// Create a new component for the status flow diagram

const StatusFlowDiagram = ({ status }) => {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
  }, []);
  if (!status) return null;

  // Ensure all required values exist with fallbacks
  const orderNum = status.OrderNum || 'N/A';
  const deliveryNum = status.DeliveryNum || 'N/A';
  const invoiceNum = status.InvoiceNum || 'N/A';
  const paymentStatus = status.PaymentStatus || 'PENDING';

  const mermaidDefinition = `
  graph LR
    SO[Order #${orderNum}]
    DL[Delivery #${deliveryNum}]
    INV[Invoice #${invoiceNum}]
    PAY[Payment]
    
    SO --> DL
    DL --> INV
    INV --> PAY
    
    classDef complete fill:#90EE90,stroke:#333,stroke-width:2px
    classDef inProgress fill:#FFD700,stroke:#333,stroke-width:2px
    classDef pending fill:#D3D3D3,stroke:#333,stroke-width:2px

    class SO ${status.OrderStatus === 'CLOSED' ? 'complete' : status.OrderStatus === 'OPEN' ? 'inProgress' : 'pending'}
    class DL ${status.DeliveryStatus === 'CLOSED' ? 'complete' : status.DeliveryStatus === 'OPEN' ? 'inProgress' : 'pending'}
    class INV ${status.InvoiceStatus === 'CLOSED' ? 'complete' : status.InvoiceStatus === 'OPEN' ? 'inProgress' : 'pending'}
    class PAY ${paymentStatus === 'PAID' ? 'complete' : paymentStatus === 'PARTIALLY PAID' ? 'inProgress' : 'pending'}
`;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Order Status Flow</h2>
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="mermaid">
          {mermaidDefinition}
        </div>
      </div>
    </div>
  );
};



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
      <StatusFlowDiagram status={status} />
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