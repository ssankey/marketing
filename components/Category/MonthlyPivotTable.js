// // components/Category/MonthlyLineItemsTable.js
// import React, { useMemo, useState } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import downloadExcel from "utils/exporttoexcel";

// export default function MonthlyLineItemsTable({ data = [], columns: initialColumns }) {
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [page, setPage] = useState(1);
//   const pageSize = 12;

//   // Ensure data is always an array
//   const safeData = Array.isArray(data) ? data : [];

//   const filteredData = useMemo(() => {
//     if (!globalFilter) return safeData;
//     return safeData.filter((row) =>
//       Object.values(row).some((value) =>
//         String(value).toLowerCase().includes(globalFilter.toLowerCase())
//       )
//     );
//   }, [safeData, globalFilter]);

//   const pageCount = Math.ceil((filteredData.length || 0) / pageSize);

//   const pagedData = useMemo(() => {
//     const start = (page - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, page]);

//   const columns = useMemo(() => initialColumns, [initialColumns]);

//   const table = useReactTable({
//     data: pagedData,
//     columns,
//     state: { globalFilter },
//     onGlobalFilterChange: setGlobalFilter,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//   });

//   const handleExportExcel = () => {
//     const exportData = filteredData.map((row) => {
//       const formatted = {};
//       columns.forEach((col) => {
//         const raw = row[col.accessorKey];
//         formatted[col.header] =
//           raw === null || raw === undefined || raw === "" ? "-" : raw;
//       });
//       return formatted;
//     });
//     downloadExcel(exportData, "Monthly_Line_Items_Report");
//   };

//   return (
//     <div className="w-full mb-6">
//       <div className="mb-3 d-flex justify-content-between align-items-center">
//         <input
//           type="text"
//           value={globalFilter}
//           onChange={(e) => setGlobalFilter(e.target.value)}
//           placeholder="Search..."
//           className="form-control me-2"
//           style={{ maxWidth: "300px" }}
//         />
//         <button onClick={handleExportExcel} className="btn btn-success">
//           Export Excel
//         </button>
//       </div>

//       <div className="border rounded overflow-auto">
//         <table className="w-full border-collapse">
//           <thead className="bg-gray-100 sticky top-0">
//             {table.getHeaderGroups().map((hg) => (
//               <tr key={hg.id}>
//                 {hg.headers.map((header) => (
//                   <th key={header.id} className="border px-2 py-1 text-center">
//                     {flexRender(
//                       header.column.columnDef.header,
//                       header.getContext()
//                     )}
//                   </th>
//                 ))}
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
//                       className="border px-2 py-1 text-sm text-center"
//                     >
//                       {(() => {
//                         const value = cell.getValue();
//                         return value === null || value === undefined || value === ""
//                           ? "-"
//                           : flexRender(cell.column.columnDef.cell, cell.getContext());
//                       })()}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={columns.length} className="p-4 text-center">
//                   No data found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-3 d-flex justify-content-center align-items-center gap-3">
//         <button
//           onClick={() => setPage(1)}
//           disabled={page === 1}
//           className="btn btn-outline-secondary"
//         >
//           First
//         </button>
//         <button
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//           disabled={page === 1}
//           className="btn btn-outline-secondary"
//         >
//           Prev
//         </button>
//         <span>
//           Page {page} of {pageCount} ({filteredData.length} total)
//         </span>
//         <button
//           onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
//           disabled={page === pageCount}
//           className="btn btn-outline-secondary"
//         >
//           Next
//         </button>
//         <button
//           onClick={() => setPage(pageCount)}
//           disabled={page === pageCount}
//           className="btn btn-outline-secondary"
//         >
//           Last
//         </button>
//       </div>
//     </div>
//   );
// }

// // components/Category/MonthlyLineItemsTable.js
// import React, { useMemo, useState, useEffect } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import downloadExcel from "utils/exporttoexcel";

// export default function MonthlyLineItemsTable({ data = [], columns: initialColumns }) {
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [page, setPage] = useState(1);
//   const pageSize = 12;

//   const filteredData = useMemo(() => {
//     if (!globalFilter) return data;
//     return data.filter((row) =>
//       Object.values(row).some((value) =>
//         String(value).toLowerCase().includes(globalFilter.toLowerCase())
//       )
//     );
//   }, [data, globalFilter]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
//   const pagedData = useMemo(() => {
//     const start = (page - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, page]);

//   const columns = useMemo(() => initialColumns, [initialColumns]);

//   const table = useReactTable({
//     data: pagedData,
//     columns,
//     state: { globalFilter },
//     onGlobalFilterChange: setGlobalFilter,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//   });

//   const handleExportExcel = () => {
//     // const exportData = filteredData.map((row) => {
//     //   const formatted = {};
//     //   columns.forEach((col) => {
//     //     formatted[col.header] = row[col.accessorKey];
//     //   });
//     //   return formatted;
//     // });
//     const exportData = filteredData.map((row) => {
//       const formatted = {};
//       columns.forEach((col) => {
//         const raw = row[col.accessorKey];
//         // if it’s null/undefined/empty → show a dash
//         if (raw === null || raw === undefined || raw === "") {
//           formatted[col.header] = "-";
//         } else {
//           formatted[col.header] = raw;
//         }
//       });
//       return formatted;
//     });
//     downloadExcel(exportData, "Monthly_Line_Items_Report");
//   };

