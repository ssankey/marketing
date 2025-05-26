
// import { useState, useEffect } from "react";
// import { useRouter } from "next/router";
// import { Card, Container, Spinner } from "react-bootstrap";
// import CustomerBalanceTable from "../../components/page/customer-balance/table/CustomerBalanceTable";
// import CustomerBalanceChart from "../../components/page/customer-balance/chart/CustomerBalanceChart";
// import CustomerBalTable from "../../components/page/customer-balance/table/customer-bal-table";

// import { formatDate } from "utils/formatDate";

// export default function CustomerBalancePage() {
//   const router = useRouter();

//   // State for storing fetched data
//   const [customerData, setCustomerData] = useState([]);
//   const [chartData, setChartData] = useState([]);
//   const [totalItems, setTotalItems] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isChartLoading, setIsChartLoading] = useState(true);

//   const [Balances, setBalances] = useState([]);
//   const [page, setPage] = useState(1);
//   const [SumPages, setSumPages] = useState(1);
//   const [isBalanceLoading, setIsBalanceLoading] = useState(true); // Add loading state
//   const pageSize = 10;

//   // Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);

//   // Filters for table and chart
//   const [filters, setFilters] = useState({
//     searchTerm: "",
//     statusFilter: "all",
//     fromDate: "",
//     toDate: "",
//     sortField: "SO Date",
//     sortDirection: "desc",
//     salesPerson: null,
//     category: null,
//     product: null,
//   });

//   // Fetch both table and chart data whenever filters or page changes
//   useEffect(() => {
//     fetchCustomerData();
//     fetchChartData();
//   }, [currentPage, filters]);

//   const fetchBalances = async (currentPage) => {
//     try {
//       setIsBalanceLoading(true);
//       console.log(`Fetching page ${currentPage} with pageSize ${pageSize}`);

//       const res = await fetch(
//         `/api/customer-balance?page=${currentPage}&pageSize=${pageSize}`
//       );

//       if (!res.ok) {
//         throw new Error(`HTTP error! status: ${res.status}`);
//       }

//       const result = await res.json();
//       console.log("API Response:", result);

//       setBalances(result.invoices || []);
//       setSumPages(Math.ceil((result.totalItems || 0) / pageSize));
//     } catch (error) {
//       console.error("Error fetching balances:", error);
//       setBalances([]);
//       setSumPages(1);
//     } finally {
//       setIsBalanceLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBalances(page);
//   }, [page]);

//   // Fetch paginated table data
//   const fetchCustomerData = async () => {
//     try {
//       setIsLoading(true);

//       const params = new URLSearchParams({
//         queryType: "deliveries",
//         page: currentPage,
//         search: filters.searchTerm,
//         status: filters.statusFilter,
//         fromDate: filters.fromDate || "",
//         toDate: filters.toDate || "",
//         sortField: filters.sortField,
//         sortDir: filters.sortDirection,
//         slpCode: filters.salesPerson?.value || "",
//         itmsGrpCod: filters.category?.value || "",
//         itemCode: filters.product?.value || "",
//         cardCode: filters.customer?.value || "",
//       });

//       const response = await fetch(
//         `/api/dashboard/customers-balances?${params}`
//       );
//       if (!response.ok) throw new Error("Failed to fetch customer balances");

//       const data = await response.json();
//       const totalCount = response.headers.get("X-Total-Count");

//       setCustomerData(data || []);
//       setTotalItems(totalCount ? parseInt(totalCount) : data.length);
//       setTotalPages(
//         Math.ceil((totalCount ? parseInt(totalCount) : data.length) / 20)
//       );
//     } catch (error) {
//       console.error("Fetch error:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch chart summary data
//   const fetchChartData = async () => {
//     try {
//       setIsChartLoading(true);

//       const params = new URLSearchParams({
//         queryType: "chart",
//         search: filters.searchTerm,
//         status: filters.statusFilter,
//         fromDate: filters.fromDate || "",
//         toDate: filters.toDate || "",
//         slpCode: filters.salesPerson?.value || "",
//         itmsGrpCod: filters.category?.value || "",
//         itemCode: filters.product?.value || "",
//         cardCode: filters.customer?.value || "",
//       });

//       const response = await fetch(
//         `/api/dashboard/customers-balances?${params}`
//       );
//       if (!response.ok) throw new Error("Failed to fetch chart data");

//       const data = await response.json();
//       setChartData(data || []);
//     } catch (error) {
//       console.error("Error fetching chart data:", error);
//     } finally {
//       setIsChartLoading(false);
//     }
//   };

//   // Handle Excel export of full filtered data
//   const handleExcelDownload = async () => {
//     try {
//       const params = new URLSearchParams({
//         queryType: "deliveries",
//         getAll: "true",
//         search: filters.searchTerm,
//         status: filters.statusFilter,
//         fromDate: filters.fromDate || "",
//         toDate: filters.toDate || "",
//         sortField: filters.sortField,
//         sortDir: filters.sortDirection,
//         slpCode: filters.salesPerson?.value || "",
//         itmsGrpCod: filters.category?.value || "",
//         itemCode: filters.product?.value || "",
//       });

//       const response = await fetch(
//         `/api/dashboard/customers-balances?${params}`
//       );
//       const fullData = await response.json();

