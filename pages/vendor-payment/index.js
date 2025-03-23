import { useState, useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import DashboardLayout from "app/(dashboard)/layout";
import VendorPaymentsChart from "components/page/vendor-payment/chart/VendorPaymentsChart";
import VendorPaymentsTable from "../../components/VendorPaymentsTable";

export default function VendorPaymentPage() {
  const [vendorPayments, setVendorPayments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortField, setSortField] = useState("AR Invoice Date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Initial data fetch
  useEffect(() => {
    fetchVendorPayments();
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
    sortField,
    sortDirection
  ]);

  const fetchVendorPayments = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        status: statusFilter,
        fromDate: fromDate || "",
        toDate: toDate || "",
        sortField,
        sortDir: sortDirection
      });

      const response = await fetch(`/api/dashboard/vendors-balances?${params}`);

      if (!response.ok) throw new Error("Failed to fetch vendor payments");

      const data = await response.json();
      const totalCount = response.headers.get('X-Total-Count');
      setVendorPayments(data || []);
      setTotalItems(totalCount ? parseInt(totalCount) : data.length);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
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
    setSortField("AR Invoice Date");
    setSortDirection("desc");
    setCurrentPage(1);
  };

  return (
    <Container className="mt-3">
      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-white">
          <h3 className="mb-0">Vendor Payment Overview</h3>
        </Card.Header>
        <Card.Body>
          <VendorPaymentsChart vendorPayments={vendorPayments} />
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h3 className="mb-0">Vendor Payment Details</h3>
        </Card.Header>
        <Card.Body>
          <VendorPaymentsTable
            vendorPayments={vendorPayments}
            totalItems={totalItems}
            isLoading={isLoading}
            status={statusFilter}
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