

// "use client";
// import { Fragment, useContext, useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useMediaQuery } from "react-responsive";
// import Accordion from "react-bootstrap/Accordion";
// import AccordionContext from "react-bootstrap/AccordionContext";
// import { useAccordionButton } from "react-bootstrap/AccordionButton";
// import SimpleBar from "simplebar-react";
// import "simplebar/dist/simplebar.min.css";
// import { People, House, Clipboard, FileText, CurrencyDollar } from "react-bootstrap-icons";
// import { FaMoneyBillWave, FaSignOutAlt, FaUser, FaBox } from "react-icons/fa";
// import { Button } from "react-bootstrap";
// import { useAuth } from "contexts/AuthContext";

// const NavbarVertical = (props) => {
//   const router = usePathname(); // Get the current route
//   const { user, logout } = useAuth();
//   const [activeMenus, setActiveMenus] = useState([]);
//   const isMobile = useMediaQuery({ maxWidth: 767 });

//   const CustomToggle = ({ children, eventKey, icon, href }) => {
//     const { activeEventKey } = useContext(AccordionContext);
//     const isCurrentEventKey = activeEventKey === eventKey;

//     const decoratedOnClick = useAccordionButton(eventKey, () => {
//       setActiveMenus((prev) =>
//         isCurrentEventKey
//           ? prev.filter((key) => key !== eventKey)
//           : [...prev, eventKey]
//       );
//     });

//     // Check if the current route matches the href or any of its child routes
//     const isActive = router.startsWith(href);

//     return (
//       <li className="nav-item mb-3">
//         <Link
//           href={href}
//           className={`nav-link ${isActive ? "active" : ""}`}
//           onClick={decoratedOnClick}
//           data-bs-toggle="collapse"
//           data-bs-target="#navDashboard"
//           aria-expanded={isCurrentEventKey}
//           aria-controls="navDashboard"
//         >
//           {icon && <span className="nav-icon">{icon}</span>}
//           {children}
//         </Link>
//       </li>
//     );
//   };

//   const handleLogout = async () => {
//     try {
//       await fetch('/api/auth/logout', {
//         method: 'POST',
//         credentials: 'include',
//       });
//       logout(); // This will handle clearing storage and redirecting
//     } catch (error) {
//       console.error('Logout error:', error);
//       logout(); // Fallback to local logout if API call fails
//     }
//   };

//   if (!user) {
//     return null; // Or a loading spinner if you prefer
//   }

//   const isAdmin = user.role === 'admin';
//   const isSalesPerson = user.role === "sales_person";

//   return (
//     <Fragment>
//       <div className="position-relative" style={{ height: "100vh" }}>
//         <SimpleBar style={{ maxHeight: "100vh", paddingBottom: "100px" }}>
//           <div className="nav-scroller">
//             <Link href="/" className="navbar-brand">
//               <img
//                 src="/assets/density_logo_new_trans.png"
//                 alt="Logo"
//                 className="img-fluid"
//                 style={{ height: "80px", width: "auto" }}
//               />
//             </Link>
//           </div>
//           <Accordion as="ul" className="navbar-nav flex-column">
//             {/* Dashboard Link (Direct for Admin, Accordion for Others) */}
//             {/* {!isAdmin ? (
//               <li className="nav-item mb-3">
//                 <Link href="/" className={`nav-link d-flex align-items-center ${router === "/" ? "active" : ""}`}>
//                   <House className="me-2" /> Dashboard
//                 </Link>
//               </li>
//             ) : (
//               <>
//                 <CustomToggle eventKey="dashboard" icon={<House className="me-2" />} href="/">
//                   Dashboard
//                 </CustomToggle>
//                 <Accordion.Collapse eventKey="dashboard">
//                   <ul className="nav flex-column ms-3">
//                     <li className="nav-item mb-3">
//                       <Link href="/" className={`nav-link d-flex align-items-center ${router === "/" ? "active" : ""}`}>
//                         <House className="me-2" /> All
//                       </Link>
//                     </li>
//                     <li className="nav-item mb-3">
//                       <Link href="/dashboard/customer" className={`nav-link d-flex align-items-center ${router === "/dashboard/customer" ? "active" : ""}`}>
//                         <People className="me-2" /> Customer
//                       </Link>
//                     </li>
//                     <li className="nav-item mb-3">
//                       <Link href="/dashboard/sales-person" className={`nav-link d-flex align-items-center ${router === "/dashboard/sales-person" ? "active" : ""}`}>
//                         <FaUser className="me-2" /> Sales Person
//                       </Link>
//                     </li>
//                   </ul>
//                 </Accordion.Collapse>
//               </>
//             )} */}
//             <li className="nav-item mb-3">
//               <Link
//                 href="/"
//                 className={`nav-link d-flex align-items-center ${router === "/" ? "active" : ""}`}
//               >
//                 <House className="me-2" /> Dashboard
//               </Link>
//             </li>

