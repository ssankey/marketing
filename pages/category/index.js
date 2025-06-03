
// import React, { useMemo, useState } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import downloadExcel from "utils/exporttoexcel";

// export default function MonthlyLineItemsTable({
//   data = [],
//   columns: initialColumns = [],
// }) {
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [page, setPage] = useState(1);
//   const pageSize = 12;

//   // Ensure data and columns are always arrays
//   const safeData = Array.isArray(data) ? data : [];
//   const safeColumns = Array.isArray(initialColumns) ? initialColumns : [];

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

//   const columns = useMemo(() => safeColumns, [safeColumns]);

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
//     downloadExcel(exportData, "Monthly_Sales_Report");
//   };

//   // Early return if no columns are provided
//   if (safeColumns.length === 0) {
//     return <div>No columns defined for the table.</div>;
//   }

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
//             {table?.getHeaderGroups()?.map((hg) => (
//               <tr key={hg.id}>
//                 {hg.headers.map((header, index) => (
//                   <th
//                     key={header.id}
//                     className="border px-2 py-1 text-center"
//                     style={{
//                       whiteSpace: index === 0 ? "nowrap" : "normal",
//                       minWidth: index === 0 ? "200px" : "auto",
//                     }}
//                   >
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
//                   {row.getVisibleCells().map((cell, index) => (
//                     <td
//                       key={cell.id}
//                       className="border px-2 py-1 text-sm text-center"
//                       style={{
//                         whiteSpace: index === 0 ? "nowrap" : "normal",
//                         overflow: index === 0 ? "hidden" : "visible",
//                         textOverflow: index === 0 ? "ellipsis" : "clip",
//                         maxWidth: index === 0 ? "200px" : "auto",
//                       }}
//                       title={index === 0 ? String(cell.getValue()) : ""}
//                     >
//                       {(() => {
//                         const value = cell.getValue();
//                         if (
//                           value === null ||
//                           value === undefined ||
//                           value === ""
//                         ) {
//                           return "-";
//                         }

//                         // Format numeric values (remove decimals for amounts)
//                         if (typeof value === "number" && index > 0) {
//                           return Math.round(value).toLocaleString();
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

//       {pageCount > 1 && (
//         <div className="mt-3 d-flex justify-content-center align-items-center gap-3">
//           <button
//             onClick={() => setPage(1)}
//             disabled={page === 1}
//             className="btn btn-outline-secondary"
//           >
//             First
//           </button>
//           <button
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//             disabled={page === 1}
//             className="btn btn-outline-secondary"
//           >
//             Prev
//           </button>
//           <span>
//             Page {page} of {pageCount} ({filteredData.length} total)
//           </span>
//           <button
//             onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
//             disabled={page === pageCount}
//             className="btn btn-outline-secondary"
//           >
//             Next
//           </button>
//           <button
//             onClick={() => setPage(pageCount)}
//             disabled={page === pageCount}
//             className="btn btn-outline-secondary"
//           >
//             Last
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// import React, { useEffect, useState } from "react";
// import { Container, Card } from "react-bootstrap";
// import MonthlyPivotTable from "components/Category/MonthlyPivotTable";

// const TABLE_TYPES = ["customer", "salesperson", "state", "category"];

// export default function MonthlyReportPage() {
//   const [data, setData] = useState({
//     customer: [],
//     salesperson: [],
//     state: [],
//     category: [],
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       for (const type of TABLE_TYPES) {
//         const res = await fetch(`/api/category/monthlySales?type=${type}`);
//         const json = await res.json();
//         setData((prev) => ({ ...prev, [type]: json }));
//       }
//     };
//     fetchData();
//   }, []);

//   const buildColumns = (sample) =>
//     sample
//       ? Object.keys(sample).map((key) => ({
//           accessorKey: key,
//           header: key,
//         }))
//       : [];

//   return (
//     <Container className="mt-3">
//       {/* CATEGORY TABLE CARD */}
//       <Card className="mb-4 shadow-sm">
//         <Card.Header className="bg-white">
//           <h4 className="mb-0">Category-wise Monthly Sales</h4>
//         </Card.Header>
//         <Card.Body>
//           <MonthlyPivotTable
//             data={data.category}
//             columns={buildColumns(data.category[0])}
//           />
//         </Card.Body>
//       </Card>
//       {/* CUSTOMER TABLE CARD */}
//       <Card className="mb-4 shadow-sm">
//         <Card.Header className="bg-white">
//           <h4 className="mb-0">Customer-wise Monthly Sales</h4>
//         </Card.Header>
//         <Card.Body>
//           <MonthlyPivotTable
//             data={data.customer}
//             columns={buildColumns(data.customer[0])}
//           />
//         </Card.Body>
//       </Card>

//       {/* SALESPERSON TABLE CARD */}
//       <Card className="mb-4 shadow-sm">
//         <Card.Header className="bg-white">
//           <h4 className="mb-0">Salesperson-wise Monthly Sales</h4>
//         </Card.Header>
//         <Card.Body>
//           <MonthlyPivotTable
//             data={data.salesperson}
//             columns={buildColumns(data.salesperson[0])}
//           />
//         </Card.Body>
//       </Card>

//       {/* STATE TABLE CARD */}
//       <Card className="mb-4 shadow-sm">
//         <Card.Header className="bg-white">
//           <h4 className="mb-0">State-wise Monthly Sales</h4>
//         </Card.Header>
//         <Card.Body>
//           <MonthlyPivotTable
//             data={data.state}
//             columns={buildColumns(data.state[0])}
//           />
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }

