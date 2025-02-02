
// // components/TableFilters.js
// import React, { useState, useRef, useEffect } from "react";
// import {
//   Col,
//   Form,
//   Row,
//   Button,
//   ButtonGroup,
//   ListGroup,
// } from "react-bootstrap";

// /**
//  * Props:
//  *
//  * - searchConfig: {
//  *     enabled: boolean,
//  *     placeholder: string,
//  *     fields: string[],
//  *   }
//  *   Controls the main search input (not the category).
//  *
//  * - onSearch: (searchTerm: string) => void
//  *   Callback when the user types in the main search input.
//  *
//  * - onReset: () => void
//  *   Callback for the Reset button.
//  *
//  * - searchTerm: string
//  *   The current search term for the main search input.
//  *
//  * - statusFilter: {
//  *     enabled: boolean,
//  *     options: Array<{ value: string, label: string }>,
//  *     value: string,
//  *     label: string
//  *   }
//  *   Controls the Status filter buttons.
//  *
//  * - onStatusChange: (status: string) => void
//  *   Callback when the user selects a new status.
//  *
//  * - dateFilter: {
//  *     enabled: boolean
//  *   }
//  *   If enabled, show date inputs for fromDate and toDate.
//  *
//  * - fromDate: string
//  * - toDate: string
//  * - onDateFilterChange: (dateRange: { fromDate, toDate }) => void
//  *
//  * - totalItems: number
//  * - totalItemsLabel: string  (label to display next to the totalItems count)
//  *
//  * - categories: string[]
//  *   The full list of all possible categories (e.g. ["Chemicals", "Reagents", ...]).
//  *
//  * - selectedCategory: string
//  *   Currently selected category (from your router.query.category, typically).
//  *
//  * - onCategoryChange: (category: string) => void
//  *   Callback when user selects/clears a category (typically calls router.push).
//  *
//  * - customElement: { component: JSX.Element } (optional)
//  *   If you have some custom button or element to render in the filters bar.
//  */

// const TableFilters = ({
//   searchConfig = {
//     enabled: true,
//     placeholder: "Search...",
//     fields: [],
//   },
//   onSearch,
//   onReset,
//   searchTerm = "",

//   statusFilter = {
//     enabled: false,
//     options: [],
//     value: "all",
//     label: "Status",
//   },
//   onStatusChange,

//   dateFilter = {
//     enabled: true,
//   },
//   fromDate = "",
//   toDate = "",
//   onDateFilterChange,

//   totalItems,
//   totalItemsLabel = "Total Items",

//   // Categories for the "search with dropdown"
//   categories = [],
//   selectedCategory = "",
//   onCategoryChange,

//   // Optional custom element (e.g. an extra button)
//   customElement,
// }) => {
//   // 1. Local state for typed category input
//   const [categorySearch, setCategorySearch] = useState(selectedCategory);
//   const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

//   // 2. Ref for detecting clicks outside the category dropdown
//   const categoryContainerRef = useRef(null);

//   // 3. Filter categories based on what the user is typing
//   const filteredCategories = categories.filter((cat) =>
//     cat.toLowerCase().includes(categorySearch.toLowerCase())
//   );

//   // 4. Select a category from the dropdown
//   const handleCategorySelect = (cat) => {
//     setCategorySearch(cat);
//     setShowCategoryDropdown(false);
//     onCategoryChange(cat); // Notify parent about the chosen category
//   };

//   // 5. Clear the currently selected category (cross button logic)
//   const clearCategory = () => {
//     setCategorySearch("");
//     onCategoryChange("");
//   };

//   // 6. Close dropdown if clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         categoryContainerRef.current &&
//         !categoryContainerRef.current.contains(event.target)
//       ) {
//         setShowCategoryDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // 7. Keep local state in sync if selectedCategory changes externally
//   useEffect(() => {
//     setCategorySearch(selectedCategory);
//   }, [selectedCategory]);

//   // 8. Handle Reset
//   const handleResetClick = () => {
//     setCategorySearch("");
//     if (onReset) {
//       onReset();
//     }
//   };

//   return (
//     <Row className="mb-3 mt-3 align-items-center g-2">
//       {/* Main Search Input (not category) */}
//       {searchConfig.enabled && (
//         <Col xs="auto">
//           <Form.Control
//             type="text"
//             placeholder={searchConfig.placeholder}
//             value={searchTerm}
//             onChange={(e) => onSearch(e.target.value)}
//             size="sm"
//           />
//         </Col>
//       )}

