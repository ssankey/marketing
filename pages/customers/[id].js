//page/customers/[id].js
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Dropdown,
} from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import PurchasesAmountChart from "../../components/CustomerCharts/purchasevsamount";
import AllOutstandingTable from "../../components/CustomerCharts/alloutstandingtable";

import CustomerOutstandingTable from "../../components/CustomerCharts/outstandingtable";
import SalesTable from "../../components/CustomerCharts/salestable";
import SalesPieChart from "../../components/CustomerCharts/SalesPieChart";
import downloadExcel from "utils/exporttoexcel";
import TablePagination from "components/TablePagination";
import DeliveryPerformanceChart from "../../components/CustomerCharts/ordertodelievery";
import { generatePDF, handlePrintPDF } from "utils/pdfGenerator";
import MonthlyCategorySalesChart from "components/CustomerCharts/SalesByCategoryWrapper";
import CustomerAgingChart from "../../components/CustomerCharts/customeragingreport";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";
import CategorySalesChart from "../../components/CustomerCharts/CategorySalesChart";
import CollapsibleSection from "components/page/CollapsibleSection";
import CustomerOrdersLineTable from "../../components/CustomerCharts/CustomerOrdersLineTable";
import CustomerInvoicesTable from "../../components/CustomerCharts/CustomerInvoicesTable";

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

const fetchAllCustomerOutstanding = async () => {
  const res = await fetch(
    `/api/customers/${customer.CustomerCode}/outstanding?getAll=true`
  );
  const data = await res.json();
  return data;
};