import React, { useEffect, useState } from "react";
import { Container, Card, Form } from "react-bootstrap";
import MonthlyPivotTable from "components/Category/MonthlyPivotTable";

const TABLE_TYPES = ["customer", "salesperson", "state", "category"];

export default function MonthlyReportPage() {
  const [data, setData] = useState({
    customer: [],
    salesperson: [],
    state: [],
    category: [],
  });

  const [categories, setCategories] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState({
    customer: "",
    salesperson: "",
    state: "",
  });
  const [loading, setLoading] = useState({
    customer: false,
    salesperson: false,
    state: false,
    category: false,
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        const json = await res.json();
        setCategories(json.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    for (const type of TABLE_TYPES) {
      setLoading((prev) => ({ ...prev, [type]: true }));
      try {
        const res = await fetch(`/api/category/monthlySales?type=${type}`);
        const json = await res.json();
        setData((prev) => ({ ...prev, [type]: json }));
      } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
      } finally {
        setLoading((prev) => ({ ...prev, [type]: false }));
      }
    }
  };

  // Fetch filtered data when category filter changes
  const fetchFilteredData = async (type, category) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const url = category
        ? `/api/category/monthlySales?type=${type}&category=${encodeURIComponent(category)}`
        : `/api/category/monthlySales?type=${type}`;

      const res = await fetch(url);
      const json = await res.json();
      setData((prev) => ({ ...prev, [type]: json }));
    } catch (error) {
      console.error(`Error fetching filtered ${type} data:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Handle category filter change
  const handleCategoryChange = (type, category) => {
    setCategoryFilters((prev) => ({ ...prev, [type]: category }));
    fetchFilteredData(type, category);
  };

  const buildColumns = (sample) =>
    sample
      ? Object.keys(sample).map((key) => ({
          accessorKey: key,
          header: key,
        }))
      : [];

  const renderCategoryDropdown = (type) => (
    <div className="mb-3 d-flex align-items-center gap-3">
      <Form.Label className="mb-0 fw-semibold">Filter by Category:</Form.Label>
      <Form.Select
        value={categoryFilters[type]}
        onChange={(e) => handleCategoryChange(type, e.target.value)}
        style={{ width: "300px" }}
      >
        <option value="">All Categories</option>
        {categories.map((category, index) => (
          <option key={index} value={category}>
            {category}
          </option>
        ))}
      </Form.Select>
    </div>
  );

  return (
    <Container className="mt-3">
      {/* CATEGORY TABLE CARD - No filter needed */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Category-wise Monthly Sales</h4>
        </Card.Header>
        <Card.Body>
          {loading.category ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <MonthlyPivotTable
              data={data.category}
              columns={buildColumns(data.category[0])}
            />
          )}
        </Card.Body>
      </Card>

      {/* CUSTOMER TABLE CARD */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Customer-wise Monthly Sales</h4>
        </Card.Header>
        <Card.Body>
          {renderCategoryDropdown("customer")}
          {loading.customer ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <MonthlyPivotTable
              data={data.customer}
              columns={buildColumns(data.customer[0])}
            />
          )}
        </Card.Body>
      </Card>

      {/* SALESPERSON TABLE CARD */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Salesperson-wise Monthly Sales</h4>
        </Card.Header>
        <Card.Body>
          {renderCategoryDropdown("salesperson")}
          {loading.salesperson ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <MonthlyPivotTable
              data={data.salesperson}
              columns={buildColumns(data.salesperson[0])}
            />
          )}
        </Card.Body>
      </Card>

      {/* STATE TABLE CARD */}
      {/* <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h4 className="mb-0">State-wise Monthly Sales</h4>
        </Card.Header>
        <Card.Body>
          {renderCategoryDropdown("state")}
          {loading.state ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <MonthlyPivotTable
              data={data.state}
              columns={buildColumns(data.state[0])}
            />
          )}
        </Card.Body>
      </Card> */}
    </Container>
  );
}