//             {/* Quotations */}
//             {/* <li className="nav-item mb-3">
//               <Link href="/quotations" className={`nav-link d-flex align-items-center ${router === "/quotations" ? "active" : ""}`}>
//                 <CurrencyDollar className="me-2" /> Quotation
//               </Link>
//             </li> */}

//             {/* Orders Accordion */}
//             <CustomToggle
//               eventKey="orders"
//               icon={<Clipboard className="me-2" />}
//               href="/orders"
//             >
//               Orders
//             </CustomToggle>
//             <Accordion.Collapse eventKey="orders">
//               <ul className="nav flex-column ms-3">
//                 <li className="nav-item mb-3">
//                   <Link
//                     href="/orders"
//                     className={`nav-link d-flex align-items-center ${router === "/orders" ? "active" : ""}`}
//                   >
//                     <Clipboard className="me-2" /> All Orders
//                   </Link>
//                 </li>
//                 <li className="nav-item mb-3">
//                   <Link
//                     href="/open-orders"
//                     className={`nav-link d-flex align-items-center ${router === "/open-orders" ? "active" : ""}`}
//                   >
//                     <Clipboard className="me-2" /> Open Orders
//                   </Link>
//                 </li>
//               </ul>
//             </Accordion.Collapse>

//             {/* Invoices */}
//             {/* <li className="nav-item mb-3">
//               <Link href="/invoices" className={`nav-link d-flex align-items-center ${router === "/invoices" ? "active" : ""}`}>
//                 <FileText className="me-2" /> Invoice
//               </Link>
//             </li> */}
//             <CustomToggle
//               eventKey="invoices"
//               icon={<Clipboard className="me-2" />}
//               href="/invoices"
//             >
//               Invoice
//             </CustomToggle>
//             <Accordion.Collapse eventKey="invoices">
//               <ul className="nav flex-column ms-3">
//                 <li className="nav-item mb-3">
//                   <Link
//                     href="/header-invoices"
//                     className={`nav-link d-flex align-items-center ${router === "/header-invoices" ? "active" : ""}`}
//                   >
//                     <Clipboard className="me-2" /> Invoices (Header)
//                   </Link>
//                 </li>
//                 <li className="nav-item mb-3">
//                   <Link
//                     href="/invoices"
//                     className={`nav-link d-flex align-items-center ${router === "/invoices" ? "active" : ""}`}
//                   >
//                     <Clipboard className="me-2" /> Invoices(Line)
//                   </Link>
//                 </li>
//                 <li className="nav-item mb-3">
//                   <Link
//                     href="/dispatch-pending"
//                     className={`nav-link d-flex align-items-center ${router === "/dispatch-pending" ? "active" : ""}`}
//                   >
//                     <Clipboard className="me-2" />
//                     Pending for dispatch
//                   </Link>
//                 </li>
//               </ul>
//             </Accordion.Collapse>

//             {/* Customers (Admin Only) */}
//             {(isAdmin || isSalesPerson) && (
//               <li className="nav-item mb-3">
//                 <Link
//                   href="/customers"
//                   className={`nav-link d-flex align-items-center ${router === "/customers" ? "active" : ""}`}
//                 >
//                   <People className="me-2" /> Customers
//                 </Link>
//               </li>
//             )}

//             {/* Products (Hidden for Admin) */}
//             {(isAdmin || isSalesPerson) && (
//               <li className="nav-item mb-3">
//                 <Link
//                   href="/products"
//                   className={`nav-link d-flex align-items-center ${router === "/products" ? "active" : ""}`}
//                 >
//                   <FaBox className="me-2" /> Products
//                 </Link>
//               </li>
//             )}

//             {/* Outstanding Payments (Hidden for Admin) */}
            
//                 <li className="nav-item mb-3">
//                   <Link
//                     href="/customer-balance"
//                     className={`nav-link d-flex align-items-center ${router === "/customer-balance" ? "active" : ""}`}
//                   >
//                     <FaMoneyBillWave className="me-2" />  Balance
//                   </Link>
//                 </li>

//                 {/* <li className="nav-item mb-3">
//                   <Link href="/vendor-payment" className={`nav-link d-flex align-items-center ${router === "/vendor-payment" ? "active" : ""}`}>
//                     <FaMoneyBillWave className="me-2" /> Vendor Payments
//                   </Link>
//                 </li> */}

