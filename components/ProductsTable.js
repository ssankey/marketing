// // components/ProductsTable.js

// import React, { useState, useEffect, useRef, useMemo } from "react";
// import Link from "next/link";
// import { useRouter } from "next/router";
// import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
// import downloadExcel from "utils/exporttoexcel";
// import GenericTable from "./GenericTable";
// import TableFilters from "./TableFilters";
// import TablePagination from "./TablePagination";

// export default function ProductsTable({
//   products: initialProducts = [],
//   totalItems: initialTotalItems = 0,
//   isLoading = false,
//   status,
//   onStatusChange,
// }) {
//   // Constants
//   const ITEMS_PER_PAGE = 20;
//   const DEBOUNCE_DELAY = 500; // Increased from 300ms
//   const router = useRouter();

//   // ------------------- Refs for debouncing -------------------
//   const searchTimeoutRef = useRef(null);
//   const abortControllerRef = useRef(null);

//   // ------------------- Local State -------------------
//   const [currentPage, setCurrentPage] = useState(1);
//   const [sortField, setSortField] = useState("ItemCode");
//   const [sortDirection, setSortDirection] = useState("asc");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchInput, setSearchInput] = useState(""); // Separate state for input
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [categories, setCategories] = useState([]);
//   const [products, setProducts] = useState(initialProducts);
//   const [totalItems, setTotalItems] = useState(initialTotalItems);
//   const [isExporting, setIsExporting] = useState(false);
//   const [isFetching, setIsFetching] = useState(false);

//   // ------------------- Memoized fetch parameters -------------------
//   const fetchParams = useMemo(() => ({
//     page: currentPage,
//     search: searchTerm,
//     status,
//     category: selectedCategory,
//     sortField,
//     sortDir: sortDirection,
//   }), [currentPage, searchTerm, status, selectedCategory, sortField, sortDirection]);

//   // ------------------- Fetch Categories -------------------
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await fetch("/api/products/categories");
//         if (!res.ok) throw new Error("Failed to fetch categories");
//         const data = await res.json();
//         setCategories(data.categories || []);
//       } catch (error) {
//         console.error("Error fetching categories:", error);
//         setCategories([]);
//       }
//     };
//     fetchCategories();
//   }, []);

//   // ------------------- Optimized Fetch Products -------------------
//   const fetchProducts = async (params = fetchParams) => {
//     // Cancel previous request
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//     }

//     // Create new abort controller
//     abortControllerRef.current = new AbortController();

//     try {
//       setIsFetching(true);
      
//       const query = new URLSearchParams(params);
//       const res = await fetch(`/api/products?${query.toString()}`, {
//         signal: abortControllerRef.current.signal
//       });
      
//       if (!res.ok) throw new Error("Failed to fetch products");

//       const data = await res.json();
//       setProducts(data.products || []);
//       setTotalItems(data.totalItems || 0);
//     } catch (error) {
//       if (error.name === 'AbortError') {
//         console.log('Request was cancelled');
//         return;
//       }
//       console.error("Error fetching products:", error);
//       setProducts([]);
//       setTotalItems(0);
//     } finally {
//       setIsFetching(false);
//     }
//   };

//   // ------------------- Fetch products when params change -------------------
//   useEffect(() => {
//     fetchProducts();
    
//     // Cleanup function
//     return () => {
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//   }, [fetchParams]);

//   // ------------------- Debounced Search Handler -------------------
//   const handleSearchInput = (value) => {
//     setSearchInput(value);
    
//     // Clear existing timeout
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }

//     // Set new timeout
//     searchTimeoutRef.current = setTimeout(() => {
//       setSearchTerm(value);
//       setCurrentPage(1);
      
//       // Update URL without causing re-render loops
//       const newQuery = { ...router.query };
//       if (value) {
//         newQuery.search = value;
//       } else {
//         delete newQuery.search;
//       }
//       newQuery.page = 1;

//       router.replace(
//         {
//           pathname: "/products",
//           query: newQuery,
//         },
//         undefined,
//         { shallow: true }
//       );
//     }, DEBOUNCE_DELAY);
//   };

//   // ------------------- Status Change Handler -------------------
//   const handleStatusChangeInternal = (newStatus) => {
//     onStatusChange(newStatus);
//     setCurrentPage(1);
    
