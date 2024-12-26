import { Fragment } from "react";
import Link from "next/link";
import Accordion from "react-bootstrap/Accordion";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import { People, House, Clipboard, FileText, CurrencyDollar } from "react-bootstrap-icons";
import { FaMoneyBillWave, FaSignOutAlt, FaUser, FaBox } from "react-icons/fa";
import { Button } from "react-bootstrap";
import { useRouter } from "next/router";
import { useAuth } from "contexts/AuthContext";

const NavbarVertical = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const CustomToggle = ({ children, eventKey, icon }) => {
    const decoratedOnClick = useAccordionButton(eventKey);
    return (
      <li className="nav-item">
        <Link href="#" className="nav-link" onClick={decoratedOnClick}>
          <i className={`nav-icon fe fe-${icon} me-2`}></i>
          {children}
        </Link>
      </li>
    );
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <Fragment>     
      <Accordion
        defaultActiveKey="0"
        as="ul"
        className="navbar-nav flex-column d-flex"
        alwaysOpen
        style={{
          height: "100vh",
          width: "250px",
          backgroundColor: "#fff"
        }}
      >
        <li className="nav-item">
          <a href="/" className="nav-link d-flex align-items-center">
            <img
              src="/assets/Density _LOGO.jpg"
              alt="Logo"
              className="img-fluid"
              style={{ height: "80px", width: "auto" }}
            />
          </a>
        </li>

        {/* Dashboard Accordion */}
        <li className="nav-item">
          <Accordion>
            <CustomToggle eventKey="dashboard" icon="house">
              <House className="me-2" />
              Dashboard
            </CustomToggle>
            <Accordion.Collapse eventKey="dashboard">
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <a href="/" className="nav-link d-flex align-items-center">
                    <House className="me-2" /> All
                  </a>
                </li>
                <li className="nav-item">
                  <a href="/dashboard/customer" className="nav-link d-flex align-items-center">
                    <People className="me-2" /> Customer
                  </a>
                </li>
                <li className="nav-item">
                  <a href="/dashboard/sales-person" className="nav-link d-flex align-items-center">
                    <FaUser className="me-2" /> Sales Person
                  </a>
                </li>
              </ul>
            </Accordion.Collapse>
          </Accordion>
        </li>

        {/* <li className="nav-item">
          <a href="/customer-chart" className="nav-link d-flex align-items-center">
            <House className="me-2" />
            Search By Customer
          </a>
        </li> */}

        <li className="nav-item">
          <a href="/quotations" className="nav-link d-flex align-items-center">
            <CurrencyDollar className="me-2" />
            Quotation
          </a>
        </li>

        <li className="nav-item">
          <Accordion>
            <CustomToggle eventKey="orders" icon="clipboard">
              Orders
            </CustomToggle>
            <Accordion.Collapse eventKey="orders">
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <a href="/orders" className="nav-link d-flex align-items-center">
                    <Clipboard className="me-2" /> All Orders
                  </a>
                </li>
                <li className="nav-item">
                  <a href="/open-orders" className="nav-link d-flex align-items-center">
                    <Clipboard className="me-2" /> Open Orders
                  </a>
                </li>
              </ul>
            </Accordion.Collapse>
          </Accordion>
        </li>

        <li className="nav-item">
          <a href="/invoices" className="nav-link d-flex align-items-center">
            <FileText className="me-2" />
            Invoice
          </a>
        </li>

        <li className="nav-item">
          <a href="/customers" className="nav-link d-flex align-items-center">
            <People className="me-2" />
            Customers
          </a>
        </li>

        <li className="nav-item">
          <a href="/products" className="nav-link d-flex align-items-center">
            <FaBox className="me-2" />
            Products
          </a>
        </li>

        <li className="nav-item">
          <a href="/outstanding-payment" className="nav-link d-flex align-items-center">
            <FaMoneyBillWave className="me-2" />
            Outstanding Payments
          </a>
        </li>

        <li className="nav-item mt-auto" style={{ padding: "10px 15px", marginLeft: "0", marginRight: "0" }}>
          <Button
            variant="primary"
            onClick={handleLogout}
            className="w-100"
            style={{
              backgroundColor: "#003366",
              borderColor: "#003366",
              padding: "10px",
              marginTop: "auto",
              marginLeft: "0",
              marginRight: "0",
              borderRadius: "5px",
            }}
          >
            <FaSignOutAlt className="me-2" /> Logout
          </Button>
        </li>
      </Accordion>
    </Fragment>
  );
};

export default NavbarVertical;