//       const formattedData = fullData.map((item) => ({
//         "Inv No.": item["Invoice No."],
//         "AR Invoice Date": formatDate(item["AR Invoice Date"]),
//         "SO#": item["SO#"],
//         "SO Date": formatDate(item["SO Date"]),
//         "Customer/Vendor Name": item["Customer Name"],
//         "Contact Person": item["Contact Person"],
//         "Customer Ref no": item["BP Reference No."],
//         "Invoice Total": item["Invoice Total"],
//         "Balance Due": item["Balance Due"],
//         Country: item["Country"],
//         State: item["State"],
//         "Airline Name": item["AirlineName"] || "N/A",
//         "Tracking no": item["TrackingNo"] || "N/A",
//         "Delivery Date": formatDate(item["Delivery Date"]),
//         "SO to Delivery Days": item["SOToDeliveryDays"] || "N/A",
//         "Overdue Days": item["Overdue Days"],
//         "Payment Group": item["Payment Terms"],
//       }));

//       const { default: downloadExcel } = await import("utils/exporttoexcel");
//       downloadExcel(formattedData, "Customer_Balance_Report");
//     } catch (error) {
//       console.error("Excel export failed:", error);
//       alert("Failed to export Excel. Please try again.");
//     }
//   };

//   // Handlers for filter and pagination updates
//   const handlePageChange = (newPage) => setCurrentPage(newPage);
//   const handleSearch = (term) => {
//     setFilters((prev) => ({ ...prev, searchTerm: term }));
//     setCurrentPage(1);
//   };
//   const handleStatusChange = (status) => {
//     setFilters((prev) => ({ ...prev, statusFilter: status }));
//     setCurrentPage(1);
//   };
//   const handleDateFilterChange = ({ fromDate, toDate }) => {
//     setFilters((prev) => ({ ...prev, fromDate, toDate }));
//     setCurrentPage(1);
//   };
//   const handleSort = (field, direction) => {
//     setFilters((prev) => ({
//       ...prev,
//       sortField: field,
//       sortDirection: direction,
//     }));
//   };
//   const handleReset = () => {
//     setFilters({
//       searchTerm: "",
//       statusFilter: "all",
//       fromDate: "",
//       toDate: "",
//       sortField: "SO Date",
//       sortDirection: "desc",
//       salesPerson: null,
//       category: null,
//       product: null,
//     });
//     setCurrentPage(1);
//   };

//   return (
//     <Container className="mt-3">
//       {/* Chart Section */}
//       <Card className="mb-3 shadow-sm">
//         <Card.Header className="bg-white">
//           <h3 className="mb-0">Customer Balance Overview</h3>
//         </Card.Header>
//         <Card.Body>
//           <CustomerBalanceChart
//             customerBalances={chartData}
//             isLoading={isChartLoading}
//             onFilterChange={(filterValues) => {
//               setFilters((prev) => ({
//                 ...prev,
//                 salesPerson: filterValues.salesPerson || null,
//                 category: filterValues.category || null,
//                 product: filterValues.product || null,
//                 customer: filterValues.customer || null,
//               }));
//               setCurrentPage(1);
//             }}
//           />
//         </Card.Body>
//       </Card>

//       {/* Table Section */}
//       <Card className="shadow-sm">
//         <Card.Header className="bg-white d-flex justify-content-between align-items-center">
//           <h3 className="mb-0">Customer Balance Details</h3>
//         </Card.Header>
//         <Card.Body>
//           <CustomerBalanceTable
//             balances={customerData}
//             totalItems={totalItems}
//             totalPages={totalPages}
//             isLoading={isLoading}
//             currentPage={currentPage}
//             onPageChange={handlePageChange}
//             onSearch={handleSearch}
//             onStatusChange={handleStatusChange}
//             onDateFilterChange={handleDateFilterChange}
//             onSort={handleSort}
//             onReset={handleReset}
//             onExcelDownload={handleExcelDownload}
//           />
//         </Card.Body>
//       </Card>

//       {/* New Customer Balance Table */}
//       <Card className="mt-3 shadow-sm">
//         <Card.Header className="bg-white">
//           <h3 className="mb-0">Customer Balance Summary</h3>
//         </Card.Header>
//         <Card.Body>
//           {isBalanceLoading ? (
//             <div className="text-center">
//               <Spinner animation="border" />
//               <p>Loading customer balances...</p>
//             </div>
//           ) : (
//             <CustomerBalTable
//               data={Balances}
//               page={page}
//               SumPages={SumPages}
//               onPageChange={setPage}
//             />
//           )}
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }

// pages/customer-balance/index.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, Container, Spinner } from "react-bootstrap";
import CustomerBalanceTable from "../../components/page/customer-balance/table/CustomerBalanceTable";
import CustomerBalanceChart from "../../components/page/customer-balance/chart/CustomerBalanceChart";
import CustomerBalTable from "../../components/page/customer-balance/table/customer-bal-table";
import { formatDate } from "utils/formatDate";

export default function CustomerBalancePage() {
  const router = useRouter();

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
  useEffect(() => {
    const fetchAllBalances = async () => {
      setIsBalanceLoading(true);
      try {
        const res = await fetch("/api/customer-balance");
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

      {/* — Details Table Section — */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Customer Balance Details</h3>
        </Card.Header>
        <Card.Body>
          <CustomerBalanceTable
            balances={customerData}
            totalItems={totalItems}
            totalPages={totalPages}
            isLoading={isLoading}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onStatusChange={handleStatusChange}
            onDateFilterChange={handleDateFilterChange}
            onSort={handleSort}
            onReset={handleReset}
            onExcelDownload={handleExcelDownload}
          />
        </Card.Body>
      </Card>

      {/* — New Summary Table (TenStack) — */}
      {/* <Card className="mt-3 shadow-sm">
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
      </Card> */}
    </Container>
  );
}
