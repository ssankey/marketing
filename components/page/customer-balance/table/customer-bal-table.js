
// import React, { useMemo, useState, useEffect } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   flexRender,
//   getSortedRowModel,
// } from "@tanstack/react-table";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate, parseDateForFilter } from "utils/formatDate";

// export default function CustomerBalTable({
//   data = [],
//   page,
//   onPageChange,
//   pageSize = 10,
// }) {
//   const safeData = Array.isArray(data) ? data : [];
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [sorting, setSorting] = useState([]);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   function parseDateForFilter(dateString) {
//     if (!dateString) return null;
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? null : date;
//   }
  
//   // Apply filtering to all data
//   const filteredData = useMemo(() => {
//     let result = safeData;

//     // Apply global text search
//     if (globalFilter) {
//       result = result.filter((row) => {
//         return Object.values(row).some((value) =>
//           String(value).toLowerCase().includes(globalFilter.toLowerCase())
//         );
//       });
//     }

//     // Apply date range filter
//     if (fromDate || toDate) {
//       result = result.filter((row) => {
//         const invoiceDate = parseDateForFilter(row["AR Invoice Date"]);
//         if (!invoiceDate) return false;

//         if (fromDate && invoiceDate < parseDateForFilter(fromDate))
//           return false;
//         if (toDate && invoiceDate > parseDateForFilter(toDate)) return false;
//         return true;
//       });
//     }

//     return result;
//   }, [safeData, globalFilter, fromDate, toDate]);

//   // Apply sorting
//   const sortedData = useMemo(() => {
//     if (!sorting.length) return filteredData;

//     return [...filteredData].sort((a, b) => {
//       for (const sort of sorting) {
//         const { id, desc } = sort;
//         const aValue = a[id];
//         const bValue = b[id];

//         // Special sorting for dates
//         if (id.includes("Date")) {
//           const dateA = parseDateForFilter(aValue);
//           const dateB = parseDateForFilter(bValue);
//           if (dateA && dateB) {
//             if (dateA < dateB) return desc ? 1 : -1;
//             if (dateA > dateB) return desc ? -1 : 1;
//           }
//           continue;
//         }

//         // Numeric sorting for BalanceDue and Overdue Days
//         if (id === "BalanceDue" || id === "Overdue Days") {
//           const numA = Number(aValue) || 0;
//           const numB = Number(bValue) || 0;
//           if (numA !== numB) return desc ? numB - numA : numA - numB;
//           continue;
//         }

//         // Default string sorting
//         if (aValue < bValue) return desc ? 1 : -1;
//         if (aValue > bValue) return desc ? -1 : 1;
//       }
//       return 0;
//     });
//   }, [filteredData, sorting]);

//   // Calculate page count based on filtered data
//   const pageCount = Math.ceil(sortedData.length / pageSize);

//   // Get data for current page
//   const pageData = useMemo(() => {
//     const start = (page - 1) * pageSize;
//     return sortedData.slice(start, start + pageSize);
//   }, [sortedData, page, pageSize]);

//   const columns = useMemo(
//     () => [
//       {
//         accessorKey: "Invoice No",
//         header: "Invoice No.",
//         size: 100,
//       },
//       {
//         accessorKey: "AR Invoice Date",
//         header: "Invoice Date",
//         cell: ({ getValue }) => formatDate(getValue()),
//         size: 100,
//         enableSorting: true,
//       },
//       {
//         accessorKey: "SO#",
//         header: "SO#",
//         size: 80,
//       },
//       {
//         accessorKey: "SO Date",
//         header: "SO Date",
//         cell: ({ getValue }) => formatDate(getValue()),
//         size: 100,
//         enableSorting: true,
//       },
//       {
//         accessorKey: "CardName",
//         header: "Customer Name",
//         size: 150,
//       },
//       {
//         accessorKey: "Contact Person",
//         header: "Contact Person",
//         size: 130,
//       },
//       {
//         accessorKey: "NumAtCard",
//         header: "Cust Ref no",
//         size: 100,
//       },
//       {
//         accessorKey: "Country",
//         header: "Country",
//         size: 100,
//       },
//       {
//         accessorKey: "State",
//         header: "State",
//         size: 100,
//       },
//       {
//         accessorKey: "BalanceDue",
//         header: "Balance Due",
//         cell: ({ getValue }) => formatCurrency(getValue()),
//         size: 120,
//         enableSorting: true,
//       },
//       {
//         accessorKey: "Overdue Days",
//         header: "Overdue Days",
//         size: 100,
//         enableSorting: true,
//       },
//       {
//         accessorKey: "U_Airlinename",
//         header: "Airline",
//         size: 120,
//       },
//       {
//         accessorKey: "trackNo",
//         header: "TrackingNo",
//         size: 120,
//       },
//       {
//         accessorKey: "PymntGroup",
//         header: "Payment Group",
//         size: 140,
//       },
//       {
//         accessorKey: "SlpName",
//         header: "Sales Person",
//         size: 140,
//       },
//     ],
//     []
//   );

//   const table = useReactTable({
//     data: pageData,
//     columns,
//     state: {
//       globalFilter,
//       sorting,
//     },
//     onGlobalFilterChange: setGlobalFilter,
//     onSortingChange: setSorting,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     columnResizeMode: "onChange",
//   });

//   // Only reset page when filters change, not sorting
//   useEffect(() => {
//     if (globalFilter || fromDate || toDate) {
//       onPageChange(1);
//     }
//   }, [globalFilter, fromDate, toDate, onPageChange]);

//   return (
//     <div className="w-full overflow-auto">
//       {/* Search and Filter Bar - Fixed height */}
//       {/* <div className="mb-4 flex flex-wrap items-center gap-4 h-20">
//         <div className="flex-1 min-w-[250px]">
//           <input
//             type="text"
//             value={globalFilter ?? ""}
//             onChange={(e) => setGlobalFilter(e.target.value)}
//             placeholder="Search all columns..."
//             className="p-2 border rounded w-full"
//           />
//         </div>

//         <div className="flex items-center gap-2">
//           <label className="text-sm whitespace-nowrap">Invoice Date:</label>
//           <input
//             type="date"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//             className="p-2 border rounded"
//           />
//           <span>to</span>
//           <input
//             type="date"
//             value={toDate}
//             onChange={(e) => setToDate(e.target.value)}
//             className="p-2 border rounded"
//           />
//         </div>
//       </div> */}
//       <div className="mb-4 flex items-center justify-between gap-4 h-20">
//         {/* 1/3 width, grows/shrinks equally */}
//         <div className="flex-1 min-w-[0]">
//           <input
//             type="text"
//             value={globalFilter ?? ""}
//             onChange={(e) => setGlobalFilter(e.target.value)}
//             placeholder="Search all columns..."
//             className="p-2 border rounded w-full"
//           />
//         </div>

//         {/* 1/3 width */}
//         <div className="flex-1 min-w-[0] flex items-center gap-2">
//           <label className="text-sm whitespace-nowrap">Invoice Date:</label>
//           <input
//             type="date"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//             className="p-2 border rounded w-full"
//           />
//         </div>

//         {/* 1/3 width */}
//         <div className="flex-1 min-w-[0] flex items-center gap-2">
//           <span className="text-sm whitespace-nowrap">to</span>
//           <input
//             type="date"
//             value={toDate}
//             onChange={(e) => setToDate(e.target.value)}
//             className="p-2 border rounded w-full"
//           />
//         </div>
//       </div>

//       {/* Table Container - Fixed height with scroll */}
//       <div
//         className="border rounded"
//         style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}
//       >
//         <table className="w-full border-collapse">
//           <thead className="sticky top-0 bg-white z-10">
//             {table.getHeaderGroups().map((hg) => (
//               <tr key={hg.id}>
//                 {hg.headers.map((header) => {
//                   const width = header.column.getSize();
//                   return (
//                     <th
//                       key={header.id}
//                       style={{ width }}
//                       className="border px-2 py-2 bg-gray-100 font-semibold"
//                     >
//                       {header.column.getCanSort() ? (
//                         <button
//                           onClick={header.column.getToggleSortingHandler()}
//                           className="flex items-center justify-between w-full font-semibold text-left"
//                         >
//                           <span className="truncate">
//                             {flexRender(
//                               header.column.columnDef.header,
//                               header.getContext()
//                             )}
//                           </span>
//                           <span className="ml-2">
//                             {{
//                               asc: "↑",
//                               desc: "↓",
//                             }[header.column.getIsSorted()] ?? "↕"}
//                           </span>
//                         </button>
//                       ) : (
//                         <div className="truncate">
//                           {flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                         </div>
//                       )}
//                     </th>
//                   );
//                 })}
//               </tr>
//             ))}
//           </thead>
//           <tbody>
//             {table.getRowModel().rows.length > 0 ? (
//               table.getRowModel().rows.map((row) => (
//                 <tr key={row.id} className="hover:bg-gray-50">
//                   {row.getVisibleCells().map((cell) => (
//                     <td
//                       key={cell.id}
//                       className="border px-2 py-2 truncate text-sm"
//                     >
//                       {flexRender(
//                         cell.column.columnDef.cell,
//                         cell.getContext()
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   colSpan={columns.length}
//                   className="border px-2 py-4 text-center text-gray-500"
//                 >
//                   No data available
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination - Fixed position */}
//       <div className="mt-4 flex items-center justify-between sticky bottom-0 bg-white py-2">
//         <button
//           onClick={() => onPageChange(Math.max(1, page - 1))}
//           disabled={page <= 1}
//           className="px-4 py-2 border rounded disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
//         >
//           Prev
//         </button>
//         <span className="text-sm">
//           Page {page} of {pageCount} • {sortedData.length} records
//         </span>
//         <button
//           onClick={() => onPageChange(Math.min(pageCount, page + 1))}
//           disabled={page >= pageCount}
//           className="px-4 py-2 border rounded disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate, parseDateForFilter } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

