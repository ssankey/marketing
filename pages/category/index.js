

// // pages/category/index.js
// import React, { useEffect, useState } from "react";
// import { Container, Card, Form, Spinner } from "react-bootstrap";
// import MonthlyPivotTable from "components/Category/MonthlyPivotTable";

// const TABLE_TYPES = ["customer", "salesperson", "state", "category"];

// export default function MonthlyReportPage() {
//   const [data, setData] = useState({
//     customer: [],
//     salesperson: [],
//     state: [],
//     category: [],
//   });

//   const [categories, setCategories] = useState([]);
//   const [categoryFilters, setCategoryFilters] = useState({
//     customer: "",
//     salesperson: "",
//     state: "",
//   });
//   const [loading, setLoading] = useState({
//     customer: false,
//     salesperson: false,
//     state: false,
//     category: false,
//   });
//   const [initialLoad, setInitialLoad] = useState(true);

//   // Fetch categories on component mount
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await fetch("/api/products/categories");
//         const json = await res.json();
//         setCategories(json.categories || []);
//       } catch (error) {
//         console.error("Error fetching categories:", error);
//       }
//     };
//     fetchCategories();
//   }, []);

//   // Initial data fetch
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       setInitialLoad(true);
//       try {
//         for (const type of TABLE_TYPES) {
//           setLoading((prev) => ({ ...prev, [type]: true }));
//           const res = await fetch(`/api/category/monthlySales?type=${type}`);
//           const json = await res.json();
//           setData((prev) => ({ ...prev, [type]: json }));
//         }
//       } catch (error) {
//         console.error("Error fetching initial data:", error);
//       } finally {
//         setInitialLoad(false);
//         setLoading({
//           customer: false,
//           salesperson: false,
//           state: false,
//           category: false,
//         });
//       }
//     };
//     fetchInitialData();
//   }, []);

//   // Fetch filtered data when category filter changes
//   const fetchFilteredData = async (type, category) => {
//     setLoading((prev) => ({ ...prev, [type]: true }));
//     try {
//       const url = category
//         ? `/api/category/monthlySales?type=${type}&category=${encodeURIComponent(category)}`
//         : `/api/category/monthlySales?type=${type}`;

//       const res = await fetch(url);
//       const json = await res.json();
//       setData((prev) => ({ ...prev, [type]: json }));
//     } catch (error) {
//       console.error(`Error fetching filtered ${type} data:`, error);
//     } finally {
//       setLoading((prev) => ({ ...prev, [type]: false }));
//     }
//   };

//   // Handle category filter change
//   const handleCategoryChange = (type, category) => {
//     setCategoryFilters((prev) => ({ ...prev, [type]: category }));
//     fetchFilteredData(type, category);
//   };

//   const buildColumns = (sample) =>
//     sample
//       ? Object.keys(sample).map((key) => ({
//           accessorKey: key,
//           header: key,
//           isNumeric: typeof sample[key] === "number",
//         }))
//       : [];

//   const renderCategoryDropdown = (type) => (
//     <div className="mb-2 d-flex align-items-center gap-2">
//       <Form.Label className="mb-0 small">Filter by Category:</Form.Label>
//       <Form.Select
//         value={categoryFilters[type]}
//         onChange={(e) => handleCategoryChange(type, e.target.value)}
//         size="sm"
//         style={{ width: "200px" }}
//         disabled={initialLoad}
//       >
//         <option value="">All Categories</option>
//         {categories.map((category, index) => (
//           <option key={index} value={category}>
//             {category}
//           </option>
//         ))}
//       </Form.Select>
//     </div>
//   );

//   // Enhanced loader component
//   const renderLoader = () => (
//     <div className="d-flex flex-column align-items-center justify-content-center py-5">
//       <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
//       <div className="mt-3 text-primary fw-semibold">Loading sales data...</div>
//     </div>
//   );

//   // Skeleton loader for when initial data is loading
//   if (initialLoad) {
//     return (
//       <Container className="mt-4" fluid>
//         <Card className="mb-3 shadow-sm">
//           <Card.Header className="bg-white py-3">
//             <h5 className="mb-0">Loading Sales Reports...</h5>
//           </Card.Header>
//           <Card.Body>
//             {renderLoader()}
//           </Card.Body>
//         </Card>
//       </Container>
//     );
//   }

