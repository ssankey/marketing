// pages/invoice-print.js

import PrintInvoiceComponent from 'components/PrintInvoiceComponent';
import { getInvoiceDetail } from 'lib/models/invoices';
import { useRouter } from 'next/router';

const InvoicePrintPage = ({invoice}) => {
  const router = useRouter();

  return <PrintInvoiceComponent invoice={invoice}  />;
};



// Set the Layout property to null to avoid using any layout
InvoicePrintPage.Layout = null;

// Add this to explicitly tell _app.js to remove all layout
InvoicePrintPage.noLayout = true;



export default InvoicePrintPage;


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
