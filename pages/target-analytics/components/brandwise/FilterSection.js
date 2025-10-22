// // pages/target-analytics/components/brandwise/FilterSection.js


// import React from "react";
// import { FINANCIAL_YEARS, SALES_PERSONS, REGIONS, STATES } from "utils/brandwise/constants";

// export default function FilterSection({
//   isMobile,
//   selectedYear,
//   setSelectedYear,
//   selectedSalesPerson,
//   setSelectedSalesPerson,
//   selectedRegion,
//   setSelectedRegion,
//   selectedState,
//   setSelectedState,
//   onApply,
//   onReset,
// }) {
//   // Custom Select Style
//   const selectStyle = (hasValue) => ({
//     width: "100%",
//     padding: isMobile ? "10px 35px 10px 12px" : "11px 40px 11px 14px",
//     borderRadius: "8px",
//     border: "2px solid #a7f3d0",
//     backgroundColor: "white",
//     color: hasValue ? "#15803d" : "#9ca3af",
//     fontSize: isMobile ? "12px" : "13px",
//     fontWeight: hasValue ? "600" : "500",
//     cursor: "pointer",
//     outline: "none",
//     transition: "all 0.3s ease",
//     appearance: "none",
//     backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2315803d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
//     backgroundRepeat: "no-repeat",
//     backgroundPosition: `right ${isMobile ? "8px" : "10px"} center`,
//     backgroundSize: isMobile ? "18px" : "20px",
//     boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
//   });

//   const labelStyle = {
//     display: "block",
//     color: "#15803d",
//     fontWeight: "700",
//     fontSize: isMobile ? "11px" : "12px",
//     marginBottom: "8px",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//   };

//   return (
//     <div
//       style={{
//         backgroundColor: "#f0fdf4",
//         borderRadius: "12px",
//         padding: isMobile ? "16px" : "20px",
//         border: "2px solid #a7f3d0",
//         boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
//         marginBottom: isMobile ? "16px" : "20px",
//       }}
//     >
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: isMobile ? "1fr" : "repeat(6, 1fr)",
//           gap: isMobile ? "16px" : "14px",
//           alignItems: "end",
//         }}
//       >
//         {/* Financial Year Dropdown */}
//         <div>
//           <label style={labelStyle}>
//             Financial Year <span style={{ color: "#dc2626", fontSize: "14px" }}>*</span>
//           </label>
//           <select
//             value={selectedYear}
//             onChange={(e) => setSelectedYear(e.target.value)}
//             style={selectStyle(true)}
//             onFocus={(e) => {
//               e.target.style.borderColor = "#15803d";
//               e.target.style.boxShadow = "0 0 0 3px rgba(21, 128, 61, 0.1)";
//             }}
//             onBlur={(e) => {
//               e.target.style.borderColor = "#a7f3d0";
//               e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
//             }}
//           >
//             {FINANCIAL_YEARS.map((year) => (
//               <option key={year} value={year} style={{ padding: "10px", backgroundColor: "white" }}>
//                 {year}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Sales Person Dropdown */}
//         <div>
//           <label style={labelStyle}>Sales Person</label>
//           <select
//             value={selectedSalesPerson}
//             onChange={(e) => setSelectedSalesPerson(e.target.value)}
//             style={selectStyle(selectedSalesPerson)}
//             onFocus={(e) => {
//               e.target.style.borderColor = "#15803d";
//               e.target.style.boxShadow = "0 0 0 3px rgba(21, 128, 61, 0.1)";
//             }}
//             onBlur={(e) => {
//               e.target.style.borderColor = "#a7f3d0";
//               e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
//             }}
//           >
//             <option value="" style={{ color: "#9ca3af", padding: "10px" }}>
//               Select Sales Person
//             </option>
//             {SALES_PERSONS.map((sp) => (
//               <option 
//                 key={sp.code} 
//                 value={sp.code}
//                 style={{ padding: "10px", backgroundColor: "white", color: "#15803d" }}
//               >
//                 {sp.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Region Dropdown */}
//         <div>
//           <label style={labelStyle}>Region</label>
//           <select
//             value={selectedRegion}
//             onChange={(e) => setSelectedRegion(e.target.value)}
//             style={selectStyle(selectedRegion)}
//             onFocus={(e) => {
//               e.target.style.borderColor = "#15803d";
//               e.target.style.boxShadow = "0 0 0 3px rgba(21, 128, 61, 0.1)";
//             }}
//             onBlur={(e) => {
//               e.target.style.borderColor = "#a7f3d0";
//               e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
//             }}
//           >
//             <option value="" style={{ color: "#9ca3af", padding: "10px" }}>
//               Select Region
//             </option>
//             {REGIONS.map((region) => (
//               <option 
//                 key={region} 
//                 value={region}
//                 style={{ padding: "10px", backgroundColor: "white", color: "#15803d" }}
//               >
//                 {region}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* State Dropdown */}
//         <div>
//           <label style={labelStyle}>State</label>
//           <select
//             value={selectedState}
//             onChange={(e) => setSelectedState(e.target.value)}
//             style={selectStyle(selectedState)}
//             onFocus={(e) => {
//               e.target.style.borderColor = "#15803d";
//               e.target.style.boxShadow = "0 0 0 3px rgba(21, 128, 61, 0.1)";
//             }}
//             onBlur={(e) => {
//               e.target.style.borderColor = "#a7f3d0";
//               e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
//             }}
//           >
//             <option value="" style={{ color: "#9ca3af", padding: "10px" }}>
//               Select State
//             </option>
//             {STATES.map((state) => (
//               <option 
//                 key={state} 
//                 value={state}
//                 style={{ padding: "10px", backgroundColor: "white", color: "#15803d" }}
//               >
//                 {state}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Reset Button */}
//         <div>
//           {!isMobile && <div style={{ height: "33px" }}></div>}
//           <button
//             onClick={onReset}
//             style={{
//               width: "100%",
//               padding: isMobile ? "11px 14px" : "12px 16px",
//               borderRadius: "8px",
//               border: "2px solid #a7f3d0",
//               backgroundColor: "white",
//               color: "#15803d",
//               fontSize: isMobile ? "12px" : "13px",
//               fontWeight: "700",
//               cursor: "pointer",
//               transition: "all 0.3s ease",
//               boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
//               whiteSpace: "nowrap",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               gap: "6px",
//             }}
//             onMouseOver={(e) => {
//               e.target.style.backgroundColor = "#dcfce7";
//               e.target.style.borderColor = "#15803d";
//               e.target.style.transform = "translateY(-2px)";
//               e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.12)";
//             }}
//             onMouseOut={(e) => {
//               e.target.style.backgroundColor = "white";
//               e.target.style.borderColor = "#a7f3d0";
//               e.target.style.transform = "translateY(0)";
//               e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.08)";
//             }}
//           >
//             <span style={{ fontSize: "16px" }}>🔄</span>
//             <span>Reset</span>
//           </button>
//         </div>

