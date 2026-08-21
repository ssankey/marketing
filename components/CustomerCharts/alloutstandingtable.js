// components/CustomerCharts/alloutstandingtable.js

import React, { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

const columns = [
  { field: "Invoice No.", label: "Invoice No." },
  {
    field: "AR Invoice Date",
    label: "Invoice Date",
    render: (value) => formatDate(value),
  },
  { field: "SO#", label: "SO#" },
  { field: "SO Date", label: "SO Date", render: (value) => formatDate(value) },
  { field: "Customer Name", label: "Customer Name" },
  { field: "Contact Person", label: "Contact Person" },
  { field: "CustomerPONo", label: "SO Customer Ref. No" },
  {
    field: "Invoice Total",
    label: "Invoice Total",
    render: (value) => formatCurrency(value),
  },
  {
    field: "Balance Due",
    label: "Balance Due",
    render: (value) => formatCurrency(value),
    className: (value) => (value > 0 ? "text-danger fw-bold" : "text-success"),
  },
  { field: "Country", label: "Country" },
  { field: "State", label: "State" },
  { field: "Overdue Days", label: "Overdue Days" },
  { field: "Payment Terms", label: "Payment Terms" },
  { field: "Tracking no", label: "Tracking no" },
  {
    field: "Dispatch Date",
    label: "Dispatch Date",
    render: (value) => formatDate(value),
  },
  { field: "SalesEmployee", label: "Sales Person" },
];

const AllOutstandingTable = ({
  customerCode,
  filterType,
  isForPDF = false,
}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/customers/${customerCode}/all-outstanding?filterType=${filterType}`
        );
        const { customerOutstandings } = await res.json();

        setData(customerOutstandings || []);

        // Calculate total outstanding amount
        const total = customerOutstandings.reduce((sum, item) => {
          return sum + (item["Balance Due"] || 0);
        }, 0);
        setTotalAmount(total);
      } catch (error) {
        console.error("Error fetching all outstanding data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerCode) {
      fetchData();
    }
  }, [customerCode, filterType]);

  return (
    <div className="large-table-container">
      <div style={isForPDF ? { fontSize: "10px" } : {}}>
        <Container fluid className="mt-4">
          <div className="px-3 py-2">
            <div className="card border-0 bg-light shadow-sm">
              <div className="card-body p-2 text-center">
                <h6 className="text-muted mb-1">Complete Outstanding Amount</h6>
                <h4 className="mb-0 text-primary fw-bold">
                  {formatCurrency(totalAmount)}
                </h4>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.field}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((item, index) => {
                      const balanceDue = item["Balance Due"] || 0;
                      const displayedBalanceDue =
                        Math.round(balanceDue * 100) / 100;

                      return (
                        <tr key={index}>
                          {columns.map((col) => {
                            const rawValue = item[col.field];
                            let cellValue = rawValue;

                            if (col.field === "Balance Due") {
                              cellValue = formatCurrency(displayedBalanceDue);
                            } else if (col.render) {
                              cellValue = col.render(rawValue);
                            }

                            const cellClass = col.className
                              ? col.className(rawValue)
                              : "";

                            return (
                              <td key={col.field} className={cellClass}>
                                {cellValue || ""}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center">
                        No{" "}
                        {filterType === "Payment Pending"
                          ? "pending"
                          : "completed"}{" "}
                        payments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </div>
    </div>
    // <div style={isForPDF ? { fontSize: "10px" } : {}}>
    //   <Container fluid className="mt-4">
    //     <div className="px-3 py-2">
    //       <div className="card border-0 bg-light shadow-sm">
    //         <div className="card-body p-2 text-center">
    //           <h6 className="text-muted mb-1">Complete Outstanding Amount</h6>
    //           <h4 className="mb-0 text-primary fw-bold">
    //             {formatCurrency(totalAmount)}
    //           </h4>
    //         </div>
    //       </div>
    //     </div>

    //     {isLoading ? (
    //       <div className="text-center py-4">
    //         <Spinner animation="border" />
    //       </div>
    //     ) : (
    //       <div className="table-responsive">
    //         <table className="table table-striped table-bordered">
    //           <thead>
    //             <tr>
    //               {columns.map((col) => (
    //                 <th key={col.field}>{col.label}</th>
    //               ))}
    //             </tr>
    //           </thead>
    //           <tbody>
    //             {data.length > 0 ? (
    //               data.map((item, index) => {
    //                 const balanceDue = item["Balance Due"] || 0;
    //                 const displayedBalanceDue =
    //                   Math.round(balanceDue * 100) / 100;

    //                 return (
    //                   <tr key={index}>
    //                     {columns.map((col) => {
    //                       const rawValue = item[col.field];
    //                       let cellValue = rawValue;

    //                       if (col.field === "Balance Due") {
    //                         cellValue = formatCurrency(displayedBalanceDue);
    //                       } else if (col.render) {
    //                         cellValue = col.render(rawValue);
    //                       }

    //                       const cellClass = col.className
    //                         ? col.className(rawValue)
    //                         : "";

    //                       return (
    //                         <td key={col.field} className={cellClass}>
    //                           {cellValue || ""}
    //                         </td>
    //                       );
    //                     })}
    //                   </tr>
    //                 );
    //               })
    //             ) : (
    //               <tr>
    //                 <td colSpan={columns.length} className="text-center">
    //                   No{" "}
    //                   {filterType === "Payment Pending"
    //                     ? "pending"
    //                     : "completed"}{" "}
    //                   payments found
    //                 </td>
    //               </tr>
    //             )}
    //           </tbody>
    //         </table>
    //       </div>
    //     )}
    //   </Container>
    // </div>
  );
};

export default AllOutstandingTable;
