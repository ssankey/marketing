

// // components/ProductTable.js
// import { useRouter } from "next/router";

//   import React, { useState, useEffect } from "react";
//   import Link from "next/link";
//   import GenericTable from "./GenericTable";
//   import TableFilters from "./TableFilters";
//   import TablePagination from "./TablePagination";
//   import downloadExcel from "utils/exporttoexcel";
//   import { Container, Row, Col, Spinner } from "react-bootstrap";
//   import  handleReset  from "./TableFilters";

//   import usePagination from "hooks/usePagination";
//   import useTableFilters from "hooks/useFilteredData";

//   export default function ProductsTable({
//     products: initialProducts,
//     totalItems: initialTotalItems,
//     isLoading,
//     status,
//     onStatusChange,
//   }) {
//     const ITEMS_PER_PAGE = 20;
    

  
//     // State
//     const [currentPage, setCurrentPage] = useState(1);
//     const [sortField, setSortField] = useState("ItemCode");
//     const [sortDirection, setSortDirection] = useState("asc");
//     const [searchTerm, setSearchTerm] = useState("");
//     const [products, setProducts] = useState(initialProducts);
//     const [totalItems, setTotalItems] = useState(initialTotalItems);
//      const [selectedCategory, setSelectedCategory] = useState("");
//      const [categories, setCategories] = useState([]);
//      const router = useRouter();


//       useEffect(() => {
//         // Fetch categories for the dropdown
//         const fetchCategories = async () => {
//           try {
//             const res = await fetch("/api/products/categories");
//             const data = await res.json();
//             console.log("Fetched Categories:", data); // Debug fetched data
//             setCategories(data.categories || []); // Ensure categories is an array
//           } catch (error) {
//             console.error("Failed to fetch categories:", error);
//           }
//         };
//         fetchCategories();
//       }, []);


//     // Fetch data when page, sort, or search changes
//     // useEffect(() => {
//     //   const fetchProducts = async () => {
//     //     try {
//     //       const response = await fetch(
//     //         `/api/products?page=${currentPage}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&status=${status}`
//     //       );
//     //       const data = await response.json();
//     //       setProducts(data.products);
//     //       setTotalItems(data.totalItems);
//     //       // setCurrentPage(1);
//     //     } catch (error) {
//     //       console.error("Failed to fetch products:", error);
//     //     }
//     //   };

//     //   fetchProducts();
//     // }, [currentPage, sortField, sortDirection, searchTerm, status]);

//      useEffect(() => {
//        // Fetch products whenever filters change
//        const fetchProducts = async () => {
//          try {
//            const page = parseInt(router.query.page, 10) || 1; // Get the current page from the URL
//            const query = new URLSearchParams({
//              page,
//              search: searchTerm,
//              status,
//             //  category: selectedCategory,
//             category : router.query.category || "", // Get category from URL
//              sortField,
//              sortDir: sortDirection,
//            });
//            const res = await fetch(`/api/products?${query}`);
//            const data = await res.json();
//            setProducts(data.products);
//            setTotalItems(data.totalItems);
//          } catch (error) {
//            console.error("Failed to fetch products:", error);
//          }
//        };
//        fetchProducts();
//      }, [
//        router.query.page,
//        searchTerm,
//        status,
//        selectedCategory,
//        sortField,
//        sortDirection,
//      ]);

//     // useEffect(() => {
//     //   setCurrentPage(1); // Reset to the first page whenever the status changes
//     // }, [status]);
//      const handleStatusChange = (newStatus) => {
//        onStatusChange(newStatus); // Update status
//        router.push({ pathname: "/products", query: { page: 1 } }); // Reset to page 1
//      };

//     // const handlePageChange = (page) => {
//     //   setCurrentPage(page);
//     // };

//     const handleSort = (field) => {
//       if (sortField === field) {
//         setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//       } else {
//         setSortField(field);
//         setSortDirection("asc");
//       }
//     };

//     // Add handleReset function
//     const handleReset = () => {
//       setSearchTerm("");
//       // setCurrentPage(1);
//       setSortField("ItemCode");
//       setSortDirection("asc");
//       onStatusChange("all"); // Reset status to "All"
//       setSelectedCategory("");
//       router.push({ pathname: "/products", query: { page: 1 } }); // Reset to page 1
//     };

//     // const handleSearch = (term) => {
//     //   setSearchTerm(term);
//     //   setCurrentPage(1);
//     // };

//     const handleCategoryChange = (category) => {
//       router.push({
//         pathname: "/products",
//         query: { ...router.query, category, page: 1 }, // Update category and reset to page 1
//       });
//     };

//     const handleSearch = (term) => {
//       setSearchTerm(term);
//       router.push({ pathname: "/products", query: { page: 1 } }); // Reset to page 1 on search
//     };