//         {/* Apply Button */}
//         <div>
//           {!isMobile && <div style={{ height: "33px" }}></div>}
//           <button
//             onClick={onApply}
//             style={{
//               width: "100%",
//               padding: isMobile ? "11px 14px" : "12px 16px",
//               borderRadius: "8px",
//               border: "2px solid #15803d",
//               backgroundColor: "#15803d",
//               color: "white",
//               fontSize: isMobile ? "12px" : "13px",
//               fontWeight: "700",
//               cursor: "pointer",
//               transition: "all 0.3s ease",
//               boxShadow: "0 2px 4px rgba(21, 128, 61, 0.3)",
//               whiteSpace: "nowrap",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               gap: "6px",
//             }}
//             onMouseOver={(e) => {
//               e.target.style.backgroundColor = "#166534";
//               e.target.style.transform = "translateY(-2px)";
//               e.target.style.boxShadow = "0 6px 12px rgba(21, 128, 61, 0.4)";
//             }}
//             onMouseOut={(e) => {
//               e.target.style.backgroundColor = "#15803d";
//               e.target.style.transform = "translateY(0)";
//               e.target.style.boxShadow = "0 2px 4px rgba(21, 128, 61, 0.3)";
//             }}
//           >
//             <span style={{ fontSize: "16px" }}>✓</span>
//             <span>Apply</span>
//           </button>
//         </div>
//       </div>

//       {/* Add custom CSS for better option styling */}
//       <style jsx>{`
//         select option {
//           padding: 12px !important;
//           background-color: white;
//           color: #15803d;
//           font-weight: 500;
//         }
        
//         select option:hover {
//           background-color: #f0fdf4 !important;
//         }
        
//         select option:checked {
//           background-color: #dcfce7 !important;
//           font-weight: 600;
//         }
        
//         select::-ms-expand {
//           display: none;
//         }
//       `}</style>
//     </div>
//   );
// }

// pages/target-analytics/components/brandwise/FilterSection.js
import React from "react";
import { FINANCIAL_YEARS, SALES_PERSONS, REGIONS, STATES } from "utils/brandwise/constants";