export default function CustomerBalTable({
  data = [],
  page,
  onPageChange,
  pageSize = 10,
}) {
  const safeData = Array.isArray(data) ? data : [];
  const [globalFilter, setGlobalFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredData = useMemo(() => {
    return safeData.filter((row) => {
      // Global text filter
      if (
        globalFilter &&
        !Object.values(row).some((v) =>
          String(v).toLowerCase().includes(globalFilter.toLowerCase())
        )
      ) {
        return false;
      }
      // Date range filter
      const invDate = parseDateForFilter(row["AR Invoice Date"]);
      if (fromDate && invDate < parseDateForFilter(fromDate)) return false;
      if (toDate && invDate > parseDateForFilter(toDate)) return false;
      return true;
    });
  }, [safeData, globalFilter, fromDate, toDate]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns = useMemo(
    () => [
      { accessorKey: "Invoice No", header: "Invoice No." },
      {
        accessorKey: "AR Invoice Date",
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      { accessorKey: "SO#", header: "SO#" },
      {
        accessorKey: "SO Date",
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      { accessorKey: "CardName", header: "Customer Name" },
      { accessorKey: "Contact Person", header: "Contact Person" },
      { accessorKey: "NumAtCard", header: "Cust Ref no" },
      { accessorKey: "Country", header: "Country" },
      { accessorKey: "State", header: "State" },
      {
        accessorKey: "BalanceDue",
        header: "Balance Due",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
      { accessorKey: "Overdue Days", header: "Overdue Days" },
      { accessorKey: "U_Airlinename", header: "Airline" },
      { accessorKey: "trackNo", header: "TrackingNo" },
      { accessorKey: "PymntGroup", header: "Payment Group" },
      { accessorKey: "SlpName", header: "Sales Person" },
    ],
    []
  );

  const table = useReactTable({
    data: pageData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  function parseDateForFilter(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

  // Reset to first page when filters change
  useEffect(() => {
    if (globalFilter || fromDate || toDate) {
      onPageChange(1);
    }
  }, [globalFilter, fromDate, toDate, onPageChange]);

  const handleExportExcel = () => {
    downloadExcel(pageData, "Customer_Balance_Page");
  };

  return (
    <div className="w-full">
      {/* Filters + Export */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="p-2 border rounded flex-1 min-w-[200px]"
        />
        <label className="flex items-center gap-2">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2 border rounded"
          />
        </label>
        <label className="flex items-center gap-2">
          To
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2 border rounded"
          />
        </label>
        <button
          onClick={handleExportExcel}
          className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="border rounded overflow-auto max-h-[60vh]">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border px-2 py-1 text-left font-medium"
                  >
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="border px-2 py-1 truncate text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm">
          Page {page} of {pageCount} ({filteredData.length} total)
        </span>
        <button
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
