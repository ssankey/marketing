// components/ProductsTable.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Spinner, Modal } from "react-bootstrap";
import downloadExcel from "utils/exporttoexcel";
import msdsMap from "public/data/msds-map.json";
import { useAuth } from 'contexts/AuthContext';

const PAGE_SIZE = 20;

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

  if (!isAdminOrSales) return <span className="pt-dash">—</span>;

  return (
    <div className="pt-doc-actions">
      <button
        className="pt-doc-btn pt-doc-btn-msds"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleMSDSDownload();
        }}
        title="Download MSDS"
        disabled={loadingMSDS}
      >
        {loadingMSDS ? <Spinner animation="border" size="sm" /> : "MSDS"}
      </button>

      {vendorBatchNum && (
        <button
          className="pt-doc-btn pt-doc-btn-coa"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCOADownload();
          }}
          title="Download COA"
          disabled={loadingCOA}
        >
          {loadingCOA ? <Spinner animation="border" size="sm" /> : "COA"}
        </button>
      )}
    </div>
  );
};

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function ProductsTable({
  products: initialProducts = [],
  totalItems: initialTotalItems = 0,
  isLoading = false,
  status,
  onStatusChange,
}) {
  const { user } = useAuth();
  const is3ASenrise = user?.role === "3ASenrise";

  const ITEMS_PER_PAGE = PAGE_SIZE;
  const DEBOUNCE_DELAY = 500;
  const router = useRouter();

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const categoryContainerRef = useRef(null);

  // Hydrate every filter/pagination value from the URL on mount (not hardcoded
  // defaults) so returning via the browser back button from a product detail page
  // — or a hard refresh — lands back on the exact same page/search/sort/category
  // instead of silently resetting to page 1 with no filters.
  const [currentPage, setCurrentPage] = useState(() => parseInt(router.query.page, 10) || 1);
  const [sortField, setSortField] = useState(() => router.query.sortField || "ItemCode");
  const [sortDirection, setSortDirection] = useState(() => router.query.sortDir || "asc");
  const [searchTerm, setSearchTerm] = useState(() => router.query.search || "");
  const [searchInput, setSearchInput] = useState(() => router.query.search || "");
  const [selectedCategory, setSelectedCategory] = useState(() => router.query.category || "");
  const [categorySearch, setCategorySearch] = useState(() => router.query.category || "");
  const [webDisplayFilter, setWebDisplayFilter] = useState(() => router.query.webDisplay || "all");
  const [priceSetFilter, setPriceSetFilter] = useState(() => router.query.priceSet || "all");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // "No. of Customers" drill-down modal
  const [customersModal, setCustomersModal] = useState({
    show: false,
    itemCode: null,
    itemName: null,
    loading: false,
    customers: [],
    error: null,
  });

  const openCustomersModal = async (itemCode, itemName) => {
    setCustomersModal({ show: true, itemCode, itemName, loading: true, customers: [], error: null });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/products/customers/${encodeURIComponent(itemCode)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomersModal((prev) => ({ ...prev, loading: false, customers: data.customers || [] }));
    } catch (err) {
      console.error("Error fetching product customers:", err);
      setCustomersModal((prev) => ({ ...prev, loading: false, error: "Failed to load customers." }));
    }
  };

  const closeCustomersModal = () => {
    setCustomersModal({ show: false, itemCode: null, itemName: null, loading: false, customers: [], error: null });
  };

  const fetchParams = useMemo(() => ({
    page: currentPage,
    search: searchTerm,
    status,
    category: selectedCategory,
    sortField,
    sortDir: sortDirection,
    webDisplay: webDisplayFilter === "all" ? "" : webDisplayFilter,
    priceSet: priceSetFilter === "all" ? "" : priceSetFilter,
  }), [currentPage, searchTerm, status, selectedCategory, sortField, sortDirection, webDisplayFilter, priceSetFilter]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();

        let filteredCategories = data.categories || [];
        if (is3ASenrise) {
          filteredCategories = filteredCategories.filter(cat => cat === "3A Chemicals");
        }

        setCategories(filteredCategories);
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

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCategorySearch(selectedCategory);
  }, [selectedCategory]);

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
        { pathname: "/products", query: newQuery },
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
      { pathname: "/products", query: newQuery },
      undefined,
      { shallow: true }
    );
  };

  const handleWebDisplayChangeInternal = (value) => {
    setWebDisplayFilter(value);
    setCurrentPage(1);

    const newQuery = { ...router.query };
    if (value && value !== "all") {
      newQuery.webDisplay = value;
    } else {
      delete newQuery.webDisplay;
    }
    newQuery.page = 1;

    router.replace(
      { pathname: "/products", query: newQuery },
      undefined,
      { shallow: true }
    );
  };

  const handlePriceSetChangeInternal = (value) => {
    setPriceSetFilter(value);
    setCurrentPage(1);

    const newQuery = { ...router.query };
    if (value && value !== "all") {
      newQuery.priceSet = value;
    } else {
      delete newQuery.priceSet;
    }
    newQuery.page = 1;

    router.replace(
      { pathname: "/products", query: newQuery },
      undefined,
      { shallow: true }
    );
  };

  // Quantity-style columns read better sorted highest-first on the very first
  // click (e.g. "who are the top customers by units sold"), unlike text/code
  // columns which default to A→Z.
  const DESC_FIRST_FIELDS = ["OnHand", "UnitsSold", "NumberOfCustomers"];

  const handleSortInternal = (field) => {
    let direction = DESC_FIRST_FIELDS.includes(field) ? "desc" : "asc";
    if (sortField === field) {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);

    router.replace(
      {
        pathname: "/products",
        query: { ...router.query, sortField: field, sortDir: direction, page: 1 },
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
      { pathname: "/products", query: newQuery },
      undefined,
      { shallow: true }
    );
  };

  const handleCategorySelect = (cat) => {
    setCategorySearch(cat);
    setShowCategoryDropdown(false);
    handleCategoryChangeInternal(cat);
  };

  const clearCategory = () => {
    setCategorySearch("");
    handleCategoryChangeInternal("");
  };

  const handleReset = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchInput("");
    setSearchTerm("");
    setSelectedCategory("");
    setCategorySearch("");
    setSortField("ItemCode");
    setSortDirection("asc");
    onStatusChange("all");
    setWebDisplayFilter("all");
    setPriceSetFilter("all");
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
      { pathname: "/products", query: { ...router.query, page } },
      undefined,
      { shallow: true }
    );
  };

  // Column definitions — used only for the Excel export mapping, not for on-screen
  // rendering (the table below is hand-laid-out to match the catalyst-pricing console
  // style, with CAT No. and its MSDS/COA document buttons as separate columns).
  const columns = useMemo(() => [
    {
      label: "CAT No.",
      field: "ItemCode",
      sortable: true,
      render: (value) => value,
    },
    {
      label: "CAS No.",
      field: "U_CasNo",
      sortable: true,
      render: (value) => value || "N/A",
    },
    {
      label: "Stock Status",
      field: "stockStatus",
      sortable: true,
      render: (value) => value,
    },
    { label: "Item Name", field: "ItemName", sortable: true },
    { label: "Category", field: "Category", sortable: true },
    { label: "Web Display", field: "WebsiteDisplay", sortable: false },
    { label: "Price Set", field: "PriceSet", sortable: false },
    { label: "Stock", field: "OnHand", sortable: true },
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
  ], []);

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

      const excelColumns = columns.map((col) => ({
        header: col.label,
        key: col.field,
      }));

      const formattedData = productsForExport.map((product) => {
        const row = {};
        columns.forEach((col) => {
          const value = product[col.field];
          row[col.field] = col.render && typeof col.render === "function"
            ? col.render(value, product)
            : value;
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

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const SortHeader = ({ label, field, className }) => (
    <th
      className={className}
      onClick={() => handleSortInternal(field)}
      title="Click to sort"
    >
      {label} {sortField === field ? (sortDirection === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <div className="pt">
      <style>{PAGE_STYLES}</style>

      <div className="pt-card">
        <div className="pt-header">
          <h1>Product Master</h1>
          <p className="pt-header-desc">Browse the full catalogue — stock, CAS numbers, and documents.</p>
        </div>

        <div className="pt-controls">
          <div className="pt-field" style={{ width: 260 }}>
            <label>Search</label>
            <input
              className="pt-input"
              type="text"
              style={{ width: "100%" }}
              placeholder="CAT No., Item Name, CAS No…."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
          </div>

          <div className="pt-field">
            <label>Stock Status</label>
            <div className="pt-mode-toggle">
              <button
                type="button"
                className={`pt-mode-btn ${status === "all" ? "active" : ""}`}
                onClick={() => handleStatusChangeInternal("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`pt-mode-btn ${status === "inStock" ? "active" : ""}`}
                onClick={() => handleStatusChangeInternal("inStock")}
              >
                In Stock
              </button>
              <button
                type="button"
                className={`pt-mode-btn ${status === "outOfStock" ? "active" : ""}`}
                onClick={() => handleStatusChangeInternal("outOfStock")}
              >
                Out of Stock
              </button>
            </div>
          </div>

          <div className="pt-field">
            <label>Web Display</label>
            <div className="pt-mode-toggle">
              <button
                type="button"
                className={`pt-mode-btn ${webDisplayFilter === "all" ? "active" : ""}`}
                onClick={() => handleWebDisplayChangeInternal("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`pt-mode-btn ${webDisplayFilter === "yes" ? "active" : ""}`}
                onClick={() => handleWebDisplayChangeInternal("yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={`pt-mode-btn ${webDisplayFilter === "no" ? "active" : ""}`}
                onClick={() => handleWebDisplayChangeInternal("no")}
              >
                No
              </button>
            </div>
          </div>

          <div className="pt-field">
            <label>Price Set</label>
            <div className="pt-mode-toggle">
              <button
                type="button"
                className={`pt-mode-btn ${priceSetFilter === "all" ? "active" : ""}`}
                onClick={() => handlePriceSetChangeInternal("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`pt-mode-btn ${priceSetFilter === "yes" ? "active" : ""}`}
                onClick={() => handlePriceSetChangeInternal("yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={`pt-mode-btn ${priceSetFilter === "no" ? "active" : ""}`}
                onClick={() => handlePriceSetChangeInternal("no")}
              >
                No
              </button>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="pt-field" style={{ width: 190 }} ref={categoryContainerRef}>
              <label>Category</label>
              <input
                className="pt-input"
                style={{ width: "100%" }}
                placeholder="Type or select category..."
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
              />
              {categorySearch && (
                <span className="pt-clear-category" onClick={clearCategory} title="Clear category">×</span>
              )}
              {showCategoryDropdown && filteredCategories.length > 0 && (
                <div className="pt-suggestions">
                  {filteredCategories.map((cat) => (
                    <div key={cat} className="pt-suggestion-item" onClick={() => handleCategorySelect(cat)}>
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-field">
            <label>&nbsp;</label>
            <button type="button" className="pt-reset-btn" onClick={handleReset}>
              Reset
            </button>
          </div>

          <div className="pt-spacer" />

          <div className="pt-total-pill">Total Products: {totalItems}</div>

          <div className="pt-field">
            <label>&nbsp;</label>
            <button className="pt-export-btn" onClick={handleExcelDownload} disabled={isExporting || !products.length}>
              {isExporting ? "Exporting…" : "Export Excel"}
            </button>
          </div>
        </div>

        <div className="pt-table-card">
          {isLoading ? (
            <div className="pt-loading">
              <div className="pt-spinner" />
              <span>Loading products…</span>
            </div>
          ) : !products.length ? (
            <div className="pt-empty">{isFetching ? "Searching…" : "No products found."}</div>
          ) : (
            <>
              <div className="pt-table-scroll">
                <table className="pt-table">
                  <thead>
                    <tr>
                      <SortHeader label="CAT No." field="ItemCode" className="pt-th-left pt-th-sticky" />
                      <SortHeader label="Units Sold" field="UnitsSold" className="pt-th-right" />
                      <SortHeader label="No. of Customers" field="NumberOfCustomers" className="pt-th-right" />
                      <SortHeader label="Stock" field="OnHand" className="pt-th-right" />
                      <SortHeader label="Item Name" field="ItemName" className="pt-th-left" />
                      <SortHeader label="CAS No." field="U_CasNo" className="pt-th-left" />
                      <th className="pt-th-left">Documents</th>
                      <SortHeader label="Stock Status" field="stockStatus" className="pt-th-left" />
                      <SortHeader label="Category" field="Category" className="pt-th-left" />
                      <th className="pt-th-left">Web Display</th>
                      <th className="pt-th-left">Price Set</th>
                      <SortHeader label="Created Date" field="CreateDate" className="pt-th-left" />
                      <SortHeader label="Updated Date" field="UpdateDate" className="pt-th-left" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.ItemCode}>
                        <td className="pt-td-sticky">
                          <Link href={`/products/${product.ItemCode}`} className="pt-catno">
                            {product.ItemCode}
                          </Link>
                        </td>
                        <td className="pt-num">{product.UnitsSold}</td>
                        <td className="pt-num">
                          {product.NumberOfCustomers > 0 ? (
                            <button
                              type="button"
                              className="pt-customer-count-btn"
                              onClick={() => openCustomersModal(product.ItemCode, product.ItemName)}
                              title="View customers who bought this item"
                            >
                              {product.NumberOfCustomers}
                            </button>
                          ) : (
                            product.NumberOfCustomers
                          )}
                        </td>
                        <td className="pt-num">{product.OnHand}</td>
                        <td className="pt-desc" title={product.ItemName}>{product.ItemName}</td>
                        <td>{product.U_CasNo || <span className="pt-dash">N/A</span>}</td>
                        <td>
                          <ProductActions itemCode={product.ItemCode} vendorBatchNum={product.vendorbatchnum || ''} />
                        </td>
                        <td>
                          <span className={`pt-badge ${product.stockStatus === "In Stock" ? "good" : "bad"}`}>
                            {product.stockStatus}
                          </span>
                        </td>
                        <td>{product.Category}</td>
                        <td>
                          <span className={`pt-badge ${product.WebsiteDisplay === "YES" ? "good" : "bad"}`}>
                            {product.WebsiteDisplay === "YES" ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <span className={`pt-badge ${product.PriceSet === "YES" ? "good" : "bad"}`}>
                            {product.PriceSet === "YES" ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>{product.CreateDate ? product.CreateDate.split("T")[0] : <span className="pt-dash">N/A</span>}</td>
                        <td>{product.UpdateDate ? product.UpdateDate.split("T")[0] : <span className="pt-dash">N/A</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-pagination">
                <div className="pt-pagination-info">
                  {totalItems === 0 ? "Showing 0 of 0" : `Showing ${rangeStart}–${rangeEnd} of ${totalItems}`}
                </div>
                <div className="pt-pagination-controls">
                  <button
                    className="pt-page-btn"
                    disabled={currentPage <= 1 || isFetching}
                    onClick={() => handlePageChangeInternal(Math.max(1, currentPage - 1))}
                  >
                    Prev
                  </button>
                  {getPageNumbers(currentPage, totalPages).map((p, idx, arr) => (
                    <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pt-page-ellipsis">…</span>}
                      <button
                        className={`pt-page-btn ${p === currentPage ? "active" : ""}`}
                        disabled={isFetching}
                        onClick={() => handlePageChangeInternal(p)}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                  <button
                    className="pt-page-btn"
                    disabled={currentPage >= totalPages || isFetching}
                    onClick={() => handlePageChangeInternal(Math.min(totalPages, currentPage + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal show={customersModal.show} onHide={closeCustomersModal} centered scrollable>
        <div className="pt-cust-modal">
          <Modal.Header closeButton>
            <Modal.Title as="div">
              <div className="pt-cust-modal-title">Customers</div>
              <div className="pt-cust-modal-subtitle">
                {customersModal.itemCode}
                {customersModal.itemName ? ` — ${customersModal.itemName}` : ""}
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {customersModal.loading ? (
              <div className="pt-cust-modal-loading">
                <Spinner animation="border" size="sm" />
                <span>Loading customers…</span>
              </div>
            ) : customersModal.error ? (
              <div className="pt-cust-modal-error">{customersModal.error}</div>
            ) : customersModal.customers.length === 0 ? (
              <div className="pt-cust-modal-empty">No customers found.</div>
            ) : (
              <ul className="pt-cust-modal-list">
                {customersModal.customers.map((c) => (
                  <li key={c.CardCode}>
                    <span className="pt-cust-modal-name">{c.CardName}</span>
                    <span className="pt-cust-modal-code">{c.CardCode}</span>
                  </li>
                ))}
              </ul>
            )}
          </Modal.Body>
        </div>
      </Modal>
    </div>
  );
}

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .pt {
    --page-bg: #e4ebf1;
    --surface: #ffffff;
    --surface2: #e0edf9;
    --surface-green: #dcf3e8;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    --good: #21875a;
    --bad: #c0402f;

    background: var(--page-bg);
    color: var(--text);
    font-family: 'IBM Plex Sans', sans-serif;
    min-height: 100vh;
    padding: 28px;
  }

  .pt-card {
    width: 100%;
    max-width: 1600px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 14px 34px rgba(31, 41, 55, 0.10), 0 2px 8px rgba(31, 41, 55, 0.06);
    padding: 28px 32px 32px;
    margin: 0 auto;
  }

  .pt-header {
    border-bottom: 1px solid var(--border);
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
  .pt-header h1 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 6px;
  }
  .pt-header-desc {
    font-size: 13.5px;
    color: var(--muted);
    margin: 0;
  }

  .pt-controls {
    position: sticky;
    top: 12px;
    z-index: 50;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
    align-items: flex-end;
    margin-bottom: 20px;
    box-shadow: 0 6px 16px rgba(31, 41, 55, 0.12);
  }

  .pt-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
  }
  .pt-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .pt-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .pt-input:focus { border-color: var(--accent); }

  .pt-clear-category {
    position: absolute;
    right: 10px;
    top: 34px;
    cursor: pointer;
    color: var(--muted);
    font-size: 16px;
    line-height: 1;
  }

  .pt-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 20px rgba(31, 41, 55, 0.15);
    max-height: 220px;
    overflow-y: auto;
    z-index: 60;
  }
  .pt-suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pt-suggestion-item:hover { background: var(--surface2); }

  .pt-mode-toggle {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
  }
  .pt-mode-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    font-weight: 600;
    background: var(--surface);
    color: var(--muted);
    border: none;
    padding: 7px 10px;
    cursor: pointer;
    white-space: nowrap;
  }
  .pt-mode-btn.active { background: var(--accent); color: #ffffff; }

  .pt-reset-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
  }
  .pt-reset-btn:hover { background: var(--surface2); }

  .pt-spacer { flex: 1 1 auto; }

  .pt-total-pill {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: var(--muted);
    align-self: center;
  }

  .pt-export-btn {
    background: var(--good);
    color: #ffffff;
    border: none;
    border-radius: 5px;
    padding: 8px 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .pt-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .pt-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .pt-loading, .pt-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 60px 0;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }
  .pt-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    animation: pt-spin 0.8s linear infinite;
  }
  @keyframes pt-spin { to { transform: rotate(360deg); } }

  .pt-table-scroll { overflow-x: auto; }

  .pt-table { width: 100%; border-collapse: collapse; }
  .pt-table th {
    background: var(--surface2);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    padding: 10px 12px;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
  .pt-table th:last-child { border-right: none; }
  .pt-table th:hover { color: var(--text); }
  .pt-th-left { text-align: left; }
  .pt-th-right { text-align: right; }
  .pt-th-sticky {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--surface2);
  }

  .pt-table td {
    padding: 11px 14px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .pt-table td:last-child { border-right: none; }
  .pt-table tbody tr:last-child td { border-bottom: none; }
  .pt-table tbody tr:hover { background: var(--surface2); }
  .pt-td-sticky {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--surface);
  }
  .pt-table tbody tr:hover .pt-td-sticky { background: var(--surface2); }
  .pt-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .pt-desc {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 320px;
    cursor: help;
  }
  .pt-catno {
    color: var(--accent);
    font-weight: 600;
    font-family: 'IBM Plex Mono', monospace;
    text-decoration: none;
  }
  .pt-catno:hover { text-decoration: underline; }
  .pt-view-link {
    color: var(--accent);
    font-size: 12.5px;
    text-decoration: none;
  }
  .pt-view-link:hover { text-decoration: underline; }
  .pt-dash { color: var(--muted); }

  .pt-doc-actions { display: flex; gap: 6px; }
  .pt-doc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 26px;
    padding: 0 8px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    border-radius: 5px;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .pt-doc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .pt-doc-btn-msds { color: var(--accent); border-color: var(--accent); }
  .pt-doc-btn-msds:hover:not(:disabled) { background: var(--surface2); }
  .pt-doc-btn-coa { color: var(--good); border-color: var(--good); }
  .pt-doc-btn-coa:hover:not(:disabled) { background: var(--surface-green); }

  .pt-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
  }
  .pt-badge.good { color: var(--good); background: var(--surface-green); }
  .pt-badge.bad { color: var(--bad); background: #fdecea; }

  .pt-customer-count-btn {
    background: var(--surface2);
    color: var(--accent);
    border: 1px solid var(--accent-dim, var(--border));
    border-radius: 5px;
    padding: 3px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
  }
  .pt-customer-count-btn:hover { background: var(--surface); text-decoration: underline; }

  .pt-cust-modal { font-family: 'IBM Plex Sans', sans-serif; color: var(--text); }
  .pt-cust-modal-title {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    font-size: 16px;
  }
  .pt-cust-modal-subtitle {
    font-size: 12.5px;
    color: var(--muted);
    margin-top: 2px;
  }
  .pt-cust-modal-loading, .pt-cust-modal-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 30px 0;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }
  .pt-cust-modal-error {
    color: var(--bad);
    font-size: 13px;
    padding: 12px 0;
  }
  .pt-cust-modal-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .pt-cust-modal-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 4px;
    border-bottom: 1px solid var(--border);
    font-size: 13.5px;
  }
  .pt-cust-modal-list li:last-child { border-bottom: none; }
  .pt-cust-modal-name { color: var(--text); }
  .pt-cust-modal-code {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    color: var(--muted);
    white-space: nowrap;
  }

  .pt-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .pt-pagination-info {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--muted);
  }
  .pt-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .pt-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .pt-page-btn.active { background: var(--accent); color: #ffffff; border-color: var(--accent); font-weight: 700; }
  .pt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .pt-page-ellipsis { color: var(--muted); font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
`;
