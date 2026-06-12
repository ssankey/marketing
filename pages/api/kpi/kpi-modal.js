// // pages/api/kpi/kpi-modal.js
// import { getUniqueInvoicesList } from "../../../lib/models/invoices"; // Adjust the import path
// import { getOrdersFromDatabase } from "../../../lib/models/orders"; // Adjust the import path

// /**
//  * Fetch sales data for the modal based on date filter
//  */
// export async function getSalesDataForModal(params) {
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
 
//   case "thisMonth": {
//   // Get today's date string and replace day with '01'
//   const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
//   fromDate = todayStr.substring(0, 8) + '01'; // YYYY-MM-01
//   toDate = todayStr;


  
//   break;
// }
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

//   // console.log('Fetching data for date range:', fromDate, 'to', toDate);
  
//   try {
//     const result = await getUniqueInvoicesList({
//       page: 1,
//       search: "",
//       status: "all",
//       fromDate,
//       toDate,
//       sortField: "DocDate",
//       sortDir: "desc",
//       itemsPerPage: 1000, // Get more records for modal
//       isAdmin,
//       cardCodes,
//       contactCodes,
//       getAll: true, // Get all records for modal
//     });

//     // Transform the data to match the expected format
//     const formattedInvoices = result.invoices.map(invoice => ({
//       DocNum: invoice.DocNum,
//       DocDate: invoice.DocDate,
//       ContactPerson: invoice.ContactPerson,
//       DocDueDate: invoice.DocDueDate,
//       "Cust Code": invoice.CardCode,
//       "Customer/Vendor Name": invoice.CardName,
//       ProductCount: invoice.LineItemCount,
//       DocTotal: invoice.DocTotal,
//       "Document Currency": invoice.DocCur,
//       "Dispatch Date": invoice.U_DispatchDate,
//       "Tracking Number": invoice.TrackNo,
//       "Transport Name": invoice.TransportName,
//       "Sales Employee": invoice.SalesEmployee,
//       // Add any additional fields needed by the table
//     }));

//     return formattedInvoices;
//   } catch (error) {
//     console.error("Error fetching sales data for modal:", error);
//     return [];
//   }
// }

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

//   // ✅ Use the same date calculation logic as dashboard.js
//   const formatDate = (date) => date.toLocaleDateString("en-CA");

//   // Calculate date range based on filter
//   switch (dateFilter) {
//     case "today":
//       fromDate = toDate = formatDate(today);
//       break;
//     case "thisWeek": {
//       // Get current day of week (0 = Sunday, 6 = Saturday)
//       const dayOfWeek = today.getDay();
      
//       // Calculate start of week (Sunday)
//       const startOfWeek = new Date(today);
//       startOfWeek.setDate(today.getDate() - dayOfWeek);
      
//       // This week is from Sunday to today
//       fromDate = formatDate(startOfWeek);
//       toDate = formatDate(today);
//       break;
//     }
//     case "thisMonth": {
//       // ✅ FIXED: Use the same logic as dashboard.js
//       const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//       fromDate = formatDate(firstDayOfMonth);
//       toDate = formatDate(today);
//       break;
//     }
//     case "custom":
//       if (startDate && endDate) {
//         fromDate = startDate;
//         toDate = endDate;
//       } else {
//         fromDate = toDate = formatDate(today);
//       }
//       break;
//     default:
//       fromDate = toDate = formatDate(today);
//   }

//   // Add debug logging
//   console.log('Modal - Fetching orders for date range:', fromDate, 'to', toDate);

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

// // pages/api/kpi/kpi-modal.js
// import { getUniqueInvoicesList } from "../../../lib/models/invoices"; // Adjust the import path
// import { getOrdersFromDatabase } from "../../../lib/models/orders"; // Adjust the import path

// /**
//  * Fetch sales data for the modal based on date filter
//  */
// export async function getSalesDataForModal(params) {
//   const {
//     dateFilter,
//     startDate,
//     endDate,
//     isAdmin = false,
//     contactCodes = [],
//     cardCodes = [],
//     role = null, // ✅ ADD role parameter
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
//       // Get today's date string and replace day with '01'
//       const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
//       fromDate = todayStr.substring(0, 8) + '01'; // YYYY-MM-01
//       toDate = todayStr;
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

