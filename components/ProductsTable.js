// // components/ProductTable.js

// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import GenericTable from "./GenericTable";
// import TableFilters from "./TableFilters";
// import TablePagination from "./TablePagination";
// import downloadExcel from "utils/exporttoexcel";
// import { Container, Row, Col, Spinner } from "react-bootstrap";
// import { components } from "react-select";
// import  handleReset  from "./TableFilters";

// export default function ProductsTable({ products: initialProducts, totalItems: initialTotalItems, isLoading }) {
//   const ITEMS_PER_PAGE = 20;

//   // State
//   const [currentPage, setCurrentPage] = useState(1);
//   const [sortField, setSortField] = useState("ItemCode");
//   const [sortDirection, setSortDirection] = useState("asc");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [products, setProducts] = useState(initialProducts);
//   const [totalItems, setTotalItems] = useState(initialTotalItems);

//   // Fetch data when page, sort, or search changes
//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const response = await fetch(
//           `/api/products?page=${currentPage}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}`
//         );
//         const data = await response.json();
//         setProducts(data.products);
//         setTotalItems(data.totalItems);
//       } catch (error) {
//         console.error("Failed to fetch products:", error);
//       }
//     };

//     fetchProducts();
//   }, [currentPage, sortField, sortDirection, searchTerm]);

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handleSort = (field) => {
//     if (sortField === field) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortField(field);
//       setSortDirection("asc");
//     }
//   };

//   // Add handleReset function
//   const handleReset = () => {
//     setSearchTerm("");
//     setCurrentPage(1);
//     setSortField("ItemCode");
//     setSortDirection("asc");
//   };

//   const handleSearch = (term) => {
//     setSearchTerm(term);
//     setCurrentPage(1);
//   };

//   const columns = [
//     {
//       label: "CAT No.",
//       field: "ItemCode",
//       render: (value, row) => (
//         <Link href={`/products/${row.ItemCode}`}>{value}</Link>
//       ),
//     },
//     { label: "Item Name", field: "ItemName" },
//     { label: "Item Type", field: "ItemType" },
//     { label: "CAS No", field: "U_CasNo", render: (value) => value || "N/A" },
//     {
//       label: "Created Date",
//       field: "CreateDate",
//       render: (value) => (value ? value.split("T")[0] : "N/A"),
//     },
//     {
//       label: "Updated Date",
//       field: "UpdateDate",
//       render: (value) => (value ? value.split("T")[0] : "N/A"),
//     },
//     {
//       label: "Actions",
//       field: "actions",
//       render: (value, row) => (
//         <Link href={`/products/${row.ItemCode}`}>View Details</Link>
//       ),
//     },
//   ];

//   const handleExcelDownload = async () => {
//     try {
//       const response = await fetch("api/excel/getAllProducts");
//       const allProducts = await response.json();
//       if (allProducts && allProducts.length > 0) {
//         downloadExcel(allProducts, "Products");
//       } else {
//         alert("No data available to export.");
//       }
//     } catch (error) {
//       console.error("Failed to fetch data for Excel export:", error);
//       alert("Failed to export data. Please try again.");
//     }
//   };

//   if (isLoading) {
//     return <div>Loading products...</div>;
//   }

//   const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

//   return (
//     <>
//       <TableFilters
//         searchConfig={{
//           enabled: true,
//           placeholder: "Search products...",
//           fields: ["ItemCode", "ItemName", "ItemType", "U_CasNo"],
//         }}
//         dateFilter={{ enabled: false }}
//         onSearch={handleSearch}
//         onReset={handleReset}
//         searchTerm={searchTerm}
//         totalItems={totalItems}
//         totalItemsLabel="Total Products"
//       />
//       <GenericTable
//         columns={columns}
//         data={products}
//         onSort={handleSort}
//         sortField={sortField}
//         sortDirection={sortDirection}
//         onExcelDownload={handleExcelDownload}
//       />
//       {products.length === 0 && (
//         <div className="text-center py-4">No products found.</div>
//       )}
//       <TablePagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={handlePageChange}
//       />
//       <Row className="mb-2">
//         <Col className="text-center">
//           <h5>
//             Page {currentPage} of {totalPages}
//           </h5>
//         </Col>
//       </Row>
//     </>
//   );
// }

// components/ProductTable.js

import React, { useState, useEffect } from "react";
import Link from "next/link";
import GenericTable from "./GenericTable";
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import downloadExcel from "utils/exporttoexcel";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import  handleReset  from "./TableFilters";

import usePagination from "hooks/usePagination";
import useTableFilters from "hooks/useFilteredData";

export default function ProductsTable({
  products: initialProducts,
  totalItems: initialTotalItems,
  isLoading,
  status,
  onStatusChange,
}) {
  const ITEMS_PER_PAGE = 20;
   
 
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("ItemCode");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState(initialProducts);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  // Fetch data when page, sort, or search changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `/api/products?page=${currentPage}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&status=${status}`
        );
        const data = await response.json();
        setProducts(data.products);
        setTotalItems(data.totalItems);
        // setCurrentPage(1);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, [currentPage, sortField, sortDirection, searchTerm, status]);

  useEffect(() => {
    setCurrentPage(1); // Reset to the first page whenever the status changes
  }, [status]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Add handleReset function
  const handleReset = () => {
    setSearchTerm("");
    setCurrentPage(1);
    setSortField("ItemCode");
    setSortDirection("asc");
    onStatusChange("all"); // Reset status to "All"
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const columns = [
    {
      label: "CAT No.",
      field: "ItemCode",
      render: (value, row) => (
        <Link href={`/products/${row.ItemCode}`}>{value}</Link>
      ),
    },
    { label: "Item Name", field: "ItemName" },
    { label: "Item Type", field: "ItemType" },
    { label: "CAS No", field: "U_CasNo", render: (value) => value || "N/A" },
    {
      label: "Stock Status",
      field: "stockStatus",
      render: (value) => (
        <span
          className={`badge ${
            value === "In Stock" ? "bg-success" : "bg-danger"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      label: "Created Date",
      field: "CreateDate",
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Updated Date",
      field: "UpdateDate",
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Actions",
      field: "actions",
      render: (value, row) => (
        <Link href={`/products/${row.ItemCode}`}>View Details</Link>
      ),
    },
  ];

  const handleExcelDownload = async () => {
    try {
      const response = await fetch(
        `/api/excel/getAllProducts?status=${status}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}`
      );
      const filteredProducts = await response.json();

      if (filteredProducts && filteredProducts.length > 0) {
        downloadExcel(filteredProducts, `Products_${status}`);
      } else {
        alert("No data available to export.");
      }
    } catch (error) {
      console.error("Failed to fetch data for Excel export:", error);
      alert("Failed to export data. Please try again.");
    }
  };


  if (isLoading) {
    return <div>Loading products...</div>;
  }

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search products...",
          fields: ["ItemCode", "ItemName", "ItemType", "U_CasNo"],
        }}
        statusFilter={{
          enabled: true,
          options: [
            // { value: "all", label: "All" },
            { value: "inStock", label: "In Stock" },
            { value: "outOfStock", label: "Out of Stock" },
          ],
          value: status,
         
        }}
        dateFilter={{ enabled: false }}
        // onStatusChange={handleStatusChange}
        onStatusChange={onStatusChange} // This is passed from ProductsPage
        onSearch={handleSearch}
        onReset={handleReset}
        searchTerm={searchTerm}
        totalItems={totalItems}
        totalItemsLabel="Total Products"
      />
      <GenericTable
        columns={columns}
        data={products}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onExcelDownload={handleExcelDownload}
      />
      {products.length === 0 && (
        <div className="text-center py-4">No products found.</div>
      )}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      <Row className="mb-2">
        <Col className="text-center">
          <h5>
            Page {currentPage} of {totalPages}
          </h5>
        </Col>
      </Row>
    </Container>
  );
}


