// pages/invoicedetail.js

import InvoiceDetails from 'components/invoicedetails';
import { getInvoiceDetail } from 'lib/models/invoices';
import { useRouter } from 'next/router';

export default function InvoiceDetailsPage({ invoice, error }) {
  const router = useRouter();

  if (error) {
    return <div>Error loading invoice details: {error}</div>;
  }

  if (!invoice) {
    return <div>Invoice not found.</div>;
  }

  return <InvoiceDetails invoice={invoice} />;
}

export async function getServerSideProps(context) {
  const { d: docNum, e: docEntry } = context.query;

  // Validate parameters
  if (!docNum || !docEntry || isNaN(docEntry) || isNaN(docNum)) {
    return {
      notFound: true,
    };
  }

  try {
    const invoice = await getInvoiceDetail(docEntry, docNum);

    if (!invoice) {
      return {
        notFound: true,
      };
    }

    // Convert Date fields to strings
    const processedInvoice = {
      ...invoice,
      DocDate: invoice.DocDate ? invoice.DocDate.toISOString() : null,
      DocDueDate: invoice.DocDueDate ? invoice.DocDueDate.toISOString() : null,
      ShipDate: invoice.ShipDate ? invoice.ShipDate.toISOString() : null,
      LineItems: invoice.LineItems.map((item) => ({
        ...item,
        ShipDate: item.ShipDate ? item.ShipDate.toISOString() : null,
      })),
    };

    return {
      props: {
        invoice: processedInvoice,
      },
    };
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return {
      props: {
        error: 'Failed to fetch invoice details',
      },
    };
  }
}