//             {(isAdmin || isSalesPerson) && (
//               <li className="nav-item mb-3">
//                 <Link
//                   href="/category"
//                   className={`nav-link d-flex align-items-center ${router === "/category" ? "active" : ""}`}
//                 >
//                   <FaBox className="me-2" /> Category Analytics
//                 </Link>
//               </li>
//             )}
//              {(isAdmin || isSalesPerson) && (
//               <li className="nav-item mb-3">
//                 <Link
//                   href="/dispatch"
//                   className={`nav-link d-flex align-items-center ${router === "/dispatch" ? "active" : ""}`}
//                 >
//                   <FaBox className="me-2" /> Dispatch Details
//                 </Link>
//               </li>
//             )}
            
//             <li className="nav-item mb-3">
//                 <Link
//                   href="/quick-quote"
//                   className={`nav-link d-flex align-items-center ${router === "/quick-quote" ? "active" : ""}`}
//                 >
//                   <FaBox className="me-2" /> Quick Quote
//                 </Link>
//               </li>
//               <li className="nav-item mb-3">
//                 <Link
//                   href="/order-lifecycle"
//                   className={`nav-link d-flex align-items-center ${router === "/order-lifecycle" ? "active" : ""}`}
//                 >
//                   <FaBox className="me-2" /> order lifecycle
//                 </Link>
//               </li>
//             {/* {(isAdmin || isSalesPerson) && (
//               <li className="nav-item mb-3">
//                 <Link
//                   href="/groupcategory"
//                   className={`nav-link d-flex align-items-center ${router === "/groupcategory" ? "active" : ""}`}
//                 >
//                   <FaBox className="me-2" /> Group Category
//                 </Link>
//               </li>
//             )} */}
//           </Accordion>
//         </SimpleBar>

//         {/* Fixed Logout Section */}
//         {/* <div className="position-absolute bottom-0 start-0 end-0 p-3" style={{ backgroundColor: "transparent" }}>
//           <div className="text-muted mb-2 text-center">
//             Logged in as: <strong>{user.name}</strong>
//           </div>
//           <Button
//             variant="primary"
//             onClick={handleLogout}
//             className="w-100"
//             style={{
//               backgroundColor: "#003366",
//               borderColor: "#003366",
//               padding: "10px",
//               borderRadius: "5px",
//             }}
//           >
//             <FaSignOutAlt className="me-2" /> Logout
//           </Button>
//         </div> */}
//       </div>
//     </Fragment>
//   );
// };