//   // console.log('Fetching data for date range:', fromDate, 'to', toDate);
  
//   try {
//     // ✅ Skip contactCodes and cardCodes for 3ASenrise role
//     const effectiveContactCodes = role === '3ASenrise' ? [] : contactCodes;
//     const effectiveCardCodes = role === '3ASenrise' ? [] : cardCodes;
//     const effectiveIsAdmin = isAdmin || role === '3ASenrise';

//     const result = await getUniqueInvoicesList({
//       page: 1,
//       search: "",
//       status: "all",
//       fromDate,
//       toDate,
//       sortField: "DocDate",
//       sortDir: "desc",
//       itemsPerPage: 1000, // Get more records for modal
//       isAdmin: effectiveIsAdmin,
//       cardCodes: effectiveCardCodes,
//       contactCodes: effectiveContactCodes,
//       getAll: true, // Get all records for modal
//     });

//     // Transform the data to match the expected format
//     const formattedInvoices = result.invoices.map(invoice => ({
//       DocNum: invoice.DocNum,
//       DocDate: invoice.DocDate,
//       ContactPerson: invoice.ContactPerson,
//       DocDueDate: invoice.DocDueDate,
//       "Cust Code": invoice.CardCode,
//       "Customer/Vendor Name": invoice.CardName,
//       ProductCount: invoice.LineItemCount,
//       DocTotal: invoice.DocTotal,
//       "Document Currency": invoice.DocCur,
//       "Dispatch Date": invoice.U_DispatchDate,
//       "Tracking Number": invoice.TrackNo,
//       "Transport Name": invoice.TransportName,
//       "Sales Employee": invoice.SalesEmployee,
//       // Add any additional fields needed by the table
//     }));

//     return formattedInvoices;
//   } catch (error) {
//     console.error("Error fetching sales data for modal:", error);
//     return [];
//   }
// }

// export async function getOrdersDataForModal(params) {
//   const {
//     dateFilter,
//     startDate,
//     endDate,
//     isAdmin = false,
//     contactCodes = [],
//     cardCodes = [],
//     role = null, // ✅ ADD role parameter
//   } = params;

//   let fromDate, toDate;
//   const today = new Date();

//   // ✅ Use the same date calculation logic as dashboard.js
//   const formatDate = (date) => date.toLocaleDateString("en-CA");

//   // Calculate date range based on filter
//   switch (dateFilter) {
//     case "today":
//       fromDate = toDate = formatDate(today);
//       break;
//     case "thisWeek": {
//       // Get current day of week (0 = Sunday, 6 = Saturday)
//       const dayOfWeek = today.getDay();
      
//       // Calculate start of week (Sunday)
//       const startOfWeek = new Date(today);
//       startOfWeek.setDate(today.getDate() - dayOfWeek);
      
//       // This week is from Sunday to today
//       fromDate = formatDate(startOfWeek);
//       toDate = formatDate(today);
//       break;
//     }
//     case "thisMonth": {
//       // ✅ FIXED: Use the same logic as dashboard.js
//       const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//       fromDate = formatDate(firstDayOfMonth);
//       toDate = formatDate(today);
//       break;
//     }
//     case "custom":
//       if (startDate && endDate) {
//         fromDate = startDate;
//         toDate = endDate;
//       } else {
//         fromDate = toDate = formatDate(today);
//       }
//       break;
//     default:
//       fromDate = toDate = formatDate(today);
//   }

//   // Add debug logging
//   console.log('Modal - Fetching orders for date range:', fromDate, 'to', toDate);

//   try {
//     // ✅ Skip contactCodes and cardCodes for 3ASenrise role
//     const effectiveContactCodes = role === '3ASenrise' ? [] : contactCodes;
//     const effectiveCardCodes = role === '3ASenrise' ? [] : cardCodes;
//     const effectiveIsAdmin = isAdmin || role === '3ASenrise';

//     const result = await getOrdersFromDatabase({
//       page: 1,
//       search: "",
//       status: "all",
//       fromDate,
//       toDate,
//       sortField: "DocDate",
//       sortDir: "desc",
//       itemsPerPage: 1000, // Get more records for modal
//       isAdmin: effectiveIsAdmin,
//       contactCodes: effectiveContactCodes,
//       cardCodes: effectiveCardCodes,
//       getAll: true, // Get all records for modal
//       excludeCancelled: true,
//     });

