"use client";

// Import necessary components from React and Bootstrap
import { Fragment } from "react";
import Link from "next/link";
import Accordion from "react-bootstrap/Accordion";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import { House, Clipboard, FileText, CurrencyDollar } from 'react-bootstrap-icons'; // Import the relevant icons
// import PersonIcon  from "@mui/icons-material/Person";
// import InventoryIcon from "@mui/icons-material/Person";
import { FaUser } from "react-icons/fa"; 
import { FaBox } from "react-icons/fa"; 



// import logo from "@public/assets/density_logo_new_trans.png"
const NavbarVertical = () => {
  // Custom Toggle for dropdown items
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

  return (
    <Fragment>
      {/* Dash UI and Dashboard section */}
      <Accordion
        defaultActiveKey="0"
        as="ul"
        className="navbar-nav flex-column"
        alwaysOpen
      >
        {/* Dash UI */}
        <li className="nav-item">
          <a href="/" className="nav-link d-flex align-items-center">
            <img
              src="/assets/density_logo_new_trans.png"
              alt="Logo"
              className="img-fluid" // Makes the image responsive
              style={{ height: "80px", width: "auto" }} // Set height and keep aspect ratio
            />
          </a>
        </li>

        {/* Dashboard */}
        <li className="nav-item">
          <a href="/dashboard" className="nav-link d-flex align-items-center">
            <House className="me-2" />
            Dashboard
          </a>
        </li>

        {/* Orders */}
        {/* <li className="nav-item"> */}
        {/* <a href="/orders" className="nav-link d-flex align-items-center"> */}
        {/* <Clipboard className="me-2" /> Orders icon */}
        {/* Orders */}
        {/* </a> */}
        {/* </li> */}

        
        {/* Quotation */}
        <li className="nav-item">
          <a href="/quotations" className="nav-link d-flex align-items-center">
            <CurrencyDollar className="me-2" /> {/* Quotation icon */}
            Quotation
          </a>
        </li>

        {/* Orders */}
        <li className="nav-item">
          <a href="/orders" className="nav-link d-flex align-items-center">
            <Clipboard className="me-2" /> {/* Orders icon */}
            Orders
          </a>
        </li>

        {/* Invoice */}
        <li className="nav-item">
          <a href="/invoices" className="nav-link d-flex align-items-center">
            <FileText className="me-2" /> {/* Invoice icon */}
            Invoice
          </a>
        </li>

        {/* Customers */}
        <li className="nav-item">
          <a href="/customers" className="nav-link d-flex align-items-center">
            <FaUser className="me-2" /> {/* Customer icon */}
            Customers
          </a>
        </li>

        {/* Products */}
        <li className="nav-item">
          <a href="/products" className="nav-link d-flex align-items-center">
            <FaBox className="me-2" /> {/* Product icon */} 
            Products
          </a>
        </li>

      </Accordion>
    </Fragment>
  );
};

export default NavbarVertical;