//     const newQuery = { ...router.query };
//     if (newStatus && newStatus !== 'all') {
//       newQuery.status = newStatus;
//     } else {
//       delete newQuery.status;
//     }
//     newQuery.page = 1;

//     router.replace(
//       {
//         pathname: "/products",
//         query: newQuery,
//       },
//       undefined,
//       { shallow: true }
//     );
//   };

//   // ------------------- Sorting Handler -------------------
//   const handleSortInternal = (field) => {
//     let direction = "asc";
//     if (sortField === field && sortDirection === "asc") {
//       direction = "desc";
//     }
//     setSortField(field);
//     setSortDirection(direction);
//     setCurrentPage(1);
    
//     router.replace(
//       {
//         pathname: "/products",
//         query: {
//           ...router.query,
//           sortField: field,
//           sortDir: direction,
//           page: 1,
//         },
//       },
//       undefined,
//       { shallow: true }
//     );
//   };

//   // ------------------- Category Change Handler -------------------
//   const handleCategoryChangeInternal = (category) => {
//     setSelectedCategory(category);
//     setCurrentPage(1);
    
//     const newQuery = { ...router.query };
//     if (category) {
//       newQuery.category = category;
//     } else {
//       delete newQuery.category;
//     }
//     newQuery.page = 1;

//     router.replace(
//       {
//         pathname: "/products",
//         query: newQuery,
//       },
//       undefined,
//       { shallow: true }
//     );
//   };

//   // ------------------- Reset Handler -------------------
//   const handleReset = () => {
//     // Clear timeouts
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }

//     setSearchInput("");
//     setSearchTerm("");
//     setSelectedCategory("");
//     setSortField("ItemCode");
//     setSortDirection("asc");
//     onStatusChange("all");
//     setCurrentPage(1);
    
//     router.replace(
//       { pathname: "/products", query: { page: 1 } },
//       undefined,
//       { shallow: true }
//     );
//   };

//   // ------------------- Pagination Handler -------------------
//   const handlePageChangeInternal = (page) => {
//     setCurrentPage(page);
    
//     router.replace(
//       {
//         pathname: "/products",
//         query: {
//           ...router.query,
//           page,
//         },
//       },
//       undefined,
//       { shallow: true }
//     );
//   };

//   // ------------------- Excel Download Handler -------------------
//   const handleExcelDownload = async () => {
//     try {
//       setIsExporting(true);
//       const query = new URLSearchParams({
//         status,
//         search: searchTerm,
//         category: selectedCategory,
//         sortField,
//         sortDir: sortDirection,
//         getAll: 'true'
//       });

//       const res = await fetch(`/api/products?${query.toString()}`);
//       if (!res.ok) throw new Error("Failed to fetch data for Excel export");

//       const data = await res.json();
//       const productsForExport = data.products || [];

//       const excelColumns = columns
//         .filter((col) => col.field !== "actions")
//         .map((col) => ({
//           header: col.label,
//           key: col.field,
//         }));

//       const formattedData = productsForExport.map((product) => {
//         const row = {};
//         columns.forEach((col) => {
//           if (col.field === "actions") return;

//           const value = product[col.field];
//           if (col.render && typeof col.render === "function") {
//             row[col.field] = col.render(value, product)?.props?.children || value;
//           } else if (
//             col.field === "CreateDate" ||
//             col.field === "UpdateDate"
//           ) {
//             row[col.field] = value ? value.split("T")[0] : "N/A";
//           } else {
//             row[col.field] = value;
//           }
//         });
//         return row;
//       });