//   return (
//     <Container className="mt-2" fluid>
//       {/* CATEGORY TABLE CARD */}
//       <Card className="mb-2 shadow-sm">
//         <Card.Header className="bg-white py-2 px-3">
//           <h5 className="mb-0">Category-wise Monthly Sales</h5>
//         </Card.Header>
//         <Card.Body className="p-2">
//           {loading.category ? (
//             renderLoader()
//           ) : (
//             <MonthlyPivotTable
//               data={data.category}
//               columns={buildColumns(data.category[0])}
//               type="category"
//               categoryFilter=""
//             />
//           )}
//         </Card.Body>
//       </Card>

//       {/* CUSTOMER TABLE CARD */}
//       <Card className="mb-2 shadow-sm">
//         <Card.Header className="bg-white py-2 px-3">
//           <h5 className="mb-0">Customer-wise Monthly Sales</h5>
//         </Card.Header>
//         <Card.Body className="p-2">
//           {renderCategoryDropdown("customer")}
//           {loading.customer ? (
//             renderLoader()
//           ) : (
//             <MonthlyPivotTable
//               data={data.customer}
//               columns={buildColumns(data.customer[0])}
//               type="customer"
//               categoryFilter={categoryFilters.customer}
//             />
//           )}
//         </Card.Body>
//       </Card>

//       {/* SALESPERSON TABLE CARD */}
//       <Card className="mb-2 shadow-sm">
//         <Card.Header className="bg-white py-2 px-3">
//           <h5 className="mb-0">Salesperson-wise Monthly Sales</h5>
//         </Card.Header>
//         <Card.Body className="p-2">
//           {renderCategoryDropdown("salesperson")}
//           {loading.salesperson ? (
//             renderLoader()
//           ) : (
//             <MonthlyPivotTable
//               data={data.salesperson}
//               columns={buildColumns(data.salesperson[0])}
//               type="salesperson"
//               categoryFilter={categoryFilters.salesperson}
//             />
//           )}
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }



import React, { useEffect, useState } from "react";
import { Container, Card, Form, Spinner } from "react-bootstrap";
import MonthlyPivotTable from "components/Category/MonthlyPivotTable";
import { useAuth } from "contexts/AuthContext"; // Import auth context

const TABLE_TYPES = ["customer", "salesperson", "state", "category"];

