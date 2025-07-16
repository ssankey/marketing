// pages/api/kpi/kpi-modal.js
import { getUniqueInvoicesList } from "../../../lib/models/invoices"; // Adjust the import path
import { getOrdersFromDatabase } from "../../../lib/models/orders"; // Adjust the import path

/**
 * Fetch sales data for the modal based on date filter
 */
export async function getSalesDataForModal(params) {
  const {
    dateFilter,
    startDate,
    endDate,
    isAdmin = false,
    contactCodes = [],
    cardCodes = [],
  } = params;

  let fromDate, toDate;
  const today = new Date();

  // Calculate date range based on filter
  switch (dateFilter) {
    case "today":
      fromDate = toDate = today.toISOString().split("T")[0];
      break;
    case "thisWeek": {
      // Get current day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = today.getDay();
      
      // Calculate start of week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      
      // This week is from Sunday to today
      fromDate = startOfWeek.toISOString().split("T")[0];
      toDate = today.toISOString().split("T")[0];
      break;
    }
  //   case "thisMonth": {
  //     // This month: from 1st to today (not last day of month)
  //     const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  //     fromDate = firstDay.toISOString().split("T")[0];
  //     toDate = today.toISOString().split("T")[0]; // Use today, not last day of month

  //     // Add debug logs
  // console.log('This month calculation:');
  // console.log('Today:', today);
  // console.log('First day of month:', firstDay);
  // console.log('From date:', fromDate);
  // console.log('To date:', toDate);

  //     break;
  //   }
  case "thisMonth": {
  // Get today's date string and replace day with '01'
  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
  fromDate = todayStr.substring(0, 8) + '01'; // YYYY-MM-01
  toDate = todayStr;

  // // Add debug logs
  // console.log('This month calculation:');
  // console.log('Today:', today);
  // console.log('Today string:', todayStr);
  // console.log('From date:', fromDate);
  // console.log('To date:', toDate);
  
  break;
}
    case "custom":
      if (startDate && endDate) {
        fromDate = startDate;
        toDate = endDate;
      } else {
        fromDate = toDate = today.toISOString().split("T")[0];
      }
      break;
    default:
      fromDate = toDate = today.toISOString().split("T")[0];
  }

  // console.log('Fetching data for date range:', fromDate, 'to', toDate);
  
  try {
    const result = await getUniqueInvoicesList({
      page: 1,
      search: "",
      status: "all",
      fromDate,
      toDate,
      sortField: "DocDate",
      sortDir: "desc",
      itemsPerPage: 1000, // Get more records for modal
      isAdmin,
      cardCodes,
      contactCodes,
      getAll: true, // Get all records for modal
    });

    // Transform the data to match the expected format
    const formattedInvoices = result.invoices.map(invoice => ({
      DocNum: invoice.DocNum,
      DocDate: invoice.DocDate,
      ContactPerson: invoice.ContactPerson,
      DocDueDate: invoice.DocDueDate,
      "Cust Code": invoice.CardCode,
      "Customer/Vendor Name": invoice.CardName,
      ProductCount: invoice.LineItemCount,
      DocTotal: invoice.DocTotal,
      "Document Currency": invoice.DocCur,
      "Dispatch Date": invoice.U_DispatchDate,
      "Tracking Number": invoice.TrackNo,
      "Transport Name": invoice.TransportName,
      "Sales Employee": invoice.SalesEmployee,
      // Add any additional fields needed by the table
    }));

    return formattedInvoices;
  } catch (error) {
    console.error("Error fetching sales data for modal:", error);
    return [];
  }
}

/**
 * Fetch orders data for the modal based on date filter
 */
// export async function getOrdersDataForModal(params) {
//   const {
//     dateFilter,
//     startDate,
//     endDate,
//     isAdmin = false,
//     contactCodes = [],
//     cardCodes = [],
//   } = params;

//   let fromDate, toDate;
//   const today = new Date();

//   // Calculate date range based on filter
//   switch (dateFilter) {
//     case "today":
//       fromDate = toDate = today.toISOString().split("T")[0];
//       break;
//     case "thisWeek": {
//       // Get current day of week (0 = Sunday, 6 = Saturday)
//       const dayOfWeek = today.getDay();
      
//       // Calculate start of week (Sunday)
//       const startOfWeek = new Date(today);
//       startOfWeek.setDate(today.getDate() - dayOfWeek);
      
//       // This week is from Sunday to today
//       fromDate = startOfWeek.toISOString().split("T")[0];
//       toDate = today.toISOString().split("T")[0];
//       break;
//     }
//     case "thisMonth": {
//       // This month: from 1st to today (not last day of month)
//       const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//       fromDate = firstDay.toISOString().split("T")[0];
//       toDate = today.toISOString().split("T")[0]; // Use today, not last day of month
//       break;
//     }
//     case "custom":
//       if (startDate && endDate) {
//         fromDate = startDate;
//         toDate = endDate;
//       } else {
//         fromDate = toDate = today.toISOString().split("T")[0];
//       }
//       break;
//     default:
//       fromDate = toDate = today.toISOString().split("T")[0];
//   }

//   // In getOrdersDataForModal/getSalesDataForModal:
// console.log('Fetching data for date range:', fromDate, 'to', toDate);



//   try {
//     const result = await getOrdersFromDatabase({
//       page: 1,
//       search: "",
//       status: "all",
//       fromDate,
//       toDate,
//       sortField: "DocDate",
//       sortDir: "desc",
//       itemsPerPage: 1000, // Get more records for modal
//       isAdmin,
//       contactCodes,
//       cardCodes,
//       getAll: true, // Get all records for modal
//       excludeCancelled: true,

//     });

//     return result.orders || [];

//   } catch (error) {
//     console.error("Error fetching orders data for modal:", error);
//     return [];
//   }
// }

/**
 * Fetch orders data for the modal based on date filter
 */
export async function getOrdersDataForModal(params) {
  const {
    dateFilter,
    startDate,
    endDate,
    isAdmin = false,
    contactCodes = [],
    cardCodes = [],
  } = params;

  let fromDate, toDate;
  const today = new Date();

  // ✅ Use the same date calculation logic as dashboard.js
  const formatDate = (date) => date.toLocaleDateString("en-CA");

  // Calculate date range based on filter
  switch (dateFilter) {
    case "today":
      fromDate = toDate = formatDate(today);
      break;
    case "thisWeek": {
      // Get current day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = today.getDay();
      
      // Calculate start of week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      
      // This week is from Sunday to today
      fromDate = formatDate(startOfWeek);
      toDate = formatDate(today);
      break;
    }
    case "thisMonth": {
      // ✅ FIXED: Use the same logic as dashboard.js
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      fromDate = formatDate(firstDayOfMonth);
      toDate = formatDate(today);
      break;
    }
    case "custom":
      if (startDate && endDate) {
        fromDate = startDate;
        toDate = endDate;
      } else {
        fromDate = toDate = formatDate(today);
      }
      break;
    default:
      fromDate = toDate = formatDate(today);
  }

  // Add debug logging
  console.log('Modal - Fetching orders for date range:', fromDate, 'to', toDate);

  try {
    const result = await getOrdersFromDatabase({
      page: 1,
      search: "",
      status: "all",
      fromDate,
      toDate,
      sortField: "DocDate",
      sortDir: "desc",
      itemsPerPage: 1000, // Get more records for modal
      isAdmin,
      contactCodes,
      cardCodes,
      getAll: true, // Get all records for modal
      excludeCancelled: true,
    });

    return result.orders || [];

  } catch (error) {
    console.error("Error fetching orders data for modal:", error);
    return [];
  }
}