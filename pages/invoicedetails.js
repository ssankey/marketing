

// pages/invoicedetail.js
import { Suspense } from 'react';
import { useRouter } from 'next/router';
import InvoiceDetails from 'components/invoicedetails';
// import StatusFlowProgress from 'components/StatusFlow'   // if/when needed
import { getInvoiceDetail, getInvoiceStatusFlow } from 'lib/models/invoices';

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
      <InvoiceDetails invoice={invoice} />
      {/* If you need status flow, render it here
      <StatusFlowProgress status={status} /> */}
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

    const status = {
      OrderNum:      statusResponse?.OrderNum      ?? null,
      DeliveryNum:   statusResponse?.DeliveryNum   ?? null,
      InvoiceNum:    statusResponse?.InvoiceNum    ?? null,
      OrderStatus:   statusResponse?.OrderStatus   ?? 'PENDING',
      DeliveryStatus:statusResponse?.DeliveryStatus?? 'PENDING',
      InvoiceStatus: statusResponse?.InvoiceStatus ?? 'PENDING',
      PaymentStatus: statusResponse?.PaymentStatus ?? 'PENDING',
    };

    // Convert dates to ISO strings for JSON serialisation
    const processedInvoice = {
      ...invoice,
      DocDate:     invoice.DocDate     ? new Date(invoice.DocDate).toISOString()     : null,
      DocDueDate:  invoice.DocDueDate  ? new Date(invoice.DocDueDate).toISOString()  : null,
      ShipDate:    invoice.ShipDate    ? new Date(invoice.ShipDate).toISOString()    : null,
      SODate:      invoice.SODate      ? new Date(invoice.SODate).toISOString()      : null,
      LineItems:   invoice.LineItems?.map(item => ({
        ...item,
        ShipDate: item.ShipDate ? new Date(item.ShipDate).toISOString() : null,
        SODate:  item.SODate  ? new Date(item.SODate).toISOString()  : null,
      })) ?? [],
    };

    return { props: { invoice: processedInvoice, status } };
  } catch (err) {
    console.error('Error fetching invoice details:', err);
    return {
      props: {
        invoice: null,
        status:  null,
        error:   'Failed to fetch invoice details',
      },
    };
  }
}
