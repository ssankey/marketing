// import React, { useEffect, useState } from "react";
// import { Container, Spinner } from "react-bootstrap";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";
// import TablePagination from "components/TablePagination";
// import TableFilters from "components/TableFilters";
// import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

// const columns = [
//   { field: "Invoice No.", label: "Invoice No." },
//   {
//     field: "AR Invoice Date",
//     label: "Invoice Date",
//     render: (value) => formatDate(value),
//   },
//   { field: "SO#", label: "SO#" },
//   { field: "SO Date", label: "SO Date", render: (value) => formatDate(value) },
//   { field: "Customer Name", label: "Customer Name" },
//   { field: "Contact Person", label: "Contact Person" },
//   { field: "CustomerPONo", label: "SO Customer Ref. No" },
//   {
//     field: "Invoice Total",
//     label: "Invoice Total",
//     render: (value) => formatNumberWithIndianCommas(value),
//   },
//   {
//     field: "Balance Due",
//     label: "Balance Due",
//     render: (value) => formatNumberWithIndianCommas(value),

//     className: (value) => (value > 0 ? "text-danger fw-bold" : "text-success"),
//   },
//   { field: "Country", label: "Country" },
//   { field: "State", label: "State" },
//   { field: "Overdue Days", label: "Overdue Days" },
//   { field: "Payment Terms", label: "Payment Terms" },
//   { field: "Tracking no", label: "Tracking no" },
//   {
//     field: "Dispatch Date",
//     label: "Dispatch Date",
//     render: (value) => formatDate(value),
//   },
//   { field: "SalesEmployee", label: "Sales Person" },
// ];

// const CustomerOutstandingTable = ({
//   customerOutstandings = [],
//   totalItems = 0,
//   isLoading = false,
//   customerCode,
//   onFilterChange,
//   onExcelDownload,
//   currentPage,
//   onPageChange,
//   itemsPerPage = 5,
//   filterType,
//   onFilterTypeChange,
//   selectedRows = [],
//   setSelectedRows,
//   isAllSelected,
//   onSelectAll,
// }) => {
//   const totalPages = Math.ceil(totalItems / itemsPerPage);
//   const filteredData = customerOutstandings;
//   const [totalOutstandingAmount, setTotalOutstandingAmount] = useState(0);

//   // Fetch the total outstanding amount from all pages
//   useEffect(() => {
//     const fetchTotalOutstanding = async () => {
//       try {
//         // Get all records (not paginated) to calculate the total
//         const response = await fetch(
//           `/api/customers/${customerCode}/outstanding?getAll=true&filterType=${filterType}`
//         );

//         if (response.ok) {
//           const data = await response.json();

//           // Calculate the total outstanding amount from all records
//           const total = data.customerOutstandings.reduce((sum, item) => {
//             const balanceDue = item["Balance Due"] || 0;
//             return sum + balanceDue;
//           }, 0);

//           // setTotalOutstandingAmount(total);
//           setTotalOutstandingAmount(
//             formatNumberWithIndianCommas(Math.round(total * 100) / 100)
//           );
//         }
//       } catch (error) {
//         console.error("Error fetching total outstanding amount:", error);
//       }
//     };

//     if (customerCode) {
//       fetchTotalOutstanding();
//     }
//   }, [customerCode, filterType]);

//   const toggleRow = (invoiceNo) => {
//     setSelectedRows((prev) =>
//       prev.includes(invoiceNo)
//         ? prev.filter((id) => id !== invoiceNo)
//         : [...prev, invoiceNo]
//     );
//   };

//   return (
//     <Container fluid id="customer-outstanding-filters">
//       <TableFilters
//         onExcelDownload={onExcelDownload}
//         totalItems={totalItems}
//         totalItemsLabel="Total"
//         dateFilter={{ enabled: false }}
//         searchConfig={{ enabled: false }}
//         onReset={undefined}
//       />

//       <style jsx global>{`
//         #customer-outstanding-filters .btn-outline-secondary {
//           display: none !important;
//         }
//       `}</style>

//       <div className="px-3 py-2">
//         <div className="card border-0 bg-light shadow-sm">
//           <div className="card-body p-2 text-center">
//             <h6 className="text-muted mb-1">Total Outstanding Amount</h6>
//             <h4 className="mb-0 text-primary fw-bold">
//               ₹{totalOutstandingAmount}
//             </h4>
//           </div>
//         </div>
//       </div>

//       {isLoading ? (
//         <div className="text-center py-4">
//           <Spinner animation="border" />
//         </div>
//       ) : (
//         <div className="table-responsive">
//           <table className="table table-striped table-bordered">
//             <thead>
//               <tr>
//                 <th>
//                   <input
//                     type="checkbox"
//                     checked={isAllSelected}
//                     onChange={onSelectAll}
//                   />
//                 </th>
//                 {columns.map((col) => (
//                   <th key={col.field}>{col.label}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {filteredData?.length > 0 ? (
//                 filteredData.map((item, index) => {
//                   // Calculate the displayed value for each row
//                   const balanceDue = item["Balance Due"] || 0;
//                   const displayedBalanceDue =
//                     formatNumberWithIndianCommas(balanceDue);
//                   return (
//                     <tr key={index}>
//                       <td>
//                         <input
//                           type="checkbox"
//                           checked={selectedRows.includes(item["Invoice No."])}
//                           onChange={() => toggleRow(item["Invoice No."])}
//                         />
//                       </td>
//                       {columns.map((col) => {
//                         const rawValue = item[col.field];
//                         let cellValue = rawValue;