//     const handlePageChange = (page) => {
//       router.push({ pathname: "/products", query: { ...router.query, page } }); // Update the page query parameter
//     };

//     const columns = [
//       {
//         label: "CAT No.",
//         field: "ItemCode",
//         render: (value, row) => (
//           <Link href={`/products/${row.ItemCode}`}>{value}</Link>
//         ),
//       },
//       {
//         label: "Stock Status",
//         field: "stockStatus",
//         render: (value) => (
//           <span
//             className={`badge ${
//               value === "In Stock" ? "bg-success" : "bg-danger"
//             }`}
//           >
//             {value}
//           </span>
//         ),
//       },
//       { label: "Item Name", field: "ItemName" },
//       { label: "Item Type", field: "ItemType" },
//       { label: "CAS No", field: "U_CasNo", render: (value) => value || "N/A" },
//       { label: "Category", field: "Category" },
//       // {
//       //   label: "Stock Status",
//       //   field: "stockStatus",
//       //   render: (value) => (
//       //     <span
//       //       className={`badge ${
//       //         value === "In Stock" ? "bg-success" : "bg-danger"
//       //       }`}
//       //     >
//       //       {value}
//       //     </span>
//       //   ),
//       // },
//       {
//         label: "Created Date",
//         field: "CreateDate",
//         render: (value) => (value ? value.split("T")[0] : "N/A"),
//       },
//       {
//         label: "Updated Date",
//         field: "UpdateDate",
//         render: (value) => (value ? value.split("T")[0] : "N/A"),
//       },
//       {
//         label: "Actions",
//         field: "actions",
//         render: (value, row) => (
//           <Link href={`/products/${row.ItemCode}`}>View Details</Link>
//         ),
//       },
//     ];

//     const handleExcelDownload = async () => {
//       try {
//         const response = await fetch(
//           `/api/excel/getAllProducts?status=${status}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}`
//         );
//         const filteredProducts = await response.json();

//         if (filteredProducts && filteredProducts.length > 0) {
//           downloadExcel(filteredProducts, `Products_${status}`);
//         } else {
//           alert("No data available to export.");
//         }
//       } catch (error) {
//         console.error("Failed to fetch data for Excel export:", error);
//         alert("Failed to export data. Please try again.");
//       }
//     };


//     if (isLoading) {
//       return <div>Loading products...</div>;
//     }

//     const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

//     return (
//       <Container fluid>
//         <TableFilters
//           searchConfig={{
//             enabled: true,
//             placeholder: "Search products...",
//             fields: ["ItemCode", "ItemName", "ItemType", "U_CasNo"],
//           }}
//           statusFilter={{
//             enabled: true,
//             options: [
//               // { value: "all", label: "All" },
//               { value: "inStock", label: "In Stock" },
//               { value: "outOfStock", label: "Out of Stock" },
//             ],
//             value: status,
//           }}
//           dateFilter={{ enabled: false }}
//           // onStatusChange={handleStatusChange}
//           onStatusChange={handleStatusChange}
//           // onStatusChange={onStatusChange} // This is passed from ProductsPage
//           onSearch={handleSearch}
//           onReset={handleReset}
//           searchTerm={searchTerm}
//           totalItems={totalItems}
//           categories={categories} // Pass categories here
//           selectedCategory={router.query.category || ""}
//           onCategoryChange={handleCategoryChange}
//           totalItemsLabel="Total Products"
//         />
//         <GenericTable
//           columns={columns}
//           data={products}
//           onSort={handleSort}
//           sortField={sortField}
//           sortDirection={sortDirection}
//           onExcelDownload={handleExcelDownload}
//         />
//         {products.length === 0 && (
//           <div className="text-center py-4">No products found.</div>
//         )}
//         {/* <TablePagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={handlePageChange}
//         /> */}
//         {/* <TablePagination
//           currentPage={currentPage}
//           totalPages={Math.ceil(totalItems / 20)}
//           onPageChange={(page) => {
//             router.push({
//               pathname: "/products",
//               query: { ...router.query, page },
//             });
//           }}
//         /> */}
//         <TablePagination
//           currentPage={parseInt(router.query.page, 10) || 1}
//           totalPages={totalPages}
//           onPageChange={handlePageChange}
//         />

//         <Row className="mb-2">
//           <Col className="text-center">
//             <h5>
//               Page {parseInt(router.query.page, 10) || 1} of {totalPages}
//             </h5>
//           </Col>
//         </Row>
//       </Container>
//     );
//   }




// components/ProductTable.js
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import GenericTable from "./GenericTable";
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import downloadExcel from "utils/exporttoexcel";
import { Container, Row, Col } from "react-bootstrap";

