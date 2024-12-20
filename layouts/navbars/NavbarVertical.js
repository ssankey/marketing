// components/NavbarVertical.js

"use client";

// Import necessary components from React and Bootstrap
import { Fragment } from "react";
import Link from "next/link";
import Accordion from "react-bootstrap/Accordion";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import { FaMoneyBillWave, FaSignOutAlt } from "react-icons/fa";
import { House, Clipboard, FileText, CurrencyDollar } from "react-bootstrap-icons"; // Import the relevant icons
import { FaUser, FaBox } from "react-icons/fa";
import { Button } from "react-bootstrap"; // Import Button component from React-Bootstrap
import { useRouter } from "next/router"; // Import useRouter for redirection

const NavbarVertical = () => {
  const router = useRouter(); // For redirection

  // Custom Toggle for dropdown items using React Icon Components
  const CustomToggle = ({ children, eventKey, Icon }) => {
    const decoratedOnClick = useAccordionButton(eventKey);
    return (
      <li className="nav-item">
        <Link href="#" className="nav-link d-flex align-items-center" onClick={decoratedOnClick}>
          <Icon className="me-2" />
          {children}
        </Link>
      </li>
    );
  };

  // Handle logout functionality
  const handleLogout = () => {
    // Clear localStorage to remove the token
    localStorage.removeItem("token"); // Remove token specifically

    // Optionally, you could also clear all localStorage items
    // localStorage.clear();

    // Redirect to the login page
    router.push("/login");
  };

  return (
    <Fragment>
      {/* Dash UI and Dashboard section */}
      <Accordion
        defaultActiveKey="0"
        as="ul"
        className="navbar-nav flex-column d-flex" // Add `d-flex` to make the navbar a flex container
        alwaysOpen
        style={{ height: "100vh" }} // Set the navbar height to full screen
      >
        {/* Dash UI */}
        <li className="nav-item">
          <Link href="/" className="nav-link d-flex align-items-center">
            <img
              src="/assets/density_logo_new_trans.png"
              alt="Logo"
              className="img-fluid" // Makes the image responsive
              style={{ height: "80px", width: "auto" }} // Set height and keep aspect ratio
            />
          </Link>
        </li>

        {/* Dashboard */}
        <li className="nav-item">
          <Link href="/" className="nav-link d-flex align-items-center">
            <House className="me-2" />
            Dashboard
          </Link>
        </li>

        {/* Quotation */}
        <li className="nav-item">
          <Link href="/quotations" className="nav-link d-flex align-items-center">
            <CurrencyDollar className="me-2" /> {/* Quotation icon */}
            Quotation
          </Link>
        </li>

        {/* Orders */}
        <li className="nav-item">
          <Accordion>
            <CustomToggle eventKey="orders" Icon={Clipboard}>
              Orders
            </CustomToggle>
            <Accordion.Collapse eventKey="orders">
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link href="/orders" className="nav-link d-flex align-items-center">
                    <Clipboard className="me-2" /> All Orders
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/open-orders" className="nav-link d-flex align-items-center">
                    <Clipboard className="me-2" /> Open Orders
                  </Link>
                </li>
              </ul>
            </Accordion.Collapse>
          </Accordion>
        </li>

        {/* Invoice */}
        <li className="nav-item">
          <Link href="/invoices" className="nav-link d-flex align-items-center">
            <FileText className="me-2" /> {/* Invoice icon */}
            Invoice
          </Link>
        </li>

        {/* Customers */}
        <li className="nav-item">
          <Link href="/customers" className="nav-link d-flex align-items-center">
            <FaUser className="me-2" /> {/* Customer icon */}
            Customers
          </Link>
        </li>

        {/* Products */}
        <li className="nav-item">
          <Link href="/products" className="nav-link d-flex align-items-center">
            <FaBox className="me-2" /> {/* Product icon */}
            Products
          </Link>
        </li>

        {/* Outstanding Payment */}
        <li className="nav-item">
          <Link href="/outstanding-payment" className="nav-link d-flex align-items-center">
            <FaMoneyBillWave className="me-2" /> {/* Outstanding payment icon */}
            Outstanding Payments
          </Link>
        </li>

        {/* Logout Button at the bottom */}
        <li
          className="nav-item mt-auto"
          style={{ padding: "10px 15px", marginLeft: "0", marginRight: "0" }}
        >
          {/* mt-auto ensures the button stays at the bottom */}
          <Button
            variant="primary" // Dark blue color
            onClick={handleLogout}
            className="w-100"
            style={{
              backgroundColor: "#003366",
              borderColor: "#003366",
              padding: "10px", // Add padding to the button for spacing
              marginTop: "auto", // Keeps the button at the bottom
              marginLeft: "0", // Ensure no left margin
              marginRight: "0", // Ensure no right margin
              borderRadius: "5px", // Optional: add border-radius for a rounded button
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