//       downloadExcel(formattedData, `Products_${status}`, excelColumns);
//     } catch (error) {
//       console.error("Failed to fetch data for Excel export:", error);
//       alert("Failed to export data. Please try again.");
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   // ------------------- Table Columns Configuration -------------------
//   const columns = useMemo(() => [
//     {
//       label: "CAT No.",
//       field: "ItemCode",
//       sortable: true,
//       render: (value, row) => (
//         <Link href={`/products/${row.ItemCode}`}>{value}</Link>
//       ),
//     },
//     {
//       label: "Stock Status",
//       field: "stockStatus",
//       render: (value) => (
//         <span
//           className={`badge ${
//             value === "In Stock" ? "bg-success" : "bg-danger"
//           }`}
//         >
//           {value}
//         </span>
//       ),
//       sortable: true,
//     },
//     { label: "Item Name", field: "ItemName", sortable: true },
//     { label: "vendorbatchnum ", field: "vendorbatchnum", sortable: true },
//     { label: "Category", field: "Category", sortable: true },
//     {
//       label: "Stock",
//       field: "OnHand",
//       sortable: true,
//     },
//     {
//       label: "Created Date",
//       field: "CreateDate",
//       sortable: true,
//       render: (value) => (value ? value.split("T")[0] : "N/A"),
//     },
//     {
//       label: "Updated Date",
//       field: "UpdateDate",
//       sortable: true,
//       render: (value) => (value ? value.split("T")[0] : "N/A"),
//     },
//     {
//       label: "Actions",
//       field: "actions",
//       sortable: false,
//       render: (value, row) => (
//         <Link href={`/products/${row.ItemCode}`}>View Details</Link>
//       ),
//     },
//   ], []);

//   // ------------------- Cleanup on unmount -------------------
//   useEffect(() => {
//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//   }, []);

//   // ------------------- Render Component -------------------
//   return (
//     <Container fluid>
//       {/* ------------------- Filter Bar ------------------- */}
//       <TableFilters
//         searchConfig={{
//           enabled: true,
//           placeholder: "Search products...",
//           fields: ["ItemCode", "ItemName", "ItemType", "U_CasNo"],
//         }}
//         statusFilter={{
//           enabled: true,
//           options: [
//             { value: "inStock", label: "In Stock" },
//             { value: "outOfStock", label: "Out of Stock" },
//           ],
//           value: status,
//         }}
//         dateFilter={{ enabled: false }}
//         onStatusChange={handleStatusChangeInternal}
//         onSearch={handleSearchInput} // Use the new handler
//         onReset={handleReset}
//         searchTerm={searchInput} // Use searchInput for display
//         totalItems={totalItems}
//         categories={categories}
//         selectedCategory={selectedCategory}
//         onCategoryChange={handleCategoryChangeInternal}
//         totalItemsLabel="Total Products"
//         isLoading={isFetching} // Pass loading state to filters
//       />

//       {/* ------------------- Data Table ------------------- */}
//       {isLoading ? (
//         <div className="text-center py-4">
//           <Spinner animation="border" variant="primary" />
//           <p className="mt-2">Loading products...</p>
//         </div>
//       ) : products.length > 0 ? (
//         <GenericTable
//           columns={columns}
//           data={products}
//           onSort={handleSortInternal}
//           sortField={sortField}
//           sortDirection={sortDirection}
//           onExcelDownload={handleExcelDownload}
//           isLoading={isFetching}
//           isExporting={isExporting}
//         />
//       ) : (
//         <Alert variant="warning" className="text-center">
//           {isFetching ? "Searching..." : "No products found."}
//         </Alert>
//       )}

//       {/* ------------------- Pagination ------------------- */}
//       {totalItems > ITEMS_PER_PAGE && (
//         <>
//           <TablePagination
//             currentPage={currentPage}
//             totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
//             onPageChange={handlePageChangeInternal}
//             disabled={isFetching}
//           />
//           <Row className="mb-2">
//             <Col className="text-center">
//               <h5>
//                 Page {currentPage} of {Math.ceil(totalItems / ITEMS_PER_PAGE)}
//               </h5>
//             </Col>
//           </Row>
//         </>
//       )}
//     </Container>
//   );
// }


import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Container, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import { FlaskConical, FileText } from "lucide-react";
import downloadExcel from "utils/exporttoexcel";
import GenericTable from "./GenericTable";
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import msdsMap from "public/data/msds-map.json";
import { useAuth } from 'contexts/AuthContext';