export default function MonthlyReportPage() {
  const { user } = useAuth(); // Get user from auth context
  const [data, setData] = useState({
    customer: [],
    salesperson: [],
    state: [],
    category: [],
  });

  const [categories, setCategories] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState({
    customer: "",
    salesperson: "",
    state: "",
  });
  const [loading, setLoading] = useState({
    customer: false,
    salesperson: false,
    state: false,
    category: false,
  });
  const [initialLoad, setInitialLoad] = useState(true);

  // ✅ Check if user is 3ASenrise
  const is3ASenrise = user?.role === '3ASenrise';
  const forcedCategory = is3ASenrise ? '3A Chemicals' : null;

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        const json = await res.json();
        setCategories(json.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    
    if (!is3ASenrise) {
      fetchCategories();
    }
  }, [is3ASenrise]);

  // Initial data fetch
  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      setInitialLoad(true);
      try {
        // ✅ For 3ASenrise, only fetch customer data
        const typesToFetch = is3ASenrise ? ['customer'] : TABLE_TYPES;
        
        for (const type of typesToFetch) {
          setLoading((prev) => ({ ...prev, [type]: true }));
          
          // ✅ Add category filter for 3ASenrise
          const url = forcedCategory 
            ? `/api/category/monthlySales?type=${type}&category=${encodeURIComponent(forcedCategory)}`
            : `/api/category/monthlySales?type=${type}`;
            
          const res = await fetch(url);
          const json = await res.json();
          setData((prev) => ({ ...prev, [type]: json }));
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setInitialLoad(false);
        setLoading({
          customer: false,
          salesperson: false,
          state: false,
          category: false,
        });
      }
    };
    
    fetchInitialData();
  }, [user, is3ASenrise, forcedCategory]);

  // Fetch filtered data when category filter changes
  const fetchFilteredData = async (type, category) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      // ✅ For 3ASenrise, always use forced category
      const finalCategory = forcedCategory || category;
      
      const url = finalCategory
        ? `/api/category/monthlySales?type=${type}&category=${encodeURIComponent(finalCategory)}`
        : `/api/category/monthlySales?type=${type}`;

      const res = await fetch(url);
      const json = await res.json();
      setData((prev) => ({ ...prev, [type]: json }));
    } catch (error) {
      console.error(`Error fetching filtered ${type} data:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Handle category filter change
  const handleCategoryChange = (type, category) => {
    setCategoryFilters((prev) => ({ ...prev, [type]: category }));
    fetchFilteredData(type, category);
  };

  const buildColumns = (sample) =>
    sample
      ? Object.keys(sample).map((key) => ({
          accessorKey: key,
          header: key,
          isNumeric: typeof sample[key] === "number",
        }))
      : [];

  const renderCategoryDropdown = (type) => {
    // ✅ Hide dropdown for 3ASenrise users
    if (is3ASenrise) {
      return (
        <div className="mb-2">
          <span className="badge bg-success">Filtered by: 3A Chemicals</span>
        </div>
      );
    }
    
    return (
      <div className="mb-2 d-flex align-items-center gap-2">
        <Form.Label className="mb-0 small">Filter by Category:</Form.Label>
        <Form.Select
          value={categoryFilters[type]}
          onChange={(e) => handleCategoryChange(type, e.target.value)}
          size="sm"
          style={{ width: "200px" }}
          disabled={initialLoad}
        >
          <option value="">All Categories</option>
          {categories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}
        </Form.Select>
      </div>
    );
  };

  // Enhanced loader component
  const renderLoader = () => (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      <div className="mt-3 text-primary fw-semibold">Loading sales data...</div>
    </div>
  );

  // Skeleton loader for when initial data is loading
  if (initialLoad) {
    return (
      <Container className="mt-4" fluid>
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-white py-3">
            <h5 className="mb-0">Loading Sales Reports...</h5>
          </Card.Header>
          <Card.Body>
            {renderLoader()}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-2" fluid>
      {/* ✅ Only show Category table if NOT 3ASenrise */}
      {!is3ASenrise && (
        <Card className="mb-2 shadow-sm">
          <Card.Header className="bg-white py-2 px-3">
            <h5 className="mb-0">Category-wise Monthly Sales</h5>
          </Card.Header>
          <Card.Body className="p-2">
            {loading.category ? (
              renderLoader()
            ) : (
              <MonthlyPivotTable
                data={data.category}
                columns={buildColumns(data.category[0])}
                type="category"
                categoryFilter=""
              />
            )}
          </Card.Body>
        </Card>
      )}

      {/* CUSTOMER TABLE CARD - Always show */}
      <Card className="mb-2 shadow-sm">
        <Card.Header className="bg-white py-2 px-3">
          <h5 className="mb-0">
            Customer-wise Monthly Sales
            {is3ASenrise && <span className="ms-2 badge bg-success">3A Chemicals</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-2">
          {renderCategoryDropdown("customer")}
          {loading.customer ? (
            renderLoader()
          ) : (
            <MonthlyPivotTable
              data={data.customer}
              columns={buildColumns(data.customer[0])}
              type="customer"
              categoryFilter={forcedCategory || categoryFilters.customer}
            />
          )}
        </Card.Body>
      </Card>

      {/* ✅ Only show Salesperson table if NOT 3ASenrise */}
      {!is3ASenrise && (
        <Card className="mb-2 shadow-sm">
          <Card.Header className="bg-white py-2 px-3">
            <h5 className="mb-0">Salesperson-wise Monthly Sales</h5>
          </Card.Header>
          <Card.Body className="p-2">
            {renderCategoryDropdown("salesperson")}
            {loading.salesperson ? (
              renderLoader()
            ) : (
              <MonthlyPivotTable
                data={data.salesperson}
                columns={buildColumns(data.salesperson[0])}
                type="salesperson"
                categoryFilter={categoryFilters.salesperson}
              />
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}