

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import debounce from "lodash.debounce";
import downloadExcel from "utils/exportToExcel";
import GenericTable from "components/tabel/GenericTable";
import TableFilters from "components/tabel/TableFilters";
import TablePagination from "components/tabel/TablePagination";

/**
 * ProductsTable Component
 * Displays a table of products with filtering, sorting, pagination, and Excel export functionalities.
 */
export default function ProductsTable({
  products: initialProducts = [],
  totalItems: initialTotalItems = 0,
  isLoading = false,
  status,
  onStatusChange,
}) {
  // Constants
  const ITEMS_PER_PAGE = 20;
  const router = useRouter();

  // ------------------- Local State -------------------
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const [sortField, setSortField] = useState("ItemCode"); // Current sort field
  const [sortDirection, setSortDirection] = useState("asc"); // Sort direction: 'asc' or 'desc'
  const [searchTerm, setSearchTerm] = useState(""); // Current search term
  const [selectedCategory, setSelectedCategory] = useState(""); // Currently selected category
  const [categories, setCategories] = useState([]); // List of available categories
  const [products, setProducts] = useState(initialProducts); // List of products to display
  const [totalItems, setTotalItems] = useState(initialTotalItems); // Total number of products

  // ------------------- Fetch Categories -------------------
  /**
   * Fetches the list of product categories from the API.
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]); // Fallback to empty array on error
      }
    };
    fetchCategories();
  }, []);

  // ------------------- Fetch Products -------------------
  /**
   * Fetches products based on current filters, sorting, and pagination.
   */
  const fetchProducts = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        status,
        category: selectedCategory,
        sortField,
        sortDir: sortDirection,
      });

      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts(data.products || []);
      setTotalItems(data.totalItems || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]); // Clear products on error
      setTotalItems(0); // Reset total items on error
    }
  }, [
    currentPage,
    searchTerm,
    status,
    selectedCategory,
    sortField,
    sortDirection,
  ]);

  // Fetch products whenever dependencies change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ------------------- Debounced Search Handler -------------------
  /**
   * Handles search input with debouncing to prevent excessive API calls.
   */
  const debouncedHandleSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      setCurrentPage(1);
      // Update URL with shallow routing
      router.replace(
        {
          pathname: "/products",
          query: {
            ...router.query,
            search: term,
            page: 1,
          },
        },
        undefined,
        { shallow: true }
      );
    }, 300), // 300ms debounce delay
    [router]
  );

  /**
   * Called when the search input changes.
   * @param {string} term - The new search term.
   */
  const handleSearch = (term) => {
    debouncedHandleSearch(term);
  };

  // ------------------- Status Change Handler -------------------
  /**
   * Handles changes to the stock status filter.
   * @param {string} newStatus - The new status value.
   */
  const handleStatusChangeInternal = (newStatus) => {
    onStatusChange(newStatus); // Notify parent component if needed
    setCurrentPage(1);
    // Update URL with shallow routing
    router.replace(
      {
        pathname: "/products",
        query: {
          ...router.query,
          status: newStatus,
          page: 1,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  // ------------------- Sorting Handler -------------------
  /**
   * Handles sorting when a table header is clicked.
   * @param {string} field - The field to sort by.
   */
  const handleSortInternal = (field) => {
    let direction = "asc";
    if (sortField === field && sortDirection === "asc") {
      direction = "desc";
    }
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
    // Update URL with shallow routing
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

  // ------------------- Category Change Handler -------------------
  /**
   * Handles changes to the category filter.
   * @param {string} category - The selected category.
   */
  const handleCategoryChangeInternal = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    // Update URL with shallow routing
    router.replace(
      {
        pathname: "/products",
        query: {
          ...router.query,
          category: category || "",
          page: 1,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  // ------------------- Reset Handler -------------------
  /**
   * Resets all filters to their default states.
   */
  const handleReset = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSortField("ItemCode");
    setSortDirection("asc");
    onStatusChange("all");
    setCurrentPage(1);
    // Update URL with shallow routing
    router.replace({ pathname: "/products", query: { page: 1 } }, undefined, {
      shallow: true,
    });
  };

  // ------------------- Pagination Handler -------------------
  /**
   * Handles pagination when a new page is selected.
   * @param {number} page - The new page number.
   */
  const handlePageChangeInternal = (page) => {
    setCurrentPage(page);
    // Update URL with shallow routing
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

  // ------------------- Excel Download Handler -------------------
  /**
   * Handles the Excel download functionality.
   */
  const handleExcelDownload = async () => {
    try {
      const query = new URLSearchParams({
        status,
        search: searchTerm,
        category: selectedCategory,
        sortField,
        sortDir: sortDirection,
      });

      const response = await fetch(
        `/api/excel/getAllProducts?${query.toString()}`
      );
      if (!response.ok)
        throw new Error("Failed to fetch data for Excel export");

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

  // ------------------- Table Columns Configuration -------------------
  const columns = [
    {
      label: "CAT No.",
      field: "ItemCode",
      render: (value, row) => (
        <Link href={`/products/${row.ItemCode}`}>{value}</Link>
      ),
      sortable: true, // Enable sorting on this column
    },
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
      sortable: true,
    },
    { label: "Item Name", field: "ItemName", sortable: true },
    { label: "Category", field: "Category", sortable: true },
    {
      label: "Created Date",
      field: "CreateDate",
      render: (value) => (value ? value.split("T")[0] : "N/A"),
      sortable: true,
    },
    {
      label: "Updated Date",
      field: "UpdateDate",
      render: (value) => (value ? value.split("T")[0] : "N/A"),
      sortable: true,
    },
    {
      label: "Actions",
      field: "actions",
      render: (value, row) => (
        <Link href={`/products/${row.ItemCode}`}>View Details</Link>
      ),
      sortable: false,
    },
  ];

  // ------------------- Render Component -------------------
  return (
    <Container fluid>
      {/* ------------------- Filter Bar ------------------- */}
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
        onSearch={handleSearch}
        onReset={handleReset}
        searchTerm={searchTerm}
        totalItems={totalItems}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChangeInternal}
        totalItemsLabel="Total Products"
      />

      {/* ------------------- Data Table ------------------- */}
      {isLoading ? (
        // Loading Indicator
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading products...</p>
        </div>
      ) : products.length > 0 ? (
        // Products Table
        <GenericTable
          columns={columns}
          data={products}
          onSort={handleSortInternal}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={handleExcelDownload}
        />
      ) : (
        // No Products Found Alert
        <Alert variant="warning" className="text-center">
          No products found.
        </Alert>
      )}

      {/* ------------------- Pagination ------------------- */}
      {totalItems > ITEMS_PER_PAGE && (
        <>
          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
            onPageChange={handlePageChangeInternal}
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
