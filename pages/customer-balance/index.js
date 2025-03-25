import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Breadcrumb, Card, Container } from "react-bootstrap";
import CustomerBalanceTable from "../../components/page/customer-balance/table/CustomerBalanceTable";
import CustomerBalanceChart from "../../components/page/customer-balance/chart/CustomerBalanceChart";

export default function CustomerBalancePage() {
  const router = useRouter();
  const [customerData, setCustomerData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortField, setSortField] = useState("AR Invoice Date"); // Updated default sort field
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Initial data fetch
  useEffect(() => {
    fetchCustomerData();
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
    sortField,
    sortDirection
  ]);

  const fetchCustomerData = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: statusFilter,
        fromDate: fromDate || "",
        toDate: toDate || "",
        sortField,
        sortDir: sortDirection
      });

      // Updated API endpoint to match the file name
      const response = await fetch(`/api/dashboard/customer-balances?${params}`);

      if (!response.ok) throw new Error("Failed to fetch customer balances");

      const data = await response.json();
      const totalCount = response.headers.get('X-Total-Count');
      setCustomerData(data || []);
      setTotalItems(totalCount ? parseInt(totalCount) : data.length);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Additional balances fetch (for chart)
  const [balanceData, setBalanceData] = useState([]);
  const [isChartLoading, setIsChartLoading] = useState(true);

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    try {
      setIsChartLoading(true);
      // Updated API endpoint and removed queryType since the updated API doesn't use it
      const response = await fetch('/api/dashboard/customer-balances');
      if (!response.ok) throw new Error("Failed to fetch balance data");
      
      const data = await response.json();
      setBalanceData(data || []);
    } catch (error) {
      console.error("Error fetching balance data:", error);
    } finally {
      setIsChartLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateFilterChange = ({ fromDate, toDate }) => {
    setFromDate(fromDate);
    setToDate(toDate);
    setCurrentPage(1);
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setSortField("AR Invoice Date"); // Updated to match API default
    setSortDirection("desc");
    setCurrentPage(1);
  };

  const handleBreadcrumbClick = (path) => {
    router.push(path);
  };

  return (
    <Container className="mt-3">
      {/* <Breadcrumb>
        <Breadcrumb.Item
          active={router.pathname === "/customer-balance"}
          onClick={() => handleBreadcrumbClick("/customer-balance")}
        >
          Customer Balance
        </Breadcrumb.Item>
        <Breadcrumb.Item
          active={router.pathname === "/customer-balance/detail"}
          onClick={() => handleBreadcrumbClick("/customer-balance/detail")}
        >
          Details
        </Breadcrumb.Item>
      </Breadcrumb> */}

      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-white">
          <h3 className="mb-0">Customer Balance Overview</h3>
        </Card.Header>
        <Card.Body>
          <CustomerBalanceChart
            customerBalances={balanceData} 
            isLoading={isChartLoading} 
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h3 className="mb-0">Customer Balance Details</h3>
        </Card.Header>
        <Card.Body>
          <CustomerBalanceTable
            balances={customerData}
            totalItems={totalItems}
            isLoading={isLoading}
            currentPage={currentPage}
            searchTerm={searchTerm}
            status={statusFilter}
            fromDate={fromDate}
            toDate={toDate}
            sortField={sortField}
            sortDirection={sortDirection}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onStatusChange={handleStatusChange}
            onDateFilterChange={handleDateFilterChange}
            onSort={handleSort}
            onReset={handleReset}
          />
        </Card.Body>
      </Card>
    </Container>
  );
}