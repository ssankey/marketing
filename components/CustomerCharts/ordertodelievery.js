

//   // components/CustomerCharts/ordertodelivery.js
// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { Bar } from "react-chartjs-2";
// import { Spinner, Table, Button, Dropdown } from "react-bootstrap";
// import Select from "react-select";
// import debounce from "lodash/debounce";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// } from "chart.js";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// /* ------------------------------------------------------------------ */
// /* helper APIs                                                         */
// /* ------------------------------------------------------------------ */
// const API_ENDPOINTS = {
//   salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
//   category   : "/api/products/categories",
//   customer   : "/api/customers/distinct-customer",
//   product    : "/api/products/distinct-product",
// };

// export default function DeliveryPerformanceChart({ customerId }) {
//   /* ------------------------------ state --------------------------- */
//   const [data,  setData]  = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [searchType, setSearchType]   = useState(null);
//   const [suggestions, setSuggestions] = useState([]);
//   const [loadingSuggestions, setLS]   = useState(false);
//   const [selectedValue, setSelectedValue] = useState(null);
//   const [inputValue,    setInputValue]    = useState("");
//   const cache = useRef({});

//   const [filters, setFilters] = useState({
//     salesPerson : null,
//     category    : null,
//     customer    : null,
//     product     : null,
//   });

//   /* ------------------------------ data fetch ---------------------- */
//   const fetchData = async (active) => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       if (active.salesPerson) params.append("salesPerson", active.salesPerson.value);
//       if (active.category   ) params.append("category"   , active.category.value);
//       if (active.customer   ) params.append("customer"   , active.customer.value);
//       if (active.product    ) params.append("product"    , active.product.value);

//       const url = customerId
//         ? `/api/customers/${customerId}/delivery-performance?${params}`
//         : `/api/customers/all-delivery-performance?${params}`;

//       const res = await fetch(url);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       setData(await res.json());
//     } catch (err) {
//       console.error("fetch error:", err);
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   };
//   useEffect(() => { fetchData(filters); }, [customerId, filters]);

//   /* ------------------------------ suggestions --------------------- */
//   const getSuggestions = async (q="", initial=false) => {
//     if (!searchType) return;
//     if (!initial && !q) return;

//     const key = `${searchType}_${q}`;
//     if (cache.current[key]) return setSuggestions(cache.current[key]);

//     setLS(true);
//     try {
//       const res  = await fetch(`${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(q)}`);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const json = await res.json();

//       let opts = [];
//       switch (searchType) {
//         case "salesPerson":
//           opts = json.salesEmployees?.map(e => ({ value: e.value,  label: `${e.value} - ${e.label}` })) ?? [];
//           break;
//         case "category":
//           opts = json.categories?.map(c => ({ value: c.value ?? c, label: c.label ?? c })) ?? [];
//           break;
//         case "customer":
//           opts = json.customers?.map(c => ({ value: c.value, label: c.label })) ?? [];
//           break;
//         case "product":
//           opts = json.products?.map(p => ({ value: p.value, label: p.label })) ?? [];
//           break;
//         default: break;
//       }
//       cache.current[key] = opts;
//       setSuggestions(opts);
//     } catch (err) {
//       console.error("suggestion error:", err);
//       setSuggestions([]);
//     } finally {
//       setLS(false);
//     }
//   };
//   const debouncedFetch = useCallback(debounce(getSuggestions, 500), [searchType]);

//   /* ------------------------------ handlers ------------------------ */
//   const chooseType = async (type) => {
//     setSearchType(type);
//     setSelectedValue(null);
//     setInputValue("");
//     setSuggestions([]);
//     await getSuggestions("", true);
//   };

//   const chooseOption = (opt) => {
//     setSelectedValue(opt);
//     setFilters(prev => ({ ...prev, [searchType]: opt ? { value: opt.value, label: opt.label } : null }));
//   };

//   const resetAll = () => {
//     setSearchType(null);
//     setSelectedValue(null);
//     setInputValue("");
//     setFilters({ salesPerson:null, category:null, customer:null, product:null });
//   };

