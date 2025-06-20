
// pages/customer-balance/index.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, Container, Spinner } from "react-bootstrap";
import CustomerBalanceTable from "../../components/page/customer-balance/table/CustomerBalanceTable";
import CustomerBalanceChart from "../../components/page/customer-balance/chart/CustomerBalanceChart";
import CustomerBalTable from "../../components/page/customer-balance/table/customer-bal-table";
import { formatDate } from "utils/formatDate";
import { useAuth } from "contexts/AuthContext";


export default function CustomerBalancePage() {
  const router = useRouter();
  const { user } = useAuth();
const userRole = user?.role;



  // —— State for Filters, Chart & Details Table —— //
  const [customerData, setCustomerData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    searchTerm: "",
    statusFilter: "all",
    fromDate: "",
    toDate: "",
    sortField: "SO Date",
    sortDirection: "desc",
    salesPerson: null,
    category: null,
    product: null,
  });

  // —— State for Summary Table —— //
  const [balances, setBalances] = useState([]);
  const [summaryPage, setSummaryPage] = useState(1);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const pageSize = 10;

  // Fetch chart & details whenever filters or currentPage changes
  useEffect(() => {
    fetchCustomerData();
    fetchChartData();
  }, [currentPage, filters]);

  // Fetch the summary invoices once, then paginate in-memory
  // useEffect(() => {
  //   const fetchAllBalances = async () => {
  //     setIsBalanceLoading(true);
  //     try {
  //       const res = await fetch("/api/customer-balance");
  //       const json = await res.json();
  //       setBalances(json.invoices || []);
  //       setSummaryTotal(json.totalItems || 0);
  //     } catch (e) {
  //       console.error(e);
  //       setBalances([]);
  //       setSummaryTotal(0);
  //     } finally {
  //       setIsBalanceLoading(false);
  //     }
  //   };
  //   fetchAllBalances();
  // }, []);
  useEffect(() => {
  const fetchAllBalances = async () => {
    setIsBalanceLoading(true);
    try {
      const token = localStorage.getItem("token"); // ✅ Add this
      const res = await fetch("/api/customer-balance", {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Add this
        },
      });
      const json = await res.json();
      setBalances(json.invoices || []);
      setSummaryTotal(json.totalItems || 0);
    } catch (e) {
      console.error(e);
      setBalances([]);
      setSummaryTotal(0);
    } finally {
      setIsBalanceLoading(false);
    }
  };
  fetchAllBalances();
}, []);


  // —— API calls —— //
  const fetchCustomerData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        queryType: "deliveries",
        page: currentPage,
        search: filters.searchTerm,
        status: filters.statusFilter,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortField: filters.sortField,
        sortDir: filters.sortDirection,
        slpCode: filters.salesPerson?.value || "",
        itmsGrpCod: filters.category?.value || "",
        itemCode: filters.product?.value || "",
        cardCode: filters.customer?.value || "",
      });
      const res = await fetch(`/api/dashboard/customers-balances?${params}`);
      const data = await res.json();
      const total = parseInt(res.headers.get("X-Total-Count") || data.length);
      setCustomerData(data);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / 20));
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChartData = async () => {
    setIsChartLoading(true);
    try {
      const params = new URLSearchParams({
        queryType: "chart",
        search: filters.searchTerm,
        status: filters.statusFilter,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        slpCode: filters.salesPerson?.value || "",
        itmsGrpCod: filters.category?.value || "",
        itemCode: filters.product?.value || "",
        cardCode: filters.customer?.value || "",
      });
      const res = await fetch(`/api/dashboard/customers-balances?${params}`);
      const data = await res.json();
      setChartData(data);
    } catch (e) {
      console.error("Chart fetch error:", e);
    } finally {
      setIsChartLoading(false);
    }
  };

  // —— Export to Excel —— //
  const handleExcelDownload = async () => {
    try {
      const params = new URLSearchParams({
        queryType: "deliveries",
        getAll: "true",
        search: filters.searchTerm,
        status: filters.statusFilter,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortField: filters.sortField,
        sortDir: filters.sortDirection,
        slpCode: filters.salesPerson?.value || "",
        itmsGrpCod: filters.category?.value || "",
        itemCode: filters.product?.value || "",
      });
      const res = await fetch(`/api/dashboard/customers-balances?${params}`);
      const fullData = await res.json();
      const formatted = fullData.map((item) => ({
        "Inv No.": item["Invoice No."],
        "AR Invoice Date": formatDate(item["AR Invoice Date"]),
        "SO#": item["SO#"],
        "SO Date": formatDate(item["SO Date"]),
        "Customer/Vendor Name": item["Customer Name"],
        "Contact Person": item["Contact Person"],
        "Customer Ref no": item["BP Reference No."],
        "Invoice Total": item["Invoice Total"],
        "Balance Due": item["Balance Due"],
        Country: item["Country"],
        State: item["State"],
        "Airline Name": item["AirlineName"] || "N/A",
        "Tracking no": item["TrackingNo"] || "N/A",
        "Delivery Date": formatDate(item["Delivery Date"]),
        "SO to Delivery Days": item["SOToDeliveryDays"] || "N/A",
        "Overdue Days": item["Overdue Days"],
        "Payment Group": item["Payment Terms"],
      }));
      const { default: downloadExcel } = await import("utils/exporttoexcel");
      downloadExcel(formatted, "Customer_Balance_Report");
    } catch (e) {
      console.error("Excel export failed:", e);
      alert("Failed to export Excel. Please try again.");
    }
  };

  // —— Filter & Pagination Handlers —— //
  const handlePageChange = (p) => setCurrentPage(p);
  const handleSummaryPage = (p) => setSummaryPage(p);
  const handleSearch = (term) => {
    setFilters((f) => ({ ...f, searchTerm: term }));
    setCurrentPage(1);
  };
  const handleStatusChange = (status) => {
    setFilters((f) => ({ ...f, statusFilter: status }));
    setCurrentPage(1);
  };
  const handleDateFilterChange = ({ fromDate, toDate }) => {
    setFilters((f) => ({ ...f, fromDate, toDate }));
    setCurrentPage(1);
  };
  const handleSort = (field, dir) => {
    setFilters((f) => ({ ...f, sortField: field, sortDirection: dir }));
  };
  const handleReset = () => {
    setFilters({
      searchTerm: "",
      statusFilter: "all",
      fromDate: "",
      toDate: "",
      sortField: "SO Date",
      sortDirection: "desc",
      salesPerson: null,
      category: null,
      product: null,
    });
    setCurrentPage(1);
  };

  return (
    <Container className="mt-3">
      {/* — Chart Section — */}
      {(userRole === "admin" || userRole === "salesperson") && (
      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-white">
          <h3 className="mb-0">Customer Balance Overview</h3>
        </Card.Header>
        <Card.Body>
          <CustomerBalanceChart
            customerBalances={chartData}
            isLoading={isChartLoading}
            onFilterChange={(vals) => {
              setFilters((f) => ({
                ...f,
                salesPerson: vals.salesPerson,
                category: vals.category,
                product: vals.product,
                customer: vals.customer,
              }));
              setCurrentPage(1);
            }}
          />
        </Card.Body>
      </Card>
    )}



      {/* — New Summary Table (TenStack) — */}
      <Card className="mt-3 shadow-sm">
        <Card.Header className="bg-white">
          <h3 className="mb-0">Customer Balance Summary</h3>
        </Card.Header>
        <Card.Body>
          {isBalanceLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p>Loading customer balances…</p>
            </div>
          ) : (
            <CustomerBalTable
              data={balances}
              page={summaryPage}
              onPageChange={handleSummaryPage}
              pageSize={pageSize}
            />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