const ProductActions = ({ itemCode, vendorBatchNum }) => {
  const { user } = useAuth(); 
  const [loadingCOA, setLoadingCOA] = useState(false);
  const [loadingMSDS, setLoadingMSDS] = useState(false);

  const isAdminOrSales = ['admin', 'sales_person'].includes(user?.role);

  const handleCOADownload = async () => {
    try {
      setLoadingCOA(true);
      
      if (!itemCode || !vendorBatchNum) {
        alert("Item code or batch number is missing");
        return;
      }

      const code = itemCode.includes("-") ? itemCode.split("-")[0] : itemCode;
      const batch = vendorBatchNum.trim();
      
      const coaUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;

      const fileRes = await fetch(coaUrl);
      if (!fileRes.ok) {
        throw new Error("COA not found");
      }
      
      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const filename = `${code}_${batch}_COA.pdf`;
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error("Error in COA download:", err);
      alert("Failed to download COA file. It may not be available.");
    } finally {
      setLoadingCOA(false);
    }
  };

  const handleMSDSDownload = async () => {
    try {
      setLoadingMSDS(true);
      
      const key = itemCode.trim();
      const msdsUrl = msdsMap[key];

      if (!msdsUrl) {
        alert("MSDS not found for this product");
        return;
      }

      const fileRes = await fetch(msdsUrl);
      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${key}_MSDS.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error("Error in MSDS download:", err);
      alert("Failed to download MSDS file.");
    } finally {
      setLoadingMSDS(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 space-y-1 sm:space-y-0">
      <Link 
        href={`/products/${itemCode}`}
        className="text-blue-600 hover:text-blue-800"
        style={{ textDecoration: "none", fontWeight: 500 }}
      >
        {itemCode}
      </Link>

      {isAdminOrSales && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMSDSDownload();
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-200 text-blue-900 hover:bg-blue-300 rounded-md border border-blue-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
          title="Download MSDS"
          disabled={loadingMSDS}
        >
          {loadingMSDS ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <FlaskConical size={12} />
          )}
          <span className="hidden sm:inline font-medium">MSDS</span>
        </button>
      )}

      {isAdminOrSales && vendorBatchNum && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCOADownload();
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-200 text-green-900 hover:bg-green-300 rounded-md border border-green-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
          title="Download COA"
          disabled={loadingCOA}
        >
          {loadingCOA ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <FileText size={12} />
          )}
          <span className="hidden sm:inline font-medium">COA</span>
        </button>
      )}
    </div>
  );
};