//   /* ------------------------------ chart --------------------------- */
//   const chartData = {
//     labels: data.map(d => d.month),
//     datasets: [
//       { label:"0–3 days", backgroundColor:"#4CAF50", data:data.map(d=>d.green ) },
//       { label:"4–5 days", backgroundColor:"#FF9800", data:data.map(d=>d.orange) },
//       { label:"6–8 days", backgroundColor:"#2196F3", data:data.map(d=>d.blue  ) },
//       { label:"9–10 days",backgroundColor:"#9C27B0", data:data.map(d=>d.purple) },
//       { label:">10 days", backgroundColor:"#F44336", data:data.map(d=>d.red   ) },
//     ],
//   };

//   /* hover-once-show-everything:  use interaction.mode = "index" &
//      tooltip.mode = "index" with intersect false                    */
//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     interaction: { mode: "index", intersect: false },
//     plugins: {
//       datalabels: {
//         display: false,
//       },
//       tooltip: {
//         mode: "index",
//         intersect: false,
//         padding: 12,
//         titleFont: { size: 16, weight: "bold" },
//         bodyFont: { size: 14, weight: "bold" },
//       },
//       legend: { position: "top" },
//     },
//     scales: {
//       x: { grid: { display: false } },
//       y: {
//         beginAtZero: true,
//         title: { display: true, text: "Number of Orders" },
//       },
//     },
//   };

//   /* ------------------------------ render -------------------------- */
//   const labelMap = {salesPerson:"Sales Person",category:"Category",customer:"Customer",product:"Product"};
//   const anyActive = Object.values(filters).some(Boolean);

//   return (
//     <div className="bg-white rounded-lg shadow-sm">
//       {/* header w/ filters */}
//       <div className="p-4 border-b">
//         <div className="d-flex justify-content-between align-items-center">
//           <h4 className="mb-0 fw-semibold">Order → Invoice Performance</h4>

//           <div className="d-flex gap-2 align-items-center">
//             <Dropdown onSelect={chooseType}>
//               <Dropdown.Toggle variant="outline-secondary" id="filter-type">
//                 {searchType ? labelMap[searchType] : "Filter By"}
//               </Dropdown.Toggle>
//               <Dropdown.Menu>
//                 <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>
//                 <Dropdown.Item eventKey="category"   >Category</Dropdown.Item>
//                 <Dropdown.Item eventKey="customer"   >Customer</Dropdown.Item>
//                 <Dropdown.Item eventKey="product"    >Product</Dropdown.Item>
//               </Dropdown.Menu>
//             </Dropdown>

//             <div style={{width:300}}>
//               <Select
//                 value={selectedValue}
//                 inputValue={inputValue}
//                 onChange={chooseOption}
//                 onInputChange={(v,{action})=>{
//                   if(action==="input-change"){ setInputValue(v); debouncedFetch(v); }
//                 }}
//                 onFocus={()=> searchType && getSuggestions(inputValue,true)}
//                 options={suggestions}
//                 isLoading={loadingSuggestions}
//                 isClearable
//                 isDisabled={!searchType}
//                 placeholder={searchType ? `Search ${labelMap[searchType]}` : "Select filter type"}
//               />
//             </div>

//             <Button variant="primary" onClick={resetAll} disabled={!anyActive && !searchType}>
//               Reset
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* chart & table */}
//       <div className="p-4 bg-gray-50">
//         {loading ? (
//           <div className="d-flex justify-content-center align-items-center" style={{height:500}}>
//             <Spinner animation="border" />
//           </div>
//         ) : data.length ? (
//           <>
//             <div style={{height:500}}>
//               <Bar data={chartData} options={chartOptions} />
//             </div>

//             {/* table */}
//             <div className="mt-4">
//               <Table striped bordered hover responsive>
//                 <thead>
//                   <tr>
//                     <th>Range / Month</th>
//                     {data.map((d,i)=><th key={i}>{d.month}</th>)}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {[
//                     ["0–3 Days","green"],
//                     ["4–5 Days","orange"],
//                     ["6–8 Days","blue"],
//                     ["9–10 Days","purple"],
//                     [">10 Days","red"]
//                   ].map(([lbl,key])=>(
//                     <tr key={key}>
//                       <td>{lbl}</td>
//                       {data.map((d,i)=><td key={i}>{d[key]}</td>)}
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           </>
//         ) : (
//           <p className="text-center m-0">No delivery performance data available</p>
//         )}
//       </div>
//     </div>
//   );
// }


