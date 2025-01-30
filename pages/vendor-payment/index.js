


import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner ,Breadcrumb , Container , Table , Card} from "react-bootstrap";
import DashboardLayout from "app/(dashboard)/layout";
import VendorPaymentsChart from "components/page/vendor-payment/chart/VendorPaymentsChart";
import { formatCurrency } from "utils/formatCurrency";


export default function VendorPaymentPage({ initialVendorPayments = [] }) {
  const router = useRouter();
  const [vendorPayments, setVendorPayments] = useState(initialVendorPayments);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchVendorPaymentsClientSide() {
      try {
        setIsLoading(true);

        const response = await fetch("/api/vendor-payment");
        if (!response.ok) {
          throw new Error("Failed to fetch vendor payments");
        }

        const data = await response.json();
        setVendorPayments(data || []);
      } catch (error) {
        console.error("Error fetching vendor payments (client-side):", error);
        setVendorPayments([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVendorPaymentsClientSide();
  }, []);

  if (router.isFallback) {
    return <Spinner animation="border" role="status" />;
  }

  return (
    
      <Container className="mt-2  ">
        <Breadcrumb>
          <Breadcrumb.Item href="#">Vendor Payments</Breadcrumb.Item>
          <Breadcrumb.Item active>Details</Breadcrumb.Item>
        </Breadcrumb>
        <Card className="mb-2">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Vendor Payment</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <VendorPaymentsChart
            vendorPayments={vendorPayments}
            isLoading={isLoading}
          />
          </Card.Body>
          <div className="mt-4">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Vendor</th>
                {vendorPayments.map((data) => (
                  <th key={data.cardname}>{data.cardname}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Balance</td>
                {vendorPayments.map((data, index) => (
                  <td key={index}>{formatCurrency(data.Balance)}</td>
                ))}
              </tr>
            </tbody>
          </Table>
          </div>
        </Card>        
        
      </Container>
    
  );
}

export async function getServerSideProps() {
  try {
    const { req } = context;
    const protocol = req.headers["x-forwarded-proto"] || "http"; // Detect protocol (http or https)
    const host = req.headers.host; // Get the host from headers
    const apiUrl = `${protocol}://${host}/api/vendor-payment`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error("Failed to fetch vendor payments (SSR)");
    }

    const data = await response.json();
    return {
      props: {
        initialVendorPayments: data || [],
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps for VendorPaymentPage:", error);
    return {
      props: {
        initialVendorPayments: [],
      },
    };
  }
}
