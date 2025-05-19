// // pages/invoices/[id].js
// import { Suspense } from 'react';
// import dynamic from 'next/dynamic';
// import { useRouter } from 'next/router';
// import { getInvoiceDetail, getInvoiceStatusFlow } from 'lib/models/invoices';

// // Dynamically load heavy components
// const InvoiceDetails = dynamic(
//   () => import('components/invoicedetails'),
//   { 
//     suspense: true,
//     loading: () => <div className="p-4">Loading invoice details...</div>
//   }
// );

// const StatusFlowProgress = dynamic(
//   () => import('../components/StatusFlow'),
//   { 
//     suspense: true,
//     loading: () => <div className="p-4">Loading status flow...</div>
//   }
// );

// export default function InvoiceDetailsPage({ invoice, status, error }) {
//   const router = useRouter();

//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//           Error loading invoice details: {error}
//         </div>
//       </div>
//     );
//   }

//   if (!invoice) {
//     return (
//       <div className="p-6">
//         <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
//           Invoice not found.
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//         {/* Invoice Details */}
//         <Suspense fallback={<div className="p-4">Loading invoice details...</div>}>
//           <InvoiceDetails invoice={invoice} />
//         </Suspense>
//     </div>
//   );
// }

// export async function getServerSideProps(context) {
//   const { d: docNum, e: docEntry } = context.query;

//   if (!docNum || !docEntry || isNaN(docEntry) || isNaN(docNum)) {
//     return { notFound: true };
//   }

//   try {
//     const [invoice, statusResponse] = await Promise.all([
//       getInvoiceDetail(docEntry, docNum),
//       getInvoiceStatusFlow(docNum),
//     ]);

//     if (!invoice) {
//       return { notFound: true };
//     }

//     // Ensure status has all required fields with default values
//     const status = {
//       OrderNum: statusResponse?.OrderNum || null,
//       DeliveryNum: statusResponse?.DeliveryNum || null,
//       InvoiceNum: statusResponse?.InvoiceNum || null,
//       OrderStatus: statusResponse?.OrderStatus || 'PENDING',
//       DeliveryStatus: statusResponse?.DeliveryStatus || 'PENDING',
//       InvoiceStatus: statusResponse?.InvoiceStatus || 'PENDING',
//       PaymentStatus: statusResponse?.PaymentStatus || 'PENDING'
//     };

//     // Convert Date fields to strings and handle null values
//     const processedInvoice = {
//       ...invoice,
//       DocDate: invoice.DocDate ? new Date(invoice.DocDate).toISOString() : null,
//       DocDueDate: invoice.DocDueDate ? new Date(invoice.DocDueDate).toISOString() : null,
//       ShipDate: invoice.ShipDate ? new Date(invoice.ShipDate).toISOString() : null,
//       SODate: invoice.SODate ? new Date(invoice.SODate).toISOString() : null,
//       LineItems: invoice.LineItems?.map((item) => ({
//         ...item,
//         ShipDate: item.ShipDate ? new Date(item.ShipDate).toISOString() : null,
//         SODate: item.SODate ? new Date(item.SODate).toISOString() : null,
//       })) || [],
//     };

//     return {
//       props: {
//         invoice: processedInvoice,
//         status,
//       },
//     };
//   } catch (error) {
//     console.error('Error fetching invoice details:', error);
//     return {
//       props: {
//         invoice: null,
//         status: null,
//         error: 'Failed to fetch invoice details'
//       },
//     };
//   }
// }



// pages/invoices/[id].js
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Dynamically load your presentation component (no Node code in here!)
const InvoiceDetails = dynamic(
  () => import('components/InvoiceDetails'),
  {
    suspense: true,
    loading: () => <div className="p-4">Loading invoice details...</div>,
  }
);

export default function InvoiceDetailsPage({ invoice, status, error }) {
  const router = useRouter();

  // If Next.js is still statically rendering this page...
  if (router.isFallback) {
    return <div className="p-6">Loading page…</div>;
  }

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
      <Suspense fallback={<div className="p-4">Loading invoice details…</div>}>
        <InvoiceDetails invoice={invoice} status={status} />
      </Suspense>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { d: docNum, e: docEntry } = context.query;

  // Validate query params
  if (!docNum || !docEntry || isNaN(docNum) || isNaN(docEntry)) {
    return { notFound: true };
  }

  try {
    // 🔒 Only import your Node‐only model code here:
    const { getInvoiceDetail, getInvoiceStatusFlow } = await import(
      'lib/models/invoices'
    );

    // Fetch both details and status
    const [invoiceRaw, statusResponse] = await Promise.all([
      getInvoiceDetail(+docEntry, +docNum),
      getInvoiceStatusFlow(+docNum),
    ]);

    if (!invoiceRaw) {
      return { notFound: true };
    }

    // Normalize dates
    const isoDate = (d) =>
      d ? new Date(d).toISOString() : null;

    const invoice = {
      ...invoiceRaw,
      DocDate: isoDate(invoiceRaw.DocDate),
      DocDueDate: isoDate(invoiceRaw.DocDueDate),
      ShipDate: isoDate(invoiceRaw.ShipDate),
      SODate: isoDate(invoiceRaw.SODate),
      LineItems: (invoiceRaw.LineItems || []).map((li) => ({
        ...li,
        ShipDate: isoDate(li.ShipDate),
        SODate: isoDate(li.SODate),
      })),
    };

    // Provide a default status object if needed
    const status = {
      OrderNum: statusResponse?.OrderNum ?? null,
      DeliveryNum: statusResponse?.DeliveryNum ?? null,
      InvoiceNum: statusResponse?.InvoiceNum ?? null,
      OrderStatus: statusResponse?.OrderStatus ?? 'PENDING',
      DeliveryStatus: statusResponse?.DeliveryStatus ?? 'PENDING',
      InvoiceStatus: statusResponse?.InvoiceStatus ?? 'PENDING',
      PaymentStatus: statusResponse?.PaymentStatus ?? 'PENDING',
    };

    return {
      props: { invoice, status },
    };
  } catch (err) {
    console.error('Error in getServerSideProps:', err);
    return {
      props: {
        invoice: null,
        status: null,
        error: 'Failed to fetch invoice details.',
      },
    };
  }
}