//   return (
//     <div className="w-full mb-6">
//       <div className="mb-3 d-flex justify-content-between align-items-center">
//         <input
//           type="text"
//           value={globalFilter}
//           onChange={(e) => setGlobalFilter(e.target.value)}
//           placeholder="Search..."
//           className="form-control me-2"
//           style={{ maxWidth: "300px" }}
//         />
//         <button onClick={handleExportExcel} className="btn btn-success">
//           Export Excel
//         </button>
//       </div>

//       <div className="border rounded overflow-auto">
//         <table className="w-full border-collapse">
//           <thead className="bg-gray-100 sticky top-0">
//             {table.getHeaderGroups().map((hg) => (
//               <tr key={hg.id}>
//                 {hg.headers.map((header) => (
//                   <th key={header.id} className="border px-2 py-1 text-center">
//                     {flexRender(
//                       header.column.columnDef.header,
//                       header.getContext()
//                     )}
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>
//           <tbody>
//             {table.getRowModel().rows.length > 0 ? (
//               table.getRowModel().rows.map((row) => (
//                 <tr key={row.id} className="hover:bg-gray-50">
//                   {row.getVisibleCells().map((cell) => (
//                     // <td key={cell.id} className="border px-2 py-1 text-sm">
//                     //   {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                     // </td>
//                     <td
//                       key={cell.id}
//                       className="border px-2 py-1 text-sm text-center"
//                     >
//                       {(() => {
//                         const value = cell.getValue();
//                         // show “–” if no real value; otherwise render the normal cell
//                         if (
//                           value === null ||
//                           value === undefined ||
//                           value === ""
//                         ) {
//                           return "-";
//                         }
//                         return flexRender(
//                           cell.column.columnDef.cell,
//                           cell.getContext()
//                         );
//                       })()}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={columns.length} className="p-4 text-center">
//                   No data found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-3 d-flex justify-content-center align-items-center gap-3">
//         <button
//           onClick={() => setPage(1)}
//           disabled={page === 1}
//           className="btn btn-outline-secondary"
//         >
//           First
//         </button>
//         <button
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//           disabled={page === 1}
//           className="btn btn-outline-secondary"
//         >
//           Prev
//         </button>
//         <span>
//           Page {page} of {pageCount} ({filteredData.length} total)
//         </span>
//         <button
//           onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
//           disabled={page === pageCount}
//           className="btn btn-outline-secondary"
//         >
//           Next
//         </button>
//         <button
//           onClick={() => setPage(pageCount)}
//           disabled={page === pageCount}
//           className="btn btn-outline-secondary"
//         >
//           Last
//         </button>
//       </div>
//     </div>
//   );
// }

// components/Category/MonthlyLineItemsTable.js
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import downloadExcel from "utils/exporttoexcel";

export default function MonthlyLineItemsTable({ data = [], columns: initialColumns }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  const filteredData = useMemo(() => {
    if (!globalFilter) return safeData;
    return safeData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(globalFilter.toLowerCase())
      )
    );
  }, [safeData, globalFilter]);

  const pageCount = Math.ceil((filteredData.length || 0) / pageSize);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const columns = useMemo(() => initialColumns, [initialColumns]);

  const table = useReactTable({
    data: pagedData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExportExcel = () => {
    const exportData = filteredData.map((row) => {
      const formatted = {};
      columns.forEach((col) => {
        const raw = row[col.accessorKey];
        formatted[col.header] =
          raw === null || raw === undefined || raw === "" ? "-" : raw;
      });
      return formatted;
    });
    downloadExcel(exportData, "Monthly_Line_Items_Report");
  };

  return (
    <div className="w-full mb-6">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="form-control me-2"
          style={{ maxWidth: "300px" }}
        />
        <button onClick={handleExportExcel} className="btn btn-success">
          Export Excel
        </button>
      </div>

      <div className="border rounded overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="border px-2 py-1 text-center">
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
                      className="border px-2 py-1 text-sm text-center"
                    >
                      {(() => {
                        const value = cell.getValue();
                        return value === null || value === undefined || value === ""
                          ? "-"
                          : flexRender(cell.column.columnDef.cell, cell.getContext());
                      })()}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 d-flex justify-content-center align-items-center gap-3">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="btn btn-outline-secondary"
        >
          First
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn btn-outline-secondary"
        >
          Prev
        </button>
        <span>
          Page {page} of {pageCount} ({filteredData.length} total)
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page === pageCount}
          className="btn btn-outline-secondary"
        >
          Next
        </button>
        <button
          onClick={() => setPage(pageCount)}
          disabled={page === pageCount}
          className="btn btn-outline-secondary"
        >
          Last
        </button>
      </div>
    </div>
  );
}