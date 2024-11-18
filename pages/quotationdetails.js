// pages/quotationdetails.js

import { useRouter } from 'next/router';
import QuotationDetails from 'components/QuotationDetails';
import { getQuotationDetail } from 'lib/models/quotations';

export default function QuotationDetailsPage({ quotation, error }) {
  const router = useRouter();

  if (error) {
    return <div>Error loading quotation details: {error}</div>;
  }

  if (!quotation) {
    return <div>Quotation not found.</div>;
  }

  return <QuotationDetails quotation={quotation} />;
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
    const quotation = await getQuotationDetail(docEntry, docNum);

    if (!quotation) {
      return {
        notFound: true,
      };
    }

    // Convert Date fields to strings
    const processedQuotation = {
      ...quotation,
      DocDate: quotation.DocDate ? quotation.DocDate.toISOString() : null,
      DocDueDate: quotation.DocDueDate ? quotation.DocDueDate.toISOString() : null,
      LineItems: quotation.LineItems.map((item) => ({
        ...item,
        ShipDate: item.ShipDate ? item.ShipDate.toISOString() : null,
      })),
    };

    return {
      props: {
        quotation: processedQuotation,
      },
    };
  } catch (error) {
    console.error('Error fetching quotation details:', error);
    return {
      props: {
        error: 'Failed to fetch quotation details',
      },
    };
  }
}
