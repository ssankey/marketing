// // components/ProductTable.js

// import React, { useState } from "react";
// import Link from "next/link";
// import GenericTable from "./GenericTable";
// import TableFilters from "./TableFilters";
// import TablePagination from "./TablePagination";
// import downloadExcel from "utils/exporttoexcel";
// import { Container, Row, Col, Spinner } from "react-bootstrap";
// import { components } from "react-select";

// export default function ProductsTable({ products, totalItems, isLoading }) {
//   const ITEMS_PER_PAGE = 20; // Define items per page

//   // State for current page
//   const [currentPage, setCurrentPage] = useState(1);

//   // State for sorting and searching
//   const [sortField, setSortField] = useState("ItemCode");
//   const [sortDirection, setSortDirection] = useState("asc");
//   const [searchTerm, setSearchTerm] = useState("");

//   // Pagination logic
//   const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
//   const paginatedProducts = products.slice(
//     (currentPage - 1) * ITEMS_PER_PAGE,
//     currentPage * ITEMS_PER_PAGE
//   );

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   // Sorting logic
//   const handleSort = (field) => {
//     if (sortField === field) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortField(field);
//       setSortDirection("asc");
//     }
//   };

//   // Search logic
//   const handleSearch = (term) => {
//     setSearchTerm(term);
//     setCurrentPage(1); // Reset to the first page on new search
//   };

//   const filteredProducts = products.filter((product) => {
//     const searchFields = ["ItemCode", "ItemName", "ItemType", "U_CasNo"];
//     return searchFields.some((field) =>
//       product[field]
//         ?.toString()
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase())
//     );
//   });

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

//   // Handle Excel download
//   // const handleExcelDownload = () => {
//   //   downloadExcel(products, "Products");
//   // };
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
//         searchTerm={searchTerm}
//         totalItems={filteredProducts.length}
//         totalItemsLabel="Total Products"
//       />
//       <GenericTable
//         columns={columns}
//         data={filteredProducts.slice(
//           (currentPage - 1) * ITEMS_PER_PAGE,
//           currentPage * ITEMS_PER_PAGE
//         )}
//         onSort={handleSort}
//         sortField={sortField}
//         sortDirection={sortDirection}
//         onExcelDownload={handleExcelDownload}
//       />
//       {filteredProducts.length === 0 && (
//         <div className="text-center py-4">No products found.</div>
//       )}
//       <TablePagination
//         currentPage={currentPage}
//         totalPages={Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
//         onPageChange={handlePageChange}
//       />

//       {/* Add Row and Col for displaying current page and total pages */}
//       <Row className="mb-2">
//         <Col className="text-center">
//           <h5>
//             Page {currentPage} of{" "}
//             {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
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
import { components } from "react-select";
import  handleReset  from "./TableFilters";

export default function ProductsTable({ products: initialProducts, totalItems: initialTotalItems, isLoading }) {
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
          `/api/products?page=${currentPage}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}`
        );
        const data = await response.json();
        setProducts(data.products);
        setTotalItems(data.totalItems);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, [currentPage, sortField, sortDirection, searchTerm]);

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
      const response = await fetch("api/excel/getAllProducts");
      const allProducts = await response.json();
      if (allProducts && allProducts.length > 0) {
        downloadExcel(allProducts, "Products");
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
    <>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search products...",
          fields: ["ItemCode", "ItemName", "ItemType", "U_CasNo"],
        }}
        dateFilter={{ enabled: false }}
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
    </>
  );
}