//       {/* Status Filter Buttons */}
//       {statusFilter.enabled && (
//         <Col xs="auto">
//           <ButtonGroup size="sm">
//             <Button
//               variant={
//                 statusFilter.value === "all" ? "primary" : "outline-primary"
//               }
//               onClick={() => onStatusChange("all")}
//             >
//               All {statusFilter.label}
//             </Button>
//             {statusFilter.options.map((option) => (
//               <Button
//                 key={option.value}
//                 variant={
//                   statusFilter.value === option.value
//                     ? "primary"
//                     : "outline-primary"
//                 }
//                 onClick={() => onStatusChange(option.value)}
//               >
//                 {option.label}
//               </Button>
//             ))}
//           </ButtonGroup>
//         </Col>
//       )}

//       {/* Searchable Category Input */}
//       <Col xs="auto" ref={categoryContainerRef} className="position-relative">
//         <div className="position-relative" style={{ width: "200px" }}>
//           <Form.Control
//             size="sm"
//             placeholder="Type or select category..."
//             value={categorySearch}
//             onChange={(e) => {
//               setCategorySearch(e.target.value);
//               setShowCategoryDropdown(true); // Show dropdown as user types
//             }}
//             onFocus={() => {
//               if (categories.length > 0) {
//                 setShowCategoryDropdown(true);
//               }
//             }}
//             style={{ paddingRight: "2rem" }} // space for the cross
//           />
//           {categorySearch && (
//             <span
//               onClick={clearCategory}
//               title="Clear category"
//               style={{
//                 position: "absolute",
//                 right: "0.5rem",
//                 top: "50%",
//                 transform: "translateY(-50%)",
//                 cursor: "pointer",
//                 color: "#000",         // black color
//                 fontSize: "1.25rem",   // bigger size
//                 lineHeight: 1,
//               }}
//             >
//               ×
//             </span>
//           )}
//         </div>

//         {/* Dropdown for matching categories */}
//         {showCategoryDropdown && filteredCategories.length > 0 && (
//           <ListGroup
//             className="position-absolute w-100"
//             style={{
//               zIndex: 999,
//               maxHeight: "200px",
//               overflowY: "auto",
//               marginTop: "2px",
//             }}
//           >
//             {filteredCategories.map((cat) => (
//               <ListGroup.Item
//                 key={cat}
//                 action
//                 onClick={() => handleCategorySelect(cat)}
//               >
//                 {cat}
//               </ListGroup.Item>
//             ))}
//           </ListGroup>
//         )}
//       </Col>

//       {/* Date Filters (optional) */}
//       {dateFilter.enabled && (
//         <>
//           <Col xs="auto">
//             <Form.Control
//               type="date"
//               value={fromDate}
//               onChange={(e) =>
//                 onDateFilterChange({ fromDate: e.target.value, toDate })
//               }
//               placeholder="From Date"
//               size="sm"
//             />
//           </Col>

//           <Col xs="auto">
//             <Form.Control
//               type="date"
//               value={toDate}
//               onChange={(e) =>
//                 onDateFilterChange({ fromDate, toDate: e.target.value })
//               }
//               placeholder="To Date"
//               size="sm"
//             />
//           </Col>
//         </>
//       )}

//       {/* Custom Element (optional) */}
//       {customElement && <Col xs="auto">{customElement.component}</Col>}

//       {/* Reset Button */}
//       <Col xs="auto">
//         <Button variant="outline-secondary" size="sm" onClick={handleResetClick}>
//           Reset
//         </Button>
//       </Col>

//       {/* Total Items Display */}
//       {totalItems !== undefined && (
//         <Col xs="auto" className="ms-auto">
//           <span>
//             {totalItemsLabel}: {totalItems}
//           </span>
//         </Col>
//       )}
//     </Row>
//   );
// };

// export default TableFilters;


// components/TableFilters.js
import React, { useState, useRef, useEffect } from "react";
import {
  Col,
  Form,
  Row,
  Button,
  ButtonGroup,
  ListGroup,
} from "react-bootstrap";

/**
 * Props:
 *
 * - searchConfig: {
 *     enabled: boolean,
 *     placeholder: string,
 *     fields: string[],
 *   }
 * - onSearch: (searchTerm: string) => void
 * - onReset: () => void
 * - searchTerm: string
 *
 * - statusFilter: {
 *     enabled: boolean,
 *     options: Array<{ value: string, label: string }>,
 *     value: string,
 *     label: string
 *   }
 * - onStatusChange: (status: string) => void
 *
 * - dateFilter: {
 *     enabled: boolean
 *   }
 * - fromDate: string
 * - toDate: string
 * - onDateFilterChange: (dateRange: { fromDate, toDate }) => void
 *
 * - totalItems: number
 * - totalItemsLabel: string
 *
 * - categories: string[]    // The array of possible categories
 * - selectedCategory: string
 * - onCategoryChange: (category: string) => void
 *
 * - customElement: { component: JSX.Element }
 */