export default function FilterSection({
  isMobile,
  selectedYear,
  setSelectedYear,
  selectedSalesPerson,
  setSelectedSalesPerson,
  selectedRegion,
  setSelectedRegion,
  selectedState,
  setSelectedState,
  onReset,
}) {
  // Custom Select Style
  const selectStyle = (hasValue) => ({
    width: "100%",
    padding: isMobile ? "10px 35px 10px 12px" : "11px 40px 11px 14px",
    borderRadius: "8px",
    border: "2px solid #a7f3d0",
    backgroundColor: "white",
    color: hasValue ? "#15803d" : "#9ca3af",
    fontSize: isMobile ? "12px" : "13px",
    fontWeight: hasValue ? "600" : "500",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.3s ease",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2315803d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `right ${isMobile ? "8px" : "10px"} center`,
    backgroundSize: isMobile ? "18px" : "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  });

  const labelStyle = {
    display: "block",
    color: "#15803d",
    fontWeight: "700",
    fontSize: isMobile ? "11px" : "12px",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <div
      style={{
        backgroundColor: "#f0fdf4",
        borderRadius: "12px",
        padding: isMobile ? "16px" : "20px",
        border: "2px solid #a7f3d0",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        marginBottom: isMobile ? "16px" : "20px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
          gap: isMobile ? "16px" : "14px",
          alignItems: "end",
        }}
      >
        {/* Financial Year Dropdown */}
        <div>
          <label style={labelStyle}>
            Financial Year <span style={{ color: "#dc2626", fontSize: "14px" }}>*</span>
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={selectStyle(true)}
            onFocus={(e) => {
              e.target.style.borderColor = "#15803d";
              e.target.style.boxShadow = "0 0 0 3px rgba(21, 128, 61, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#a7f3d0";
              e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
          >
            {FINANCIAL_YEARS.map((year) => (
              <option key={year} value={year} style={{ padding: "10px", backgroundColor: "white" }}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Sales Person Dropdown */}
        <div>
          <label style={labelStyle}>Sales Person</label>
          <select
            value={selectedSalesPerson}
            onChange={(e) => setSelectedSalesPerson(e.target.value)}
            style={selectStyle(selectedSalesPerson)}
            onFocus={(e) => {
              e.target.style.borderColor = "#15803d";
              e.target.style.boxShadow = "0 0 0 3px rgba(21, 128, 61, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#a7f3d0";
              e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
          >
            <option value="" style={{ color: "#9ca3af", padding: "10px" }}>
              Select Sales Person
            </option>
            {SALES_PERSONS.map((sp) => (
              <option 
                key={sp.code} 
                value={sp.code}
                style={{ padding: "10px", backgroundColor: "white", color: "#15803d" }}
              >
                {sp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Region Dropdown */}
        <div>
          <label style={labelStyle}>Region</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={selectStyle(selectedRegion)}
            onFocus={(e) => {
              e.target.style.borderColor = "#15803d";
              e.target.style.boxShadow = "0 0 0 3px rgba(21, 128, 61, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#a7f3d0";
              e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
          >
            <option value="" style={{ color: "#9ca3af", padding: "10px" }}>
              Select Region
            </option>
            {REGIONS.map((region) => (
              <option 
                key={region} 
                value={region}
                style={{ padding: "10px", backgroundColor: "white", color: "#15803d" }}
              >
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* State Dropdown */}
        <div>
          <label style={labelStyle}>State</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={selectStyle(selectedState)}
            onFocus={(e) => {
              e.target.style.borderColor = "#15803d";
              e.target.style.boxShadow = "0 0 0 3px rgba(21, 128, 61, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#a7f3d0";
              e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
          >
            <option value="" style={{ color: "#9ca3af", padding: "10px" }}>
              Select State
            </option>
            {STATES.map((state) => (
              <option 
                key={state} 
                value={state}
                style={{ padding: "10px", backgroundColor: "white", color: "#15803d" }}
              >
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button Only */}
        <div>
          {!isMobile && <div style={{ height: "33px" }}></div>}
          <button
            onClick={onReset}
            style={{
              width: "100%",
              padding: isMobile ? "11px 14px" : "12px 16px",
              borderRadius: "8px",
              border: "2px solid #a7f3d0",
              backgroundColor: "white",
              color: "#15803d",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#dcfce7";
              e.target.style.borderColor = "#15803d";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.12)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#a7f3d0";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.08)";
            }}
          >
            <span style={{ fontSize: "16px" }}>🔄</span>
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Add custom CSS for better option styling */}
      <style jsx>{`
        select option {
          padding: 12px !important;
          background-color: white;
          color: #15803d;
          font-weight: 500;
        }
        
        select option:hover {
          background-color: #f0fdf4 !important;
        }
        
        select option:checked {
          background-color: #dcfce7 !important;
          font-weight: 600;
        }
        
        select::-ms-expand {
          display: none;
        }
      `}</style>
    </div>
  );
}