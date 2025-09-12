
//page/customers/[id].js

import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Table,
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
          cc: [salesPersonEmail], // sales-person on CC

             

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
    <div id="content-to-print">
      <Container className="mt-4">
        {/* <div className="mt-3 mb-4">
          <button className="btn btn-secondary" onClick={() => router.back()}>
            Back to Customers
          </button>
          <button className="btn btn-primary" onClick={handlePrintPDF}>
            <i className="bi bi-printer-fill me-2"></i> Print Report
          </button>
        </div> */}
        <div className="mt-3 mb-4 d-flex justify-content-between align-items-center">
          <button
            className="btn btn-secondary me-2 me-md-0"
            onClick={() => router.back()}
          >
            Back to Customers
          </button>
          {/* <button
            id="print-pdf-btn"
            className="btn btn-primary"
            onClick={handlePrintPDF}
          >
            <i className="bi bi-file-earmark-pdf me-2"></i> Print PDF
          </button> */}
        </div>
        {/* First Card - Customer Details */}
        <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <h2 className="mb-0">
                Customer Details - {customer?.CustomerName || "N/A"}
              </h2>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <Row className="mb-2">
                    <Col sm={4} className="fw-bold">
                      Customer Code:
                    </Col>
                    <Col sm={8}>{customer?.CustomerCode || "N/A"}</Col>
                  </Row>
                  {/* Add more customer details as needed */}
                </Col>
                <Col md={6}>
                  <Row className="mb-2">
                    <Col sm={4} className="fw-bold">
                      Billing Address:
                    </Col>
                    <Col sm={8}>{customer?.BillingAddress || "N/A"}</Col>
                  </Row>
                  {/* Add more address details as needed */}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>

        <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Orders & Invoices - Monthly</h3>
              </div>
            </Card.Header>
            <Card.Body>
              {/* <PurchasesAmountChart data={purchaseData} /> */}
              <PurchasesAmountChart customerId={customer?.CustomerCode} />
            </Card.Body>
          </Card>
        </div>
        {/*Purchase Analytics Card */}

        <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Order to Invoice - Monthly</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <DeliveryPerformanceChart customerId={customer?.CustomerCode} />
            </Card.Body>
          </Card>
        </div>

        <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Customer Balance Report</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <CustomerAgingChart cardCode={customer?.CustomerCode} />
              </Row>
            </Card.Body>
          </Card>
        </div>

        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Customer Outstanding</h3>

              <div className="d-flex align-items-center ms-auto gap-2">
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
              </div>
            </div>
          </Card.Header>

          <Card.Body
            style={{
              overflowY: "auto",
              overflowX: "auto",
            }}
          >
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
          </Card.Body>
        </Card>

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
        <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Sales by Category-Monthly</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                {/* <Col lg={6}>
                <SalesTable data={salesByCategoryData} />
              </Col>
              <Col lg={6}>
                <SalesPieChart data={salesByCategoryData} />
              </Col> */}
                <CategorySalesChart cardCode={customer?.CustomerCode} />
              </Row>
            </Card.Body>
          </Card>
        </div>

        <div className="pdf-section">
          <Card className="mb-4">
            <Card.Header>
              <h3 className="mb-0">Addresses</h3>
            </Card.Header>
            <Card.Body>
              {customer?.Addresses && customer.Addresses.length > 0 ? (
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Address Name</th>
                      <th>Street</th>
                      <th>Block</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Zip Code</th>
                      <th>Country</th>
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
                </Table>
              ) : (
                <p className="mb-0">No addresses available.</p>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* <div className="mt-3 mb-4">
        <button className="btn btn-secondary" onClick={() => router.back()}>
          Back to Customers
        </button>
      </div> */}
      </Container>
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