const TableFilters = ({
  searchConfig = {
    enabled: true,
    placeholder: "Search...",
    fields: [],
  },
  onSearch,
  onReset,
  searchTerm = "",

  statusFilter = {
    enabled: false,
    options: [],
    value: "all",
    label: "Status",
  },
  onStatusChange,

  dateFilter = {
    enabled: true,
  },
  fromDate = "",
  toDate = "",
  onDateFilterChange,

  totalItems,
  totalItemsLabel = "Total Items",

  // Categories for the "search with dropdown"
  categories = [],
  selectedCategory = "",
  onCategoryChange,

  // Optional custom element (e.g. an extra button)
  customElement,
}) => {
  // 1. Local state for typed category input
  const [categorySearch, setCategorySearch] = useState(selectedCategory);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // 2. Ref for detecting clicks outside the category dropdown
  const categoryContainerRef = useRef(null);

  // 3. Filter categories based on what the user is typing
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // 4. Select a category from the dropdown
  const handleCategorySelect = (cat) => {
    setCategorySearch(cat);
    setShowCategoryDropdown(false);
    onCategoryChange(cat); // Notify parent about the chosen category
  };

  // 5. Clear the currently selected category (cross button logic)
  const clearCategory = () => {
    setCategorySearch("");
    onCategoryChange("");
  };

  // 6. Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 7. Keep local state in sync if selectedCategory changes externally
  useEffect(() => {
    setCategorySearch(selectedCategory);
  }, [selectedCategory]);

  // 8. Handle Reset
  const handleResetClick = () => {
    setCategorySearch("");
    if (onReset) {
      onReset();
    }
  };

  return (
    <Row className="mb-3 mt-3 align-items-center g-2">
      {/* Main Search Input (not category) */}
      {searchConfig.enabled && (
        <Col xs="auto">
          <Form.Control
            type="text"
            placeholder={searchConfig.placeholder}
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            size="sm"
          />
        </Col>
      )}

      {/* Status Filter Buttons */}
      {statusFilter.enabled && (
        <Col xs="auto">
          <ButtonGroup size="sm">
            <Button
              variant={
                statusFilter.value === "all" ? "primary" : "outline-primary"
              }
              onClick={() => onStatusChange("all")}
            >
              All {statusFilter.label}
            </Button>
            {statusFilter.options.map((option) => (
              <Button
                key={option.value}
                variant={
                  statusFilter.value === option.value
                    ? "primary"
                    : "outline-primary"
                }
                onClick={() => onStatusChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
      )}

      {/* Only render the Category Input if categories has items */}
      {categories.length > 0 && (
        <Col xs="auto" ref={categoryContainerRef} className="position-relative">
          <div className="position-relative" style={{ width: "200px" }}>
            <Form.Control
              size="sm"
              placeholder="Type or select category..."
              value={categorySearch}
              onChange={(e) => {
                setCategorySearch(e.target.value);
                setShowCategoryDropdown(true); // Show dropdown as user types
              }}
              onFocus={() => {
                if (categories.length > 0) {
                  setShowCategoryDropdown(true);
                }
              }}
              style={{ paddingRight: "2rem" }} // space for the cross
            />
            {categorySearch && (
              <span
                onClick={clearCategory}
                title="Clear category"
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#000",         // black color
                  fontSize: "1.25rem",   // bigger size
                  lineHeight: 1,
                }}
              >
                ×
              </span>
            )}
          </div>

          {/* Dropdown for matching categories */}
          {showCategoryDropdown && filteredCategories.length > 0 && (
            <ListGroup
              className="position-absolute w-100"
              style={{
                zIndex: 999,
                maxHeight: "200px",
                overflowY: "auto",
                marginTop: "2px",
              }}
            >
              {filteredCategories.map((cat) => (
                <ListGroup.Item
                  key={cat}
                  action
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      )}

      {/* Date Filters (optional) */}
      {dateFilter.enabled && (
        <>
          <Col xs="auto">
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) =>
                onDateFilterChange({ fromDate: e.target.value, toDate })
              }
              placeholder="From Date"
              size="sm"
            />
          </Col>

          <Col xs="auto">
            <Form.Control
              type="date"
              value={toDate}
              onChange={(e) =>
                onDateFilterChange({ fromDate, toDate: e.target.value })
              }
              placeholder="To Date"
              size="sm"
            />
          </Col>
        </>
      )}

      {/* Custom Element (optional) */}
      {customElement && <Col xs="auto">{customElement.component}</Col>}

      {/* Reset Button */}
      <Col xs="auto">
        <Button variant="outline-secondary" size="sm" onClick={handleResetClick}>
          Reset
        </Button>
      </Col>

      {/* Total Items Display */}
      {totalItems !== undefined && (
        <Col xs="auto" className="ms-auto">
          <span>
            {totalItemsLabel}: {totalItems}
          </span>
        </Col>
      )}
    </Row>
  );
};

export default TableFilters;