export default function CustomerDetails({
  customer,
  purchaseData,
  TopQuotationData,
  TopOrderData,
  TopInvoiceData,
  salesByCategoryData,
  initialOutstandings,
  initialTotalOutstandings,
}) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isExcelLoading, setIsExcelLoading] = useState(false);
  const [isMailSending, setIsMailSending] = useState(false);

  const ITEMS_PER_PAGE = 5; // Set this at the top of your component
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [outstandingFilter, setOutstandingFilter] = useState("Payment Pending");

  const [outstandings, setOutstandings] = useState(initialOutstandings || []);
  const [totalOutstandings, setTotalOutstandings] = useState(
    initialTotalOutstandings || 0
  );
  const [isLoadingOutstandings, setIsLoadingOutstandings] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
  });

  // Jump-to-another-customer search (mirrors pages/products/[id].js's search box)
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [jumpSuggestions, setJumpSuggestions] = useState([]);
  const [showJumpSuggestions, setShowJumpSuggestions] = useState(false);
  const jumpSearchBoxRef = useRef(null);
  const jumpSuggestionTimeoutRef = useRef(null);

  useEffect(() => {
    if (customer) setSearchQuery(customer.CustomerCode);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (jumpSearchBoxRef.current && !jumpSearchBoxRef.current.contains(event.target)) {
        setShowJumpSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (jumpSuggestionTimeoutRef.current) clearTimeout(jumpSuggestionTimeoutRef.current);

    const term = searchQuery.trim();
    if (!term) {
      setJumpSuggestions([]);
      return;
    }

    jumpSuggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ page: 1, itemsPerPage: 8, search: term, sortField: "CustomerName", sortDir: "asc" });
        const res = await fetch(`/api/customers?${query.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setJumpSuggestions((data.customers || []).slice(0, 8));
      } catch (err) {
        console.error("Error fetching customer suggestions:", err);
      }
    }, 300);

    return () => clearTimeout(jumpSuggestionTimeoutRef.current);
  }, [searchQuery]);

  const handleJumpSearch = async (code) => {
    const trimmed = (code || "").trim();
    if (!trimmed) {
      setSearchError("Please enter a customer code or name");
      return;
    }
    setIsSearching(true);
    setSearchError("");
    setShowJumpSuggestions(false);
    try {
      await router.push(`/customers/${encodeURIComponent(trimmed)}`);
    } catch (err) {
      console.error("Jump-to-customer navigation failed:", err);
      setSearchError("Customer not found. Please check the code and try again.");
      setIsSearching(false);
    }
  };

  const handleJumpSearchSubmit = (e) => {
    e.preventDefault();
    handleJumpSearch(searchQuery);
  };

  const handleJumpSuggestionClick = (code) => {
    setShowJumpSuggestions(false);
    setSearchQuery(code);
    handleJumpSearch(code);
  };

    const handleSelectAll = async () => {
      if (!isAllSelected) {
        try {
          // Include your filterType if needed:
          const queryParams = new URLSearchParams({
            getAll: "true",
            filterType: outstandingFilter,
          });
          const res = await fetch(
            `/api/customers/${customer.CustomerCode}/outstanding?${queryParams}`
          );
          if (!res.ok) {
            throw new Error(`Fetch failed: ${res.statusText}`);
          }

          // 1) Pull the array out of the JSON
          const { customerOutstandings: allRows } = await res.json();

          // 2) Map to invoice numbers
          const allInvoiceNos = allRows.map((item) => item["Invoice No."]);

          // 3) Select them all
          setSelectedRows(allInvoiceNos);
          // NO need to manually setIsAllSelected — your useEffect will pick this up
        } catch (error) {
          console.error("Failed to select all invoices:", error);
        }
      } else {
        // unselect everything
        setSelectedRows([]);
      }
    };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchOutstandings(newPage, filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchOutstandings(1, newFilters);
  };


  const handleExcelDownload = async (e) => {
  e?.preventDefault?.();
  try {
    setIsExcelLoading(true);
    // Fetch ALL records without pagination with the current filter
    const queryParams = new URLSearchParams({
      getAll: "true",
      filterType: outstandingFilter, // Include current filter
    });
    const res = await fetch(
      `/api/customers/${
        customer.CustomerCode
      }/outstanding?${queryParams.toString()}`
    );
    const { customerOutstandings } = await res.json();

    // Helper function to convert formatted number string to actual number
    const parseFormattedNumber = (formattedNumber) => {
      if (!formattedNumber) return 0;
      // Remove commas and convert to number
      return parseFloat(formattedNumber.toString().replace(/,/g, '')) || 0;
    };
  
    // Map columns exactly as they appear in the UI (from your columns array)
    const formattedData = customerOutstandings.map((item) => ({
      "Invoice No.": item["Invoice No."],
      "Invoice Date": formatDate(item["AR Invoice Date"]),
      "SO#": item["SO#"],
      "SO Date": formatDate(item["SO Date"]),
      "Customer Name": item["Customer Name"],
      "Contact Person": item["Contact Person"],
      "SO Customer Ref. No": item["CustomerPONo"],
      "Invoice Total": parseFormattedNumber(item["Invoice Total"]), // Convert to number
      "Balance Due": parseFormattedNumber(item["Balance Due"]), // Convert to number
      Country: item["Country"],
      State: item["State"],
      "Overdue Days": item["Overdue Days"],
      "Payment Terms": item["Payment Terms"],
      "Tracking no": item["Tracking no"],
      "Dispatch Date": formatDate(item["Dispatch Date"]),
      "Sales Person": item["SalesEmployee"],
    }));
    downloadExcel(
      formattedData,
      `Customer_Outstanding_${outstandingFilter.replace(" ", "_")}`
    );
  } catch (error) {
    console.error("Excel export failed:", error);
    alert("Failed to export Excel. Please try again.");
  } finally {
    setIsExcelLoading(false);
  }
};

  
  // Updated handleMailSend function
  const handleMailSend = async () => {
    if (outstandingFilter === "Payment Done") {
      alert("Cannot send mail for 'Payment Done' records.");
      return;
    }

    if (selectedRows.length === 0) {
      alert("Please select at least one invoice to mail");
      return;
    }

    try {
      // Fetch customer email
      const emailRes = await fetch(
        `/api/customers/${customer.CustomerCode}/email`
      );
      const { email } = await emailRes.json();

      if (!email) {

        alert("Customer email address not found");
        return;
      }

      // Fetch all data for selected invoice numbers
      const { customerOutstandings } = await fetchAllOutstandings();
      const selectedData = customerOutstandings.filter((item) =>
        selectedRows.includes(item["Invoice No."])
      );

      // Format currency
      function formatCurrency(amount) {
        if (amount === undefined || amount === null) return "N/A";
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0, // no decimals
        }).format(Math.round(amount));
      }

      // Sort selectedData in decreasing order of Overdue Days
      selectedData.sort((a, b) => {
        const aOverdue = parseInt(a["Overdue Days"]);
        const bOverdue = parseInt(b["Overdue Days"]);
        return (
          (isNaN(bOverdue) ? -Infinity : bOverdue) -
          (isNaN(aOverdue) ? -Infinity : aOverdue)
        );
      });

      
      const tableRows = selectedData
        .map((row) => {
          const overdueDays = parseInt(row["Overdue Days"]);
          return `
     <tr>
  <td style="text-align:center;">${row["Invoice No."] || "N/A"}</td>
  <td style="text-align:center;">${formatDate(row["AR Invoice Date"])}</td>
  
  <td style="text-align:center;">${row["Customer Name"] || "N/A"}</td>
  
  <td style="text-align:center;">${row["CustomerPONo"] || "N/A"}</td>
  <td style="text-align:center;">${formatNumberWithIndianCommas(row["Invoice Total"])}</td>
  <td style="text-align:center;">${formatNumberWithIndianCommas(row["Balance Due"])}</td>
  <td style="text-align: center;">${overdueDays > 0 ? overdueDays : ""}</td>
  <td style="text-align:center;">${row["Tracking no"] || "N/A"}</td>
  <td style="text-align:center;">${formatDate(row["Dispatch Date"])}</td>
  <td style="text-align:center;">${row["SalesEmployee"] || "N/A"}</td>
</tr>

    `;
        })
        .join("");

      const totalInvoiceAmount = selectedData.reduce(
        (sum, row) => sum + row["Invoice Total"] || 0,
        0
      );
      

    //   const totalBalanceDue = selectedData.reduce((sum, row) => {
    //     const overdue = row["Overdue Days"];
    //     if (!isNaN(overdue) && overdue > 0) {
    //       return sum + row["Balance Due"] ;
    //     }
    //     return formatNumberWithIndianCommas(Math.round(sum * 100) / 100);
    //   }, 0);

    //   const summaryLine = `
    //   <p>
    //     The <strong>total outstanding amount</strong> is <strong>₹${totalInvoiceAmount.toLocaleString("en-IN")}</strong>,
    //     out of which <strong>₹${totalBalanceDue.toLocaleString("en-IN")}</strong> is <strong>overdue for payment.</strong>
    //   </p>
    // `;
    const totalBalanceDueValue = selectedData.reduce((sum, row) => {
      const overdue = parseInt(row["Overdue Days"], 10) || 0;
      const balance = parseFloat(row["Balance Due"]) || 0;
      return sum + (overdue > 0 ? balance : 0);
    }, 0);

    // 2. Now format once, for display
    const formattedInvoiceAmount = totalInvoiceAmount.toLocaleString("en-IN");
    const formattedBalanceDueAmount =
      totalBalanceDueValue.toLocaleString("en-IN");

    // 3. Build your summary line
    const summaryLine = `
  <p>
    The <strong>total outstanding amount</strong> is 
    <strong>₹${formattedInvoiceAmount}</strong>,
    out of which 
    <strong>₹${formattedBalanceDueAmount}</strong> 
    is <strong>overdue for payment.</strong>
  </p>
`;

      const body = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>Dear Sir / Madam,</p>
  <p>Greetings of the day!</p>
  <p>Kindly find below the list of outstanding invoices currently showing as unpaid in our accounts.</p>
  <p>We request you to please verify whether all these invoices have been recorded in your books, 
     and arrange to make the payment for the due bills as per the agreed credit terms.</p>
  <p>
    <span style="color: red; text-decoration: underline;">
      If the payment has already been made, please disregard this message. Otherwise, 
      we would appreciate it if you could process the payment at your earliest convenience.
    </span>
  </p>
</div>

          
        ${summaryLine}
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
         <thead>
    <tr>
      <th>Invoice No.</th>
      <th>Invoice Date</th>
       
      <th>Customer Name</th>
     
      <th>SO Customer Ref. No</th>
      <th>Invoice Total</th>
      <th>Balance Due</th>
      <th>Overdue Days</th>
      <th>Tracking no</th>
      <th>Dispatch Date</th>
      <th>Sales Person</th>
    </tr>
  </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p>Looking forward to your confirmation.</p>
        <p>Regards,<br/>
           Shafique Khan<br/>

           Manager - Accounts<br/><br/>
           
           <strong>Website:www.densitypharmachem.com</strong><br/><br/>
           DENSITY PHARMACHEM PRIVATE LIMITED<br/><br/>
           Sy No 615/A & 624/2/1, Pudur Village<br/>
           Medchal-Malkajgiri District,<br/>
           Hyderabad, Telangana, India-501401<br/>
           Mobile : +91-9029298654<br/><br/>
           <strong>Bank Details</strong><br/>
           Name: Density Pharmachem Private Limited<br/>
           Bank Name: HDFC Bank Ltd<br/>
           Branch: Hyderguda<br/>
           Account Number: 99999989991174<br/>
           IFSC Code: HDFC0001996
        </p>
         <p style="color: red; font-weight: bold;">
    GST Number: 36AAKCD9426G1ZE<br/>
    MSME Number: UDYAM-TS-20-0101328
  </p>
      </div>

    `;

    const salesPersonEmail = selectedData[0]?.SalesEmployeeMail;
    if (!salesPersonEmail) throw new Error("No sales-person email available");
    // console.log("sales person email", salesPersonEmail);

     
      const mailRes = await fetch(`/api/email/base_mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "shafique@densitypharmachem.com",

          to: [email], // customer gets it
          
          cc: [salesPersonEmail, "gurpreet@densitypharmachem.com"],

          //  from: "prakash@densitypharmachem.com",
          //  to:"chandraprakashyadav1110@gmail.com",
             

          subject:
            "Request for Confirmation and Payment of Outstanding Invoices",
          body,
        }),
      });

      //  const mailRes = await fetch(`/api/email/base_mail`, {
      //    method: "POST",
      //    headers: { "Content-Type": "application/json" },
      //    body: JSON.stringify({
      //      from: "prakash@densitypharmachem.com",

      //      to: ["chandraprakashyadav1110@gmail.com"], // customer gets it
           

      //      subject:
      //        "Request for Confirmation and Payment of Outstanding Invoices",
      //      body,
      //    }),
      //  });

     
      

      const result = await mailRes.json();

      if (mailRes.ok) {
        alert("Email sent successfully");
      } else {
        alert(`Failed to send email: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error sending email. Please check console.");
    }
  };
  // Improved function to fetch all outstandings
  const fetchAllOutstandings = async () => {
    try {
      // No need for date filters if you want to remove them
      const queryParams = new URLSearchParams({
        getAll: "true",
        // Removed date filters
      });

      const res = await fetch(
        `/api/customers/${
          customer.CustomerCode
        }/outstanding?${queryParams.toString()}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error("Error fetching all outstandings:", error);
      return { customerOutstandings: [] };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    const visibleInvoiceNos = outstandings.map((item) => item["Invoice No."]);
    const allVisibleSelected = visibleInvoiceNos.every((invNo) =>
      selectedRows.includes(invNo)
    );
    setIsAllSelected(allVisibleSelected);
  }, [selectedRows, outstandings]);

  // Handle client-side auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle loading states
  if (router.isFallback || authLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="ms-3">
          {router.isFallback ? "Loading..." : "Checking authentication..."}
        </span>
      </Container>
    );
  }

  // Modify the fetchOutstandings function to pass filterType
  const fetchOutstandings = async (
    page = 1,
    filters = {},
    filterType = outstandingFilter
  ) => {
    setIsLoadingOutstandings(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        itemsPerPage: ITEMS_PER_PAGE,
        fromDate: filters.fromDate || "",
        toDate: filters.toDate || "",
        filterType, // Add this line to pass the filter type
      });

      const res = await fetch(
        `/api/customers/${
          customer.CustomerCode
        }/outstanding?${queryParams.toString()}`
      );
      const data = await res.json();

      setOutstandings(data.customerOutstandings);
      setTotalOutstandings(data.totalItems);
    } catch (error) {
      console.error("Error fetching outstandings:", error);
    } finally {
      setIsLoadingOutstandings(false);
    }
  };

 
  const handleFilterSelect = (eventKey) => {
    setOutstandingFilter(eventKey); // update the filter in state

    // Pass eventKey directly (not stale outstandingFilter)
    fetchOutstandings(1, filters, eventKey);
  };

  // Handle unauthorized access
  if (!isAuthenticated) {
    return null;
  }
  // console.log("PurchasesAmountChart:", PurchasesAmountChart);

  // Handle missing customer data
  if (!customer) {
    return (
       
      <Container className="mt-5">
        <Card>
          <Card.Body>
            <div className="alert alert-warning mb-0">
              Customer not found or an error occurred while loading customer
              data.
            </div>
            <button
              className="btn btn-secondary mt-3"
              onClick={() => router.back()}
            >
              Back to Customers
            </button>
           

          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <div id="content-to-print" className="cd">
      <style>{PAGE_STYLES}</style>
      <div className="cd-card">
        <button className="cd-back-btn" onClick={() => router.back()}>
          ← Back to Customers
        </button>

        <div className="cd-header">
          <h1>{customer?.CustomerName || "N/A"}</h1>
          <p className="cd-header-desc">{customer?.CustomerCode}</p>
        </div>

        {/* Jump to another customer */}
        <div className="cd-search-card">
          <form onSubmit={handleJumpSearchSubmit} className="cd-search-form">
            <div className="cd-field" style={{ flex: 1, minWidth: 260 }} ref={jumpSearchBoxRef}>
              <label>Jump to another customer</label>
              <input
                className="cd-input"
                style={{ width: "100%" }}
                type="text"
                placeholder="Enter Customer Code or Name…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowJumpSuggestions(true); }}
                onFocus={() => setShowJumpSuggestions(true)}
                disabled={isSearching}
              />
              {showJumpSuggestions && searchQuery.trim() && jumpSuggestions.length > 0 && (
                <div className="cd-suggestions">
                  {jumpSuggestions.map((c) => (
                    <div key={c.CustomerCode} className="cd-suggestion-item" onClick={() => handleJumpSuggestionClick(c.CustomerCode)}>
                      <span className="cd-suggestion-cat">{c.CustomerCode}</span>
                      <span className="cd-suggestion-desc">{c.CustomerName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="cd-export-btn" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? "Searching…" : "Search"}
            </button>
          </form>
          {searchError && <div className="cd-error">{searchError}</div>}
        </div>

        {/* Basic Information + Balance Summary */}
        <CollapsibleSection title="Customer Details">
          <div className="cd-grid-2">
            <div className="cd-panel">
              <div className="cd-panel-title">Basic Information</div>
              <table className="cd-kv-table">
                <tbody>
                  <tr><th>Customer Code</th><td>{customer?.CustomerCode || "N/A"}</td></tr>
                  <tr><th>Customer Name</th><td>{customer?.CustomerName || "N/A"}</td></tr>
                  <tr><th>Billing Address</th><td>{customer?.BillingAddress || "N/A"}</td></tr>
                  <tr><th>City</th><td>{customer?.City || "N/A"}</td></tr>
                  <tr><th>State</th><td>{customer?.State || "N/A"}</td></tr>
                  <tr><th>Country</th><td>{customer?.Country || "N/A"}</td></tr>
                  <tr><th>Sales Employee</th><td>{customer?.SalesEmployeeName || "N/A"}</td></tr>
                  <tr><th>Status</th><td>{customer?.IsActive === "Y" ? "Active" : "Inactive"}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="cd-panel">
              <div className="cd-panel-title">Balance Summary</div>
              <table className="cd-kv-table">
                <tbody>
                  <tr><th>Current Balance</th><td>{formatCurrency(customer?.Balance || 0)}</td></tr>
                  <tr><th>Credit Line</th><td>{formatCurrency(customer?.CreditLine || 0)}</td></tr>
                  <tr><th>Currency</th><td>{customer?.Currency || "N/A"}</td></tr>
                  <tr><th>Total Outstanding</th><td>{formatCurrency(totalOutstandings || 0)}</td></tr>
                  <tr><th>Phone</th><td>{customer?.Phone || "N/A"}</td></tr>
                  <tr><th>Email</th><td>{customer?.Email || "N/A"}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Orders & Invoices - Monthly">
          <PurchasesAmountChart customerId={customer?.CustomerCode} />
        </CollapsibleSection>

        <CollapsibleSection title="Order to Invoice - Monthly">
          <DeliveryPerformanceChart customerId={customer?.CustomerCode} />
        </CollapsibleSection>

        <CollapsibleSection title="Customer Balance Report">
          <CustomerAgingChart cardCode={customer?.CustomerCode} />
        </CollapsibleSection>

        {/* Orders placed by this customer — line level */}
        <CollapsibleSection title="Order Line Items" sectionClassName="pdf-section cd-section">
          <CustomerOrdersLineTable customerCode={customer?.CustomerCode} />
        </CollapsibleSection>

        {/* Invoices for this customer — line level */}
        <CollapsibleSection title="Invoice Line Items" sectionClassName="pdf-section cd-section">
          <CustomerInvoicesTable customerCode={customer?.CustomerCode} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Customer Outstanding"
          sectionClassName="pdf-section cd-section"
          controls={
            <>
              <Dropdown onSelect={handleFilterSelect}>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  id="outstanding-filter-dropdown"
                >
                  {outstandingFilter}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="Payment Pending">
                    Payment Pending
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="Payment Done">
                    Payment Done
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <button
                className="btn btn-primary"
                onClick={handleMailSend}
                disabled={isMailSending}
              >
                {isMailSending ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Sending...
                  </>
                ) : (
                  "Mail"
                )}
              </button>

              <button
                className="btn btn-success"
                onClick={handleExcelDownload}
                disabled={isExcelLoading}
              >
                Excel
              </button>
            </>
          }
        >
          <div style={{ overflowY: "auto", overflowX: "auto" }}>
            <CustomerOutstandingTable
              customerOutstandings={outstandings}
              totalItems={totalOutstandings}
              isLoading={isLoadingOutstandings}
              customerCode={customer?.CustomerCode}
              onFilterChange={handleFilterChange}
              onExcelDownload={handleExcelDownload}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
              filterType={outstandingFilter}
              onFilterTypeChange={setOutstandingFilter}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              isAllSelected={isAllSelected}
              onSelectAll={handleSelectAll}
            />
          </div>
        </CollapsibleSection>

        {/* <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Complete Outstanding Report</h3>
                <Dropdown onSelect={handleFilterSelect}>
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    id="complete-outstanding-filter-dropdown"
                  >
                    {outstandingFilter}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="Payment Pending">
                      Payment Pending
                    </Dropdown.Item>
                    <Dropdown.Item eventKey="Payment Done">
                      Payment Done
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Card.Header>
            <Card.Body style={{ overflowY: "auto", overflowX: "auto" }}>
              <AllOutstandingTable
                customerCode={customer?.CustomerCode}
                filterType={outstandingFilter}
                isForPDF={true}
              />
            </Card.Body>
          </Card>
        </div> */}
        <div
          className="pdf-section d-none d-print-block"
          style={{ pageBreakAfter: "always" }}
        >
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Complete Outstanding Report</h3>
              </div>
            </Card.Header>
            <Card.Body style={{ overflowY: "auto", overflowX: "auto" }}>
              <AllOutstandingTable
                customerCode={customer?.CustomerCode}
                filterType={outstandingFilter}
                isForPDF={true}
              />
            </Card.Body>
          </Card>
        </div>

        {/* <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Sales by Category</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
               
                <MonthlyCategorySalesChart
                  customerId={customer?.CustomerCode}
                />
              </Row>
            </Card.Body>
          </Card>
        </div> */}
        <CollapsibleSection title="Sales by Category-Monthly">
          <CategorySalesChart cardCode={customer?.CustomerCode} />
        </CollapsibleSection>

        <CollapsibleSection title="Addresses">
              {customer?.Addresses && customer.Addresses.length > 0 ? (
                <div className="cd-table-card">
                  <div className="cd-table-scroll">
                    <table className="cd-table">
                      <thead>
                        <tr>
                          <th className="cd-th-left">Type</th>
                          <th className="cd-th-left">Address Name</th>
                          <th className="cd-th-left">Street</th>
                          <th className="cd-th-left">Block</th>
                          <th className="cd-th-left">City</th>
                          <th className="cd-th-left">State</th>
                          <th className="cd-th-left">Zip Code</th>
                          <th className="cd-th-left">Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.Addresses.map((address, index) => (
                          <tr key={index}>
                            <td>
                              {address.AddressType === "B" ? "Billing" : "Shipping"}
                            </td>
                            <td>{address.AddressName || "N/A"}</td>
                            <td>{address.Street || "N/A"}</td>
                            <td>{address.Block || "N/A"}</td>
                            <td>{address.City || "N/A"}</td>
                            <td>{address.State || "N/A"}</td>
                            <td>{address.ZipCode || "N/A"}</td>
                            <td>{address.Country || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="mb-0 cd-dash">No addresses available.</p>
              )}
        </CollapsibleSection>

        <button className="cd-back-btn" onClick={() => router.back()} style={{ marginTop: 8 }}>
          ← Back to Customers
        </button>

        {/* <div className="mt-3 mb-4">
        <button className="btn btn-secondary" onClick={() => router.back()}>
          Back to Customers
        </button>
      </div> */}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;
  const currentYear = new Date().getFullYear();

  try {
    // Ensure customer ID is provided
    if (!id) {
      throw new Error("Customer ID is required");
    }

    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";

    // Fetch customer details
    const customerUrl = `${protocol}://${host}/api/customers/${id}`;
    const customerRes = await fetch(customerUrl);

    //fetch outstanding

    const outstandingUrl = `${protocol}://${host}/api/customers/${id}/outstanding`;
    const outstandingRes = await fetch(outstandingUrl);

    if (!outstandingRes.ok) {
      throw new Error(
        `Failed to fetch customer outstanding: ${outstandingRes.statusText}`
      );
    }

    // const customerOutstandings = await outstandingRes.json();
    const {
      customerOutstandings: initialOutstandings,
      totalItems: initialTotalOutstandings,
    } = await outstandingRes.json();

    if (!customerRes.ok) {
      throw new Error(
        `Failed to fetch customer data: ${customerRes.statusText}`
      );
    }

    const customerData = await customerRes.json();
    const customer = Array.isArray(customerData)
      ? customerData[0]
      : customerData;

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Fetch purchase and revenue data
    const metricsUrl = `${protocol}://${host}/api/customers/${id}?metrics=true&year=${currentYear}`;
    // console.log(metricsUrl);
    const metricsRes = await fetch(metricsUrl);

    if (!id) {
      throw new Error("Customer ID is required");
    }
    // console.log("Customer ID in getServerSideProps:", id);

    if (!metricsRes.ok) {
      throw new Error(
        `Failed to fetch purchase metrics: ${metricsRes.statusText}`
      );
    }

    const purchaseData = await metricsRes.json();
    // console.log(purchaseData);

    /****Top quotation  */
    const topquotation = `${protocol}://${host}/api/customers/${id}?quotations=true`;
    const quotationRes = await fetch(topquotation);
    // console.log(id);
    if (!quotationRes.ok) {
      throw new Error(
        `Failed to fetch top quotation: ${quotationRes.statusText}`
      );
    }

    const TopQuotationData = await quotationRes.json();
    // console.log(TopQuotationData);

    /****Top Orders  */
    const toporders = `${protocol}://${host}/api/customers/${id}?orders=true`;
    const orderRes = await fetch(toporders);

    if (!orderRes.ok) {
      throw new Error(`Failed to fetch top orders: ${orderRes.statusText}`);
    }

    const TopOrderData = await orderRes.json();
    // console.log(TopOrderData);

    /***Top Invoices */

    const topinvoices = `${protocol}://${host}/api/customers/${id}?invoices=true`;
    const invoiceRes = await fetch(topinvoices);

    if (!invoiceRes.ok) {
      throw new Error(`Failed to fetch top invoice ${invoiceRes.statusText}`);
    }

    const TopInvoiceData = await invoiceRes.json();
    // console.log(TopInvoiceData);

    const salesByCategoryUrl = `${protocol}://${host}/api/customers/salesbycategory?id=${id}`;
    const salesByCategoryRes = await fetch(salesByCategoryUrl);

    if (!salesByCategoryRes.ok) {
      throw new Error(
        `Failed to fetch sales by category: ${salesByCategoryRes.statusText}`
      );
    }

    const salesByCategoryData = await salesByCategoryRes.json();

    return {
      props: {
        customer,
        purchaseData,
        TopQuotationData,
        TopOrderData,
        TopInvoiceData,
        salesByCategoryData,
        initialOutstandings,
        initialTotalOutstandings,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error.message);

    return {
      props: {
        customer: null,
        purchaseData: null,
        TopQuotationData: null,
        TopOrderData: null,
        TopInvoiceData: null,
        salesByCategoryData: null,
        customerOutstandings: null,
        error: error.message,
        initialOutstandings: [],
        initialTotalOutstandings: 0,
      },
    };
  }
}

// Same design tokens/typography as the product detail page (pages/products/[id].js's
// .pd-* system, namespaced .cd- here) — applied mostly via generic Bootstrap-class
// overrides (.cd .card, .cd .btn, etc.) so every Card/button on this page — including
// the ones rendered by the imported chart/table sub-components — picks up the same
// look without editing those files directly.
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .cd {
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
    padding-bottom: 28px;
  }

  .cd-card {
    width: 100%;
    max-width: 1400px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 14px 34px rgba(31, 41, 55, 0.10), 0 2px 8px rgba(31, 41, 55, 0.06);
    padding: 24px 32px 32px;
    margin: 24px auto;
  }

  .cd-back-btn {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 7px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    margin-bottom: 16px;
  }
  .cd-back-btn:hover { background: var(--border); }

  .cd-header { border-bottom: 1px solid var(--border); padding-bottom: 18px; margin-bottom: 18px; }
  .cd-header h1 { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 700; margin: 0 0 4px; }
  .cd-header-desc { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--muted); margin: 0; }

  .cd-search-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 22px;
  }
  .cd-search-form { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }

  .cd-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .cd-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .cd-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 20px rgba(31, 41, 55, 0.15);
    max-height: 260px;
    overflow-y: auto;
    z-index: 60;
  }
  .cd-suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cd-suggestion-item:hover { background: var(--surface2); }
  .cd-suggestion-cat {
    font-family: 'IBM Plex Mono', monospace;
    color: var(--accent);
    font-weight: 600;
    white-space: nowrap;
  }
  .cd-suggestion-desc {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cd-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: var(--text);
    outline: none;
  }
  .cd-input:focus { border-color: var(--accent); }

  .cd-export-btn {
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
  .cd-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .cd-error {
    margin-top: 10px;
    background: #fdecea;
    border: 1px solid var(--bad);
    color: var(--bad);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
  }

  .cd-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 26px;
  }
  @media (max-width: 900px) {
    .cd-grid-2 { grid-template-columns: 1fr; }
  }

  .cd-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
  }
  .cd-panel-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .cd-kv-table { width: 100%; border-collapse: collapse; }
  .cd-kv-table th {
    text-align: left;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    color: var(--muted);
    font-weight: 600;
    padding: 7px 10px 7px 0;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  .cd-kv-table td {
    text-align: right;
    font-size: 13px;
    padding: 7px 0;
    border-bottom: 1px solid var(--border);
  }
  .cd-kv-table tr:last-child th, .cd-kv-table tr:last-child td { border-bottom: none; }

  .cd-section { margin-bottom: 28px; }
  .cd-section-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .cd-section-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 14px;
  }
  .cd-section-header .cd-section-title { margin-bottom: 0; }
  .cd-section-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

  .cd-collapsible-header {
    cursor: pointer;
    user-select: none;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 0;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .cd-collapsible-header:hover { background: var(--border); }
  .cd-collapsible-header .cd-section-title { font-size: 15.5px; }
  .cd-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 16px;
    font-weight: 700;
    color: var(--accent);
    transition: transform 0.2s ease, background 0.15s ease;
  }
  .cd-collapsible-header:hover .cd-chevron { background: var(--surface2); }
  .cd-chevron.open { transform: rotate(90deg); }
  .cd-section-body { margin-top: 16px; }

  .cd-empty {
    text-align: center;
    color: var(--muted);
    padding: 40px 0;
    font-size: 13px;
    font-family: 'IBM Plex Mono', monospace;
  }

  .cd .card {
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(31, 41, 55, 0.08), 0 2px 6px rgba(31, 41, 55, 0.05);
  }
  .cd .card-header {
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
  }
  .cd .card-header h2,
  .cd .card-header h3 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
  }

  .cd .btn-secondary {
    background: var(--surface2);
    border-color: var(--border);
    color: var(--text);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
  }
  .cd .btn-secondary:hover { background: var(--border); border-color: var(--border); }
  .cd .btn-primary {
    background: var(--accent);
    border-color: var(--accent);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
  }
  .cd .btn-success {
    background: var(--good);
    border-color: var(--good);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
  }

  .cd-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .cd-table-scroll { overflow-x: auto; }
  .cd-table { width: 100%; border-collapse: collapse; margin: 0; }
  .cd-table th {
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
  }
  .cd-table th:last-child { border-right: none; }
  .cd-th-left { text-align: left; }
  .cd-th-right { text-align: right; }
  .cd-table td {
    padding: 10px 14px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .cd-table td:last-child { border-right: none; }
  .cd-table tbody tr:last-child td { border-bottom: none; }
  .cd-table tbody tr:hover { background: var(--surface2); }
  .cd-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .cd-dash { color: var(--muted); font-size: 13.5px; }

  .cd-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .cd-pagination-info { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .cd-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .cd-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  .cd-page-btn:hover:not(:disabled) { background: var(--border); }
  .cd-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .cd-mode-toggle {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .cd-mode-btn {
    background: var(--surface);
    border: none;
    border-right: 1px solid var(--border);
    padding: 8px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    white-space: nowrap;
  }
  .cd-mode-btn:last-child { border-right: none; }
  .cd-mode-btn:hover { background: var(--surface2); }
  .cd-mode-btn.active { background: var(--accent); color: #ffffff; }
`;