//                         if (col.field === "Balance Due") {
//                           cellValue = displayedBalanceDue;
//                         } else if (col.render) {
//                           cellValue = col.render(rawValue);
//                         }

//                         const cellClass = col.className
//                           ? col.className(rawValue)
//                           : "";

//                         return (
//                           <td key={col.field} className={cellClass}>
//                             {cellValue || ""}
//                           </td>
//                         );
//                       })}
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan={columns.length + 1} className="text-center">
//                     No{" "}
//                     {filterType === "Payment Pending"
//                       ? "pending payments"
//                       : "completed payments"}{" "}
//                     found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       <TablePagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={onPageChange}
//       />
//     </Container>
//   );
// };

// export default CustomerOutstandingTable; 

// components/modal/MonthlyOrdersModal.js
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Form, InputGroup } from "react-bootstrap";
import { FiSearch, FiX } from "react-icons/fi";

const MonthlyOrdersModal = ({ detailedLineItems, onClose, title, year, month, status }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Filter data based on month, year, and status
  const filteredData = useMemo(() => {
    if (!detailedLineItems || !Array.isArray(detailedLineItems)) return [];
    
    return detailedLineItems.filter(item => {
      const matchesMonth = item.Month === month;
      const matchesYear = item.Year === year;
      const matchesStatus = status === 'open' ? item.Status === 'Open' : item.Status === 'Partial';
      
      return matchesMonth && matchesYear && matchesStatus;
    });
  }, [detailedLineItems, month, year, status]);

  const columns = useMemo(
    () => [
      {
        accessorFn: row => row["SO No"],
        header: "SO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["SO Date"],
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorFn: row => row["Customer Ref. No"],
        header: "Customer Ref. No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Contact Person"],
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Item No."],
        header: "Item No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Description"],
        header: "Description",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Cas No"],
        header: "Cas No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Vendor Cat. No."],
        header: "Vendor Cat. No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["PKZ"],
        header: "PKZ",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Qty"],
        header: "Qty",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorFn: row => row["Invoice No"] || row["Inv#"],
        header: "Invoice No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Invoice Date"],
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["Tracking No"],
        header: "Tracking No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Dispatch Date"],
        header: "Dispatch Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["Delivery Date"],
        header: "Delivery Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["Unit Price"],
        header: "Unit Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: row => row["Total Value"],
        header: "Total Value",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: row => row["Batch No"],
        header: "Batch No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Mkt Feedback"],
        header: "Mkt Feedback",
        cell: ({ getValue }) => getValue() || "-",
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      
      // Check each column for a match
      return columns.some(column => {
        const value = row.getValue(column.accessorFn);
        if (value === null || value === undefined) return false;
        
        return String(value).toLowerCase().includes(search);
      });
    },
  });

  const handleExportExcel = () => {
    const exportData = table.getFilteredRowModel().rows.map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = row.getValue(column.accessorFn);

        if (header.includes("Date")) {
          formattedRow[header] = value ? formatDate(value) : "N/A";
        } else if (header === "Unit Price" || header === "Total Value") {
          formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
        } else {
          formattedRow[header] = value || "-";
        }
      });
      return formattedRow;
    });

    const statusText = status === 'open' ? 'Open' : 'Partial';
    const filename = `${statusText}_Orders_${month}_${year}_filtered`;
    downloadExcel(exportData, filename);
  };

  const statusText = status === 'open' ? 'Open' : 'Partial';
  const modalTitle = `${statusText} Orders Line Items - ${month} ${year}`;

  return (
    <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
      <Modal.Header className="py-2 px-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Modal.Title className="fs-5 m-0">
            {modalTitle} ({table.getFilteredRowModel().rows.length} items)
          </Modal.Title>

          <div className="d-flex align-items-center gap-2">
            <Button variant="success" size="sm" onClick={handleExportExcel}>
              Export to Excel
            </Button>
            <Button variant="light" size="sm" onClick={onClose} className="ms-2">
              ✕
            </Button>
          </div>
        </div>
      </Modal.Header>
      
      {/* Search Bar */}
      <div className="px-3 py-2 border-bottom">
        <InputGroup>
          <InputGroup.Text>
            <FiSearch />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search across all fields..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
          {globalFilter && (
            <Button
              variant="outline-secondary"
              onClick={() => setGlobalFilter("")}
            >
              <FiX />
            </Button>
          )}
        </InputGroup>
      </div>
      
      <Modal.Body style={{ margin: "0 0" }}>
        <div className="border rounded overflow-auto" style={{ height: "75vh" }}>
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="border px-3 py-2 text-left font-medium text-sm"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
                      <td key={cell.id} className="border px-3 py-2 truncate text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-4 text-center">
                    {globalFilter ? (
                      <>No matching items found for "{globalFilter}"</>
                    ) : (
                      <>No data available for {statusText.toLowerCase()} orders in {month} {year}</>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default MonthlyOrdersModal;