// export default NavbarVertical;


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
  const router = usePathname(); // Get the current route
  const { user, logout } = useAuth();
  const [activeMenus, setActiveMenus] = useState([]);
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const CustomToggle = ({ children, eventKey, icon, href }) => {
    const { activeEventKey } = useContext(AccordionContext);
    const isCurrentEventKey = activeEventKey === eventKey;

    const decoratedOnClick = useAccordionButton(eventKey, () => {
      setActiveMenus((prev) =>
        isCurrentEventKey
          ? prev.filter((key) => key !== eventKey)
          : [...prev, eventKey]
      );
    });

    // Check if the current route matches the href or any of its child routes
    const isActive = router.startsWith(href);

    return (
      <li className="nav-item mb-3">
        <Link
          href={href}
          className={`nav-link ${isActive ? "active" : ""}`}
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
  const isSalesPerson = user.role === "sales_person";
  const is3ASenrise = user.role === "3ASenrise"; // Check for 3ASenrise role

  // If user has 3ASenrise role, show only the Products page
  if (is3ASenrise) {
    return (
      <Fragment>
        <div className="position-relative" style={{ height: "100vh" }}>
          <SimpleBar style={{ maxHeight: "100vh", paddingBottom: "100px" }}>
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
            <ul className="navbar-nav flex-column">
              {/* Only show Products page for 3ASenrise users */}
              <li className="nav-item mb-3">
                <Link
                  href="/products"
                  className={`nav-link d-flex align-items-center ${router === "/products" ? "active" : ""}`}
                >
                  <FaBox className="me-2" /> Products
                </Link>
              </li>
            </ul>
          </SimpleBar>
        </div>
      </Fragment>
    );
  }

  // For all other roles, show the regular navigation
  return (
    <Fragment>
      <div className="position-relative" style={{ height: "100vh" }}>
        <SimpleBar style={{ maxHeight: "100vh", paddingBottom: "100px" }}>
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
            <li className="nav-item mb-3">
              <Link
                href="/"
                className={`nav-link d-flex align-items-center ${router === "/" ? "active" : ""}`}
              >
                <House className="me-2" /> Dashboard
              </Link>
            </li>

            {/* Orders Accordion */}
            <CustomToggle
              eventKey="orders"
              icon={<Clipboard className="me-2" />}
              href="/orders"
            >
              Orders
            </CustomToggle>
            <Accordion.Collapse eventKey="orders">
              <ul className="nav flex-column ms-3">
                <li className="nav-item mb-3">
                  <Link
                    href="/orders"
                    className={`nav-link d-flex align-items-center ${router === "/orders" ? "active" : ""}`}
                  >
                    <Clipboard className="me-2" /> All Orders
                  </Link>
                </li>
                <li className="nav-item mb-3">
                  <Link
                    href="/open-orders"
                    className={`nav-link d-flex align-items-center ${router === "/open-orders" ? "active" : ""}`}
                  >
                    <Clipboard className="me-2" /> Open Orders
                  </Link>
                </li>
              </ul>
            </Accordion.Collapse>

            {/* Invoices */}
            <CustomToggle
              eventKey="invoices"
              icon={<Clipboard className="me-2" />}
              href="/invoices"
            >
              Invoice
            </CustomToggle>
            <Accordion.Collapse eventKey="invoices">
              <ul className="nav flex-column ms-3">
                <li className="nav-item mb-3">
                  <Link
                    href="/header-invoices"
                    className={`nav-link d-flex align-items-center ${router === "/header-invoices" ? "active" : ""}`}
                  >
                    <Clipboard className="me-2" /> Invoices (Header)
                  </Link>
                </li>
                <li className="nav-item mb-3">
                  <Link
                    href="/invoices"
                    className={`nav-link d-flex align-items-center ${router === "/invoices" ? "active" : ""}`}
                  >
                    <Clipboard className="me-2" /> Invoices(Line)
                  </Link>
                </li>
                <li className="nav-item mb-3">
                  <Link
                    href="/dispatch-pending"
                    className={`nav-link d-flex align-items-center ${router === "/dispatch-pending" ? "active" : ""}`}
                  >
                    <Clipboard className="me-2" />
                    Pending for dispatch
                  </Link>
                </li>
              </ul>
            </Accordion.Collapse>

            {/* Customers (Admin Only) */}
            {(isAdmin || isSalesPerson) && (
              <li className="nav-item mb-3">
                <Link
                  href="/customers"
                  className={`nav-link d-flex align-items-center ${router === "/customers" ? "active" : ""}`}
                >
                  <People className="me-2" /> Customers
                </Link>
              </li>
            )}

            {/* Products (Hidden for Admin) */}
            {(isAdmin || isSalesPerson) && (
              <li className="nav-item mb-3">
                <Link
                  href="/products"
                  className={`nav-link d-flex align-items-center ${router === "/products" ? "active" : ""}`}
                >
                  <FaBox className="me-2" /> Products
                </Link>
              </li>
            )}

            {/* Outstanding Payments */}
            <li className="nav-item mb-3">
              <Link
                href="/customer-balance"
                className={`nav-link d-flex align-items-center ${router === "/customer-balance" ? "active" : ""}`}
              >
                <FaMoneyBillWave className="me-2" />  Balance
              </Link>
            </li>

            {(isAdmin || isSalesPerson) && (
              <li className="nav-item mb-3">
                <Link
                  href="/category"
                  className={`nav-link d-flex align-items-center ${router === "/category" ? "active" : ""}`}
                >
                  <FaBox className="me-2" /> Category Analytics
                </Link>
              </li>
            )}
            
            {/* {(isAdmin || isSalesPerson) && (
              <li className="nav-item mb-3">
                <Link
                  href="/dispatch"
                  className={`nav-link d-flex align-items-center ${router === "/dispatch" ? "active" : ""}`}
                >
                  <FaBox className="me-2" /> Dispatch Details
                </Link>
              </li>
            )} */}
            
            <li className="nav-item mb-3">
              <Link
                href="/quick-quote"
                className={`nav-link d-flex align-items-center ${router === "/quick-quote" ? "active" : ""}`}
              >
                <FaBox className="me-2" /> Quick Quote
              </Link>
            </li>
            
            <li className="nav-item mb-3">
              <Link
                href="/order-lifecycle"
                className={`nav-link d-flex align-items-center ${router === "/order-lifecycle" ? "active" : ""}`}
              >
                <FaBox className="me-2" /> Order lifecycle
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link
                href="/in-bound-shipments"
                className={`nav-link d-flex align-items-center ${router === "/in-bound-shipments" ? "active" : ""}`}
              >
                <FaBox className="me-2" /> In bound Shipments
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link
                href="/Document-downloading"
                className={`nav-link d-flex align-items-center ${router === "/Document-downloading" ? "active" : ""}`}
              >
                <FaBox className="me-2" /> Document Downloading
              </Link>
            </li>

            {(isAdmin || isSalesPerson) && (
              <li className="nav-item mb-3">
                <Link
                  href="/dispatch"
                  className={`nav-link d-flex align-items-center ${router === "/dispatch" ? "active" : ""}`}
                >
                  <FaBox className="me-2" /> Dispatch Details
                </Link>
              </li>
            )}
          </Accordion>
        </SimpleBar>
      </div>
    </Fragment>
  );
};

export default NavbarVertical;