//     return result.orders || [];

//   } catch (error) {
//     console.error("Error fetching orders data for modal:", error);
//     return [];
//   }
// }

// pages/api/kpi/kpi-modal.js
import { getUniqueInvoicesList } from "../../../lib/models/invoices";
import { getOrdersFromDatabase } from "../../../lib/models/orders";

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
    role = null,
    salesCategory = "", // ✅ ADD salesCategory parameter
  } = params;

  let fromDate, toDate;
  const today = new Date();

  // Calculate date range based on filter
  switch (dateFilter) {
    case "today":
      fromDate = toDate = today.toISOString().split("T")[0];
      break;
    case "thisWeek": {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      fromDate = startOfWeek.toISOString().split("T")[0];
      toDate = today.toISOString().split("T")[0];
      break;
    }
    case "thisMonth": {
      const todayStr = today.toISOString().split("T")[0];
      fromDate = todayStr.substring(0, 8) + '01';
      toDate = todayStr;
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

  try {
    // ✅ Determine if we need to filter by category
    const is3ASenrise = role === '3ASenrise';
    const filterByCategory = is3ASenrise || (salesCategory && salesCategory !== 'all');
    const category = is3ASenrise ? '3A Chemicals' : salesCategory;

    const effectiveContactCodes = role === '3ASenrise' ? [] : contactCodes;
    const effectiveCardCodes = role === '3ASenrise' ? [] : cardCodes;
    const effectiveIsAdmin = isAdmin || role === '3ASenrise';

    const result = await getUniqueInvoicesList({
      page: 1,
      search: "",
      status: "all",
      fromDate,
      toDate,
      sortField: "DocDate",
      sortDir: "desc",
      itemsPerPage: 1000,
      isAdmin: effectiveIsAdmin,
      cardCodes: effectiveCardCodes,
      contactCodes: effectiveContactCodes,
      // ✅ PASS CATEGORY FILTERING PARAMETERS
      filterByCategory,
      category,
      getAll: true,
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
    }));

    return formattedInvoices;
  } catch (error) {
    console.error("Error fetching sales data for modal:", error);
    return [];
  }
}

export async function getOrdersDataForModal(params) {
  const {
    dateFilter,
    startDate,
    endDate,
    isAdmin = false,
    contactCodes = [],
    cardCodes = [],
    role = null,
    salesCategory = "", // ✅ ADD salesCategory parameter
  } = params;

  let fromDate, toDate;
  const today = new Date();

  const formatDate = (date) => date.toLocaleDateString("en-CA");

  // Calculate date range based on filter
  switch (dateFilter) {
    case "today":
      fromDate = toDate = formatDate(today);
      break;
    case "thisWeek": {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      fromDate = formatDate(startOfWeek);
      toDate = formatDate(today);
      break;
    }
    case "thisMonth": {
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

  console.log('Modal - Fetching orders for date range:', fromDate, 'to', toDate);

  try {
    // ✅ Determine if we need to filter by category
    const is3ASenrise = role === '3ASenrise';
    const filterByCategory = is3ASenrise || (salesCategory && salesCategory !== 'all');
    const category = is3ASenrise ? '3A Chemicals' : salesCategory;

    const effectiveContactCodes = role === '3ASenrise' ? [] : contactCodes;
    const effectiveCardCodes = role === '3ASenrise' ? [] : cardCodes;
    const effectiveIsAdmin = isAdmin || role === '3ASenrise';

    const result = await getOrdersFromDatabase({
      page: 1,
      search: "",
      status: "all",
      fromDate,
      toDate,
      sortField: "DocDate",
      sortDir: "desc",
      itemsPerPage: 1000,
      isAdmin: effectiveIsAdmin,
      contactCodes: effectiveContactCodes,
      cardCodes: effectiveCardCodes,
      // ✅ PASS CATEGORY FILTERING PARAMETERS
      filterByCategory,
      category,
      getAll: true,
      excludeCancelled: true,
    });

    return result.orders || [];

  } catch (error) {
    console.error("Error fetching orders data for modal:", error);
    return [];
  }
}