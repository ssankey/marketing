


import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Breadcrumb, Card, Container } from "react-bootstrap";
import CustomerBalanceTable from "../../components/page/customer-balance/table/CustomerBalanceTable";
import CustomerBalanceChart from "../../components/page/customer-balance/chart/CustomerBalanceChart";
import { debounce } from "lodash";

 

// ... (previous imports)

export default function CustomerBalancePage() {
  const router = useRouter();
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
    // Add new filter state
    salesPerson: null,
    category: null,
    product: null
  });

  // Combined data fetch effect
  useEffect(() => {
    fetchCustomerData();
    fetchChartData();
  }, [currentPage, filters]);

  const fetchCustomerData = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        queryType: 'deliveries',
        page: currentPage,
        search: filters.searchTerm,
        status: filters.statusFilter,
        fromDate: filters.fromDate || "",
        toDate: filters.toDate || "",
        sortField: filters.sortField,
        sortDir: filters.sortDirection
      });

      const response = await fetch(`/api/dashboard/customers-balances?${params}`);
      if (!response.ok) throw new Error("Failed to fetch customer balances");

      const data = await response.json();
      const totalCount = response.headers.get('X-Total-Count');
      
      setCustomerData(data || []);
      setTotalItems(totalCount ? parseInt(totalCount) : data.length);
      setTotalPages(Math.ceil((totalCount ? parseInt(totalCount) : data.length) / 20));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const fetchChartData = async () => {
  //   try {
  //     setIsChartLoading(true);
      
  //     // Include the same filters for chart data
  //     const params = new URLSearchParams({
  //       queryType: 'chart',
  //       search: filters.searchTerm,
  //       status: filters.statusFilter,
  //       fromDate: filters.fromDate || "",
  //       toDate: filters.toDate || ""
  //     });

  //     const response = await fetch(`/api/dashboard/customers-balances?${params}`);
  //     if (!response.ok) throw new Error("Failed to fetch chart data");
      
  //     const data = await response.json();
  //     setChartData(data || []);
  //   } catch (error) {
  //     console.error("Error fetching chart data:", error);
  //   } finally {
  //     setIsChartLoading(false);
  //   }
  // };
  const fetchChartData = async () => {
  try {
    setIsChartLoading(true);
    
    // Include the same filters for chart data
    const params = new URLSearchParams({
      queryType: 'chart',
      search: filters.searchTerm,
      status: filters.statusFilter,
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      // Add the new filter params
      slpCode: filters.salesPerson?.value || "",
      itmsGrpCod: filters.category?.value || "",
      itemCode: filters.product?.value || ""
    });

    const response = await fetch(`/api/dashboard/customers-balances?${params}`);
    if (!response.ok) throw new Error("Failed to fetch chart data");
    
    const data = await response.json();
    setChartData(data || []);
  } catch (error) {
    console.error("Error fetching chart data:", error);
  } finally {
    setIsChartLoading(false);
  }
};

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (term) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({ ...prev, statusFilter: status }));
    setCurrentPage(1);
  };

  const handleDateFilterChange = ({ fromDate, toDate }) => {
    setFilters(prev => ({ ...prev, fromDate, toDate }));
    setCurrentPage(1);
  };

  const handleSort = (field, direction) => {
    setFilters(prev => ({ ...prev, sortField: field, sortDirection: direction }));
  };

  const handleReset = () => {
    setFilters({
      searchTerm: "",
      statusFilter: "all",
      fromDate: "",
      toDate: "",
      sortField: "SO Date",
      sortDirection: "desc"
    });
    setCurrentPage(1);
  };

  return (
    <Container className="mt-3">
      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-white">
          <h3 className="mb-0">Customer Balance Overview</h3>
        </Card.Header>
        <Card.Body>
          {/* <CustomerBalanceChart
            customerBalances={chartData} 
            isLoading={isChartLoading} 
          /> */}
          {/* <CustomerBalanceChart
              customerBalances={chartData}
              isLoading={isChartLoading}
              onFilterChange={(filterValues) => {
                setFilters((prev) => ({
                  ...prev,
                  salesPerson: filterValues.salesPerson || null,
                  category: filterValues.category || null,
                  product: filterValues.product || null,
                }));
                setCurrentPage(1);
              }}
            /> */}
            <CustomerBalanceChart
  customerBalances={chartData}
  isLoading={isChartLoading}
  onFilterChange={(filterValues) => {
    setFilters((prev) => ({
      ...prev,
      salesPerson: filterValues.salesPerson || null,
      category: filterValues.category || null,
      product: filterValues.product || null,
    }));
    setCurrentPage(1);
  }}
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
            totalPages={totalPages}
            isLoading={isLoading}
            currentPage={currentPage}
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