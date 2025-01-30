"use client";
import { Fragment, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import Accordion from "react-bootstrap/Accordion";
import AccordionContext from "react-bootstrap/AccordionContext";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { People, House, Clipboard, FileText, CurrencyDollar } from "react-bootstrap-icons";
import { FaMoneyBillWave, FaSignOutAlt, FaUser, FaBox } from "react-icons/fa";
import { Button } from "react-bootstrap";
import { useAuth } from "contexts/AuthContext";

const NavbarVertical = (props) => {
  const router = usePathname();
  const { user, logout } = useAuth();
  const [activeMenus, setActiveMenus] = useState([]);
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const CustomToggle = ({ children, eventKey, icon }) => {
    const { activeEventKey } = useContext(AccordionContext);
    const isCurrentEventKey = activeEventKey === eventKey;

    const decoratedOnClick = useAccordionButton(eventKey, () => {
      setActiveMenus((prev) =>
        isCurrentEventKey
          ? prev.filter((key) => key !== eventKey)
          : [...prev, eventKey]
      );
    });

    return (
      <li className="nav-item mb-3">
        <Link
          href="#"
          className={`nav-link ${activeMenus.includes(eventKey) ? "active" : ""}`}
          onClick={decoratedOnClick}
          data-bs-toggle="collapse"
          data-bs-target="#navDashboard"
          aria-expanded={isCurrentEventKey}
          aria-controls="navDashboard"
        >
          {icon && <span className="nav-icon">{icon}</span>}
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
      logout(); // This will handle clearing storage and redirecting
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Fallback to local logout if API call fails
    }
  };

  if (!user) {
    return null; // Or a loading spinner if you prefer
  }

  const isAdmin = user.role === 'admin';

  return (
    <Fragment>
      <SimpleBar style={{ maxHeight: "100vh" }}>
        <div className="nav-scroller">
          <Link href="/" className="navbar-brand">
            <img
              src="/assets/density_logo_new_trans.png"
              alt="Logo"
              className="img-fluid"
              style={{ height: "80px", width: "auto" }}
            />
          </Link>
        </div>
        <Accordion as="ul" className="navbar-nav flex-column">
          {/* Dashboard Link (Direct for Admin, Accordion for Others) */}
          {!isAdmin ? (
            <li className="nav-item mb-3">
              <Link href="/" className="nav-link d-flex align-items-center">
                <House className="me-2" /> Dashboard
              </Link>
            </li>
          ) : (
            <>
              <CustomToggle eventKey="dashboard" icon={<House className="me-2" />}>
                Dashboard
              </CustomToggle>
              <Accordion.Collapse eventKey="dashboard">
                <ul className="nav flex-column ms-3">
                  <li className="nav-item mb-3">
                    <Link href="/" className="nav-link d-flex align-items-center">
                      <House className="me-2" /> All
                    </Link>
                  </li>
                  <li className="nav-item mb-3">
                    <Link href="/dashboard/customer" className="nav-link d-flex align-items-center">
                      <People className="me-2" /> Customer
                    </Link>
                  </li>
                  <li className="nav-item mb-3">
                    <Link href="/dashboard/sales-person" className="nav-link d-flex align-items-center">
                      <FaUser className="me-2" /> Sales Person
                    </Link>
                  </li>
                </ul>
              </Accordion.Collapse>
            </>
          )}

          {/* Quotations */}
          <li className="nav-item mb-3">
            <Link href="/quotations" className="nav-link d-flex align-items-center">
              <CurrencyDollar className="me-2" /> Quotation
            </Link>
          </li>

          {/* Orders Accordion */}
          <CustomToggle eventKey="orders" icon={<Clipboard className="me-2" />}>
            Orders
          </CustomToggle>
          <Accordion.Collapse eventKey="orders">
            <ul className="nav flex-column ms-3">
              <li className="nav-item mb-3">
                <Link href="/orders" className="nav-link d-flex align-items-center">
                  <Clipboard className="me-2" /> All Orders
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link href="/open-orders" className="nav-link d-flex align-items-center">
                  <Clipboard className="me-2" /> Open Orders
                </Link>
              </li>
            </ul>
          </Accordion.Collapse>

          {/* Invoices */}
          <li className="nav-item mb-3">
            <Link href="/invoices" className="nav-link d-flex align-items-center">
              <FileText className="me-2" /> Invoice
            </Link>
          </li>

          {/* Customers (Admin Only) */}
          {isAdmin && (
            <li className="nav-item mb-3">
              <Link href="/customers" className="nav-link d-flex align-items-center">
                <People className="me-2" /> Customers
              </Link>
            </li>
          )}

          {/* Products (Hidden for Admin) */}
          {isAdmin && (
            <li className="nav-item mb-3">
              <Link href="/products" className="nav-link d-flex align-items-center">
                <FaBox className="me-2" /> Products
              </Link>
            </li>
          )}

          {/* Outstanding Payments (Hidden for Admin) */}
          {isAdmin && (
  <>
    <li className="nav-item mb-3">
      <Link href="/customer-balance" className="nav-link d-flex align-items-center">
        <FaMoneyBillWave className="me-2" /> Customer Balance
      </Link>
    </li>

    <li className="nav-item mb-3">
      <Link href="/vendor-payment" className="nav-link d-flex align-items-center">
        <FaMoneyBillWave className="me-2" /> Vendor Payments
      </Link>
    </li>
  </>
)}


          {/* Logout Section */}
          <li className="nav-item mt-4 mb-3" style={{ padding: "10px 15px" }}>
            <div className="text-muted mb-3 text-center">
              Logged in as: <strong>{user.name}</strong>
            </div>
            <Button
              variant="primary"
              onClick={handleLogout}
              className="w-100"
              style={{
                backgroundColor: "#003366",
                borderColor: "#003366",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              <FaSignOutAlt className="me-2" /> Logout
            </Button>
          </li>
        </Accordion>
      </SimpleBar>
    </Fragment>
  );
};

export default NavbarVertical;