export default function ProductsTable({
  products: initialProducts = [],
  totalItems: initialTotalItems = 0,
  isLoading = false,
  status,
  onStatusChange,
}) {
  const ITEMS_PER_PAGE = 20;
  const DEBOUNCE_DELAY = 500;
  const router = useRouter();

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("ItemCode");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchParams = useMemo(() => ({
    page: currentPage,
    search: searchTerm,
    status,
    category: selectedCategory,
    sortField,
    sortDir: sortDirection,
  }), [currentPage, searchTerm, status, selectedCategory, sortField, sortDirection]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async (params = fetchParams) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsFetching(true);
      
      const query = new URLSearchParams(params);
      const res = await fetch(`/api/products?${query.toString()}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts(data.products || []);
      setTotalItems(data.totalItems || 0);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      console.error("Error fetching products:", error);
      setProducts([]);
      setTotalItems(0);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchParams]);

  const handleSearchInput = (value) => {
    setSearchInput(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
      
      const newQuery = { ...router.query };
      if (value) {
        newQuery.search = value;
      } else {
        delete newQuery.search;
      }
      newQuery.page = 1;

      router.replace(
        {
          pathname: "/products",
          query: newQuery,
        },
        undefined,
        { shallow: true }
      );
    }, DEBOUNCE_DELAY);
  };

  const handleStatusChangeInternal = (newStatus) => {
    onStatusChange(newStatus);
    setCurrentPage(1);
    
    const newQuery = { ...router.query };
    if (newStatus && newStatus !== 'all') {
      newQuery.status = newStatus;
    } else {
      delete newQuery.status;
    }
    newQuery.page = 1;

    router.replace(
      {
        pathname: "/products",
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleSortInternal = (field) => {
    let direction = "asc";
    if (sortField === field && sortDirection === "asc") {
      direction = "desc";
    }
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
    
    router.replace(
      {
        pathname: "/products",
        query: {
          ...router.query,
          sortField: field,
          sortDir: direction,
          page: 1,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleCategoryChangeInternal = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    
    const newQuery = { ...router.query };
    if (category) {
      newQuery.category = category;
    } else {
      delete newQuery.category;
    }
    newQuery.page = 1;

    router.replace(
      {
        pathname: "/products",
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleReset = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchInput("");
    setSearchTerm("");
    setSelectedCategory("");
    setSortField("ItemCode");
    setSortDirection("asc");
    onStatusChange("all");
    setCurrentPage(1);
    
    router.replace(
      { pathname: "/products", query: { page: 1 } },
      undefined,
      { shallow: true }
    );
  };

  const handlePageChangeInternal = (page) => {
    setCurrentPage(page);
    
    router.replace(
      {
        pathname: "/products",
        query: {
          ...router.query,
          page,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleExcelDownload = async () => {
    try {
      setIsExporting(true);
      const query = new URLSearchParams({
        status,
        search: searchTerm,
        category: selectedCategory,
        sortField,
        sortDir: sortDirection,
        getAll: 'true'
      });

      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch data for Excel export");

      const data = await res.json();
      const productsForExport = data.products || [];

      const excelColumns = columns
        .filter((col) => col.field !== "actions")
        .map((col) => ({
          header: col.label,
          key: col.field,
        }));

      const formattedData = productsForExport.map((product) => {
        const row = {};
        columns.forEach((col) => {
          if (col.field === "actions") return;

          const value = product[col.field];
          if (col.render && typeof col.render === "function") {
            row[col.field] = col.render(value, product)?.props?.children || value;
          } else if (
            col.field === "CreateDate" ||
            col.field === "UpdateDate"
          ) {
            row[col.field] = value ? value.split("T")[0] : "N/A";
          } else {
            row[col.field] = value;
          }
        });
        return row;
      });

      downloadExcel(formattedData, `Products_${status}`, excelColumns);
    } catch (error) {
      console.error("Failed to fetch data for Excel export:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = useMemo(() => [
    {
      label: "CAT No.",
      field: "ItemCode",
      sortable: true,
      render: (value, row) => (
      <ProductActions 
        itemCode={value}
        vendorBatchNum={row.vendorbatchnum || ''}
      />
    ),

        

    },
    {
      label: "Stock Status",
      field: "stockStatus",
      render: (value) => (
        <Badge bg={value === "In Stock" ? "success" : "danger"}>
          {value}
        </Badge>
      ),
      sortable: true,
    },
    { label: "Item Name", field: "ItemName", sortable: true },
    // { 
    //   label: "Batch Number", 
    //   field: "vendorbatchnum", 
    //   sortable: true,
    //   render: (value) => value || "N/A"
    // },
    { label: "Category", field: "Category", sortable: true },
    {
      label: "Stock",
      field: "OnHand",
      sortable: true,
    },
    {
      label: "Created Date",
      field: "CreateDate",
      sortable: true,
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Updated Date",
      field: "UpdateDate",
      sortable: true,
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Actions",
      field: "actions",
      sortable: false,
      render: (value, row) => (
        <Link href={`/products/${row.ItemCode}`}>View Details</Link>
      ),
    },
  ], []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
            { value: "inStock", label: "In Stock" },
            { value: "outOfStock", label: "Out of Stock" },
          ],
          value: status,
        }}
        dateFilter={{ enabled: false }}
        onStatusChange={handleStatusChangeInternal}
        onSearch={handleSearchInput}
        onReset={handleReset}
        searchTerm={searchInput}
        totalItems={totalItems}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChangeInternal}
        totalItemsLabel="Total Products"
        isLoading={isFetching}
      />

      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading products...</p>
        </div>
      ) : products.length > 0 ? (
        <GenericTable
          columns={columns}
          data={products}
          onSort={handleSortInternal}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={handleExcelDownload}
          isLoading={isFetching}
          isExporting={isExporting}
        />
      ) : (
        <Alert variant="warning" className="text-center">
          {isFetching ? "Searching..." : "No products found."}
        </Alert>
      )}

      {totalItems > ITEMS_PER_PAGE && (
        <>
          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
            onPageChange={handlePageChangeInternal}
            disabled={isFetching}
          />
          <Row className="mb-2">
            <Col className="text-center">
              <h5>
                Page {currentPage} of {Math.ceil(totalItems / ITEMS_PER_PAGE)}
              </h5>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}