// components/CustomerCharts/ordertodelivery.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Table, Button, Dropdown } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ------------------------------------------------------------------ */
/* helper APIs                                                         */
/* ------------------------------------------------------------------ */
const API_ENDPOINTS = {
  salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
  category: "/api/products/categories",
  customer: "/api/customers/distinct-customer",
  product: "/api/products/distinct-product",
};

export default function DeliveryPerformanceChart({ customerId }) {
  /* ------------------------------ state --------------------------- */
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLS] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const cache = useRef({});

  const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
    customer: null,
    product: null,
  });

  /* ------------------------------------------------------------------
     decide which filter types are allowed on this page
     ‣ dashboard   : 4 filters
     ‣ customer page: only salesPerson & category
  ------------------------------------------------------------------ */
  const allowedTypes = customerId
    ? ["salesPerson", "category"]
    : ["salesPerson", "category", "customer", "product"];

  /* prevent stale searchType after navigation */
  useEffect(() => {
    if (searchType && !allowedTypes.includes(searchType)) {
      setSearchType(null);
      setSelectedValue(null);
      setInputValue("");
    }
  }, [searchType, allowedTypes]);

  /* ------------------------------ data fetch ---------------------- */
  // const fetchData = async (active) => {
  //   setLoading(true);
  //   try {
  //     const params = new URLSearchParams();
  //     if (active.salesPerson) params.append("salesPerson", active.salesPerson.value);
  //     if (active.category) params.append("category", active.category.value);
  //     if (active.customer) params.append("customer", active.customer.value);
  //     if (active.product) params.append("product", active.product.value);

  //     const url = customerId
  //       ? `/api/customers/${customerId}/delivery-performance?${params}`
  //       : `/api/customers/all-delivery-performance?${params}`;

  //     const res = await fetch(url);
  //     if (!res.ok) throw new Error(`HTTP ${res.status}`);
  //     setData(await res.json());
  //   } catch (err) {
  //     console.error("fetch error:", err);
  //     setData([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchData = async (active) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (active.salesPerson) params.append("salesPerson", active.salesPerson);
      if (active.category) params.append("category", active.category);
      if (active.customer) params.append("customer", active.customer);
      if (active.product) params.append("product", active.product);

      const url = customerId
        ? `/api/customers/${customerId}/delivery-performance?${params}`
        : `/api/customers/all-delivery-performance?${params}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (err) {
      console.error("fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, filters]);

  /* ------------------------------ suggestions --------------------- */
  const getSuggestions = async (q = "", initial = false) => {
    if (!searchType || !allowedTypes.includes(searchType)) return;
    if (!initial && !q) return;

    const key = `${searchType}_${q}`;
    if (cache.current[key]) return setSuggestions(cache.current[key]);

    setLS(true);
    try {
      const res = await fetch(`${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let opts = [];
      switch (searchType) {
        case "salesPerson":
          opts =
            json.salesEmployees?.map((e) => ({ value: e.value, label: `${e.value} - ${e.label}` })) ?? [];
          break;
        case "category":
          opts = json.categories?.map((c) => ({ value: c.value ?? c, label: c.label ?? c })) ?? [];
          break;
        case "customer":
          opts = json.customers?.map((c) => ({ value: c.value, label: c.label })) ?? [];
          break;
        case "product":
          opts = json.products?.map((p) => ({ value: p.value, label: p.label })) ?? [];
          break;
        default:
          break;
      }
      cache.current[key] = opts;
      setSuggestions(opts);
    } catch (err) {
      console.error("suggestion error:", err);
      setSuggestions([]);
    } finally {
      setLS(false);
    }
  };
  const debouncedFetch = useCallback(debounce(getSuggestions, 500), [searchType]);

  /* ------------------------------ handlers ------------------------ */
  const chooseType = async (type) => {
    if (!allowedTypes.includes(type)) return; // guard
    setSearchType(type);
    setSelectedValue(null);
    setInputValue("");
    setSuggestions([]);
    await getSuggestions("", true);
  };

  // const chooseOption = (opt) => {
  //   setSelectedValue(opt);
  //   setFilters((prev) => ({ ...prev, [searchType]: opt ? { value: opt.value, label: opt.label } : null }));
  // };
  const chooseOption = (opt) => {
    setSelectedValue(opt);
    setFilters((prev) => ({
      ...prev,
      [searchType]: opt ? opt.value : null,
    }));
  };

  // const resetAll = () => {
  //   setSearchType(null);
  //   setSelectedValue(null);
  //   setInputValue("");
  //   setFilters({ salesPerson: null, category: null, customer: null, product: null });
  // };
  const resetAll = () => {
    setSearchType(null);
    setSelectedValue(null);
    setInputValue("");
    setFilters({
      salesPerson: null,
      category: null,
      customer: null,
      product: null,
    });
  };

  /* ------------------------------ chart --------------------------- */
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      { label: "0–3 days", backgroundColor: "#4CAF50", data: data.map((d) => d.green) },
      { label: "4–5 days", backgroundColor: "#FF9800", data: data.map((d) => d.orange) },
      { label: "6–8 days", backgroundColor: "#2196F3", data: data.map((d) => d.blue) },
      { label: "9–10 days", backgroundColor: "#9C27B0", data: data.map((d) => d.purple) },
      { label: ">10 days", backgroundColor: "#F44336", data: data.map((d) => d.red) },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        padding: 12,
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 14, weight: "bold" },
      },
      legend: { position: "top" },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Orders" },
      },
    },
  };

  /* ------------------------------ render -------------------------- */
  const labelMap = {
    salesPerson: "Sales Person",
    category: "Category",
    customer: "Customer",
    product: "Product",
  };
  const anyActive = Object.values(filters).some(Boolean);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* header w/ filters */}
      <div className="p-4 border-b">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0 fw-semibold">Order → Invoice Performance</h4>

          <div className="d-flex gap-2 align-items-center">
            <Dropdown onSelect={chooseType}>
              <Dropdown.Toggle variant="outline-secondary" id="filter-type">
                {searchType ? labelMap[searchType] : "Filter By"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {allowedTypes.includes("salesPerson") && (
                  <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>
                )}
                {allowedTypes.includes("category") && (
                  <Dropdown.Item eventKey="category">Category</Dropdown.Item>
                )}
                {allowedTypes.includes("customer") && (
                  <Dropdown.Item eventKey="customer">Customer</Dropdown.Item>
                )}
                {allowedTypes.includes("product") && (
                  <Dropdown.Item eventKey="product">Product</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>

            <div style={{ width: 300 }}>
              <Select
                value={selectedValue}
                inputValue={inputValue}
                onChange={chooseOption}
                onInputChange={(v, { action }) => {
                  if (action === "input-change") {
                    setInputValue(v);
                    debouncedFetch(v);
                  }
                }}
                onFocus={() => searchType && getSuggestions(inputValue, true)}
                options={suggestions}
                isLoading={loadingSuggestions}
                isClearable
                isDisabled={!searchType}
                placeholder={searchType ? `Search ${labelMap[searchType]}` : "Select filter type"}
              />
            </div>

            <Button variant="primary" onClick={resetAll} disabled={!anyActive && !searchType}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* chart & table */}
      <div className="p-4 bg-gray-50">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 500 }}>
            <Spinner animation="border" />
          </div>
        ) : data.length ? (
          <>
            <div style={{ height: 500 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* summary table */}
            <div className="mt-4">
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Range / Month</th>
                    {data.map((d, i) => (
                      <th key={i}>{d.month}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["0–3 Days", "green"],
                    ["4–5 Days", "orange"],
                    ["6–8 Days", "blue"],
                    ["9–10 Days", "purple"],
                    [">10 Days", "red"],
                  ].map(([lbl, key]) => (
                    <tr key={key}>
                      <td>{lbl}</td>
                      {data.map((d, i) => (
                        <td key={i}>{d[key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-center m-0">No delivery performance data available</p>
        )}
      </div>
    </div>
  );
}