export default function ProductsTable({
  products: initialProducts,
  totalItems: initialTotalItems,
  isLoading,
  status,
  onStatusChange,
}) {
  const ITEMS_PER_PAGE = 20;
  const router = useRouter();

  // State (removed selectedCategory)
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("ItemCode");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState(initialProducts);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [categories, setCategories] = useState([]);

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        const data = await res.json();
        console.log("Fetched Categories:", data);
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch Products Whenever Query Changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const page = parseInt(router.query.page, 10) || 1;
        const query = new URLSearchParams({
          page,
          search: searchTerm,
          status,
          // Pull category directly from router's query
          category: router.query.category || "",
          sortField,
          sortDir: sortDirection,
        });
        const res = await fetch(`/api/products?${query}`);
        const data = await res.json();
        setProducts(data.products);
        setTotalItems(data.totalItems);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, [
    router.query.page,
    router.query.category, // watch category from URL
    searchTerm,
    status,
    sortField,
    sortDirection,
  ]);

  // 3. Handle Status Change
  // const handleStatusChange = (newStatus) => {
  //   onStatusChange(newStatus);
  //   // Also reset page to 1
  //   router.push({ pathname: "/products", query: { page: 1 } });
  // };

  const handleStatusChange = (newStatus) => {
    onStatusChange(newStatus); // or setStatus(newStatus) if needed
    router.push({
      pathname: "/products",
      // Spread existing query so we don't lose the category
      query: {
        ...router.query,
        status: newStatus,
        page: 1, // still reset page to 1 if desired
      },
    });
  };


  // 4. Handle Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 5. Handle Reset
  const handleReset = () => {
    setSearchTerm("");
    setSortField("ItemCode");
    setSortDirection("asc");
    onStatusChange("all");
    // Remove category & reset to page 1
    router.push({ pathname: "/products", query: { page: 1 } });
  };

  // 6. Handle Category Change
  const handleCategoryChange = (category) => {
    router.push({
      pathname: "/products",
      query: { ...router.query, category, page: 1 },
    });
  };

  // 7. Handle Search
  const handleSearch = (term) => {
    setSearchTerm(term);
    // Reset page to 1 on search
    router.push({ pathname: "/products", query: { page: 1 } });
  };

  // 8. Handle Pagination
  const handlePageChange = (page) => {
    router.push({ pathname: "/products", query: { ...router.query, page } });
  };

  // 9. Table Columns
  const columns = [
    {
      label: "CAT No.",
      field: "ItemCode",
      render: (value, row) => <Link href={`/products/${row.ItemCode}`}>{value}</Link>,
    },
    {
      label: "Stock Status",
      field: "stockStatus",
      render: (value) => (
        <span className={`badge ${value === "In Stock" ? "bg-success" : "bg-danger"}`}>
          {value}
        </span>
      ),
    },
    { label: "Item Name", field: "ItemName" },
    { label: "Item Type", field: "ItemType" },
    { label: "CAS No", field: "U_CasNo", render: (value) => value || "N/A" },
    { label: "Category", field: "Category" },
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
      render: (value, row) => <Link href={`/products/${row.ItemCode}`}>View Details</Link>,
    },
  ];

  // 10. Handle Excel Download
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

  // 11. Loading State
  if (isLoading) {
    return <div>Loading products...</div>;
  }

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentQueryPage = parseInt(router.query.page, 10) || 1;

  return (
    <Container fluid>
      {/* Filter Bar */}
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search products...",
          fields: ["ItemCode", "ItemName", "ItemType", "U_CasNo"],
        }}
        statusFilter={{
          enabled: true,
          options: [
            { value: "inStock", label: "In Stock" },
            { value: "outOfStock", label: "Out of Stock" },
          ],
          value: status,
        }}
        dateFilter={{ enabled: false }}
        onStatusChange={handleStatusChange}
        onSearch={handleSearch}
        onReset={handleReset}
        searchTerm={searchTerm}
        totalItems={totalItems}
        categories={categories}
        // Use router.query.category to highlight the current selection
        selectedCategory={router.query.category || ""}
        onCategoryChange={handleCategoryChange}
        totalItemsLabel="Total Products"
      />

      {/* Data Table */}
      <GenericTable
        columns={columns}
        data={products}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onExcelDownload={handleExcelDownload}
      />

      {/* Empty State */}
      {products.length === 0 && <div className="text-center py-4">No products found.</div>}

      {/* Pagination */}
      <TablePagination
        currentPage={currentQueryPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Page Display */}
      <Row className="mb-2">
        <Col className="text-center">
          <h5>
            Page {currentQueryPage} of {totalPages}
          </h5>
        </Col>
      </Row>
    </Container>
  );
}
