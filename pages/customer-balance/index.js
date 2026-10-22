
// pages/customer-balance/index.js

import { useState, useEffect, useCallback } from "react";
import { Card, Container, Row, Spinner } from "react-bootstrap";
import CustomerBalanceChart from "../../components/page/customer-balance/chart/CustomerBalanceChart";
import CustomerBalTable from "../../components/page/customer-balance/table/customer-bal-table";
import { useAuth } from "contexts/AuthContext";

import TokenCustomerAgingChart from "../../components/CustomerCharts/TokenCustomerAgingChart";

export default function CustomerBalancePage() {
  const { user } = useAuth();
  const userRole = user?.role;

  // One shared dataset for both the "Overdue Balances by Aging" chart and
  // the "Customer Balance Summary" table below it — they used to be two
  // separate fetches from two different, disagreeing data sources (the
  // chart read SAP's GL postings via JDT1, the table read OINV invoices
  // directly), so their totals could never be expected to match, and a
  // filter picked in the chart had no effect on the table at all. Now both
  // read the same (corrected — see getCustomerBalance) invoice-level query,
  // filtered server-side by whatever's picked in the chart's filter.
  const [balances, setBalances] = useState([]);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState(null);
  const [filters, setFilters] = useState({ salesPerson: null, category: null, customer: null });

  const [summaryPage, setSummaryPage] = useState(1);
  const pageSize = 15;

  const fetchBalances = useCallback(async () => {
    setIsBalanceLoading(true);
    setBalanceError(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters.salesPerson?.value) params.set("slpCode", filters.salesPerson.value);
      if (filters.customer?.value) params.set("cardCode", filters.customer.value);
      if (filters.category?.value) params.set("category", filters.category.value);

      const res = await fetch(`/api/customer-balance?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load customer balances");
      setBalances(json.invoices || []);
    } catch (e) {
      console.error(e);
      setBalanceError(e.message);
      setBalances([]);
    } finally {
      setIsBalanceLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleFilterChange = (vals) => {
    setFilters(vals);
    setSummaryPage(1);
  };

  const handleSummaryPage = (p) => setSummaryPage(p);

  return (
    <Container fluid className="mt-3">
      {/* — Chart Section — */}
      {(userRole === "admin" || userRole === "salesperson") && (
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-white">
            <h3 className="mb-0">Customer Balance Overview</h3>
          </Card.Header>
          <Card.Body>
            {balanceError && <div className="text-danger mb-2">{balanceError}</div>}
            <CustomerBalanceChart
              invoices={balances}
              isLoading={isBalanceLoading}
              onFilterChange={handleFilterChange}
            />
          </Card.Body>
        </Card>
      )}

      {userRole === "contact_person" && (
        <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Customer Balance Report</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <TokenCustomerAgingChart />
              </Row>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* — Summary Table — */}
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
