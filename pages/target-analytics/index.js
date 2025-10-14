// // ============================================================
// // target-analytics/index.js
// import React, { useState } from "react";
// import BrandQuarterwise from "./components/BrandQuarterwise";
// import RegionQuarterwise from "./components/RegionQuarterwise";
// import BrandPercentage from "./components/BrandPercentage";
// import RegionPercentage from "./components/RegionPercentage";

// export default function TARGET_ANALYTICS() {
//   const [selected, setSelected] = useState("Brand-Quarterwise");
//   const buttons = [
//     "Brand-Quarterwise",
//     "Region-Quarterwise",
//     "Brand Percentage",
//     "Region Percentage",
//   ];

//   const renderContent = () => {
//     switch (selected) {
//       case "Brand-Quarterwise":
//         return <BrandQuarterwise />;
//       case "Region-Quarterwise":
//         return <RegionQuarterwise />;
//       case "Brand Percentage":
//         return <BrandPercentage />;
//       case "Region Percentage":
//         return <RegionPercentage />;
//       default:
//         return <BrandQuarterwise />;
//     }
//   };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background:
//           "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)",
//         padding: "24px",
//       }}
//     >
//       <div style={{ width: "100%" }}>
//         <div
//           style={{
//             backgroundColor: "white",
//             borderRadius: "16px",
//             boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//             border: "1px solid #dbeafe",
//           }}
//         >
//           {/* Buttons Section */}
//           <div
//             style={{
//               padding: "25px",
//               display: "flex",
//               flexWrap: "wrap",
//               justifyContent: "center",
//               gap: "16px",
//             }}
//           >
//             {buttons.map((label) => (
//               <button
//                 key={label}
//                 onClick={() => setSelected(label)}
//                 style={{
//                   padding: "12px 20px",
//                   borderRadius: "8px",
//                   fontWeight: "400",
//                   cursor: "pointer",
//                   border:
//                     selected === label
//                       ? "2px solid #15803d"
//                       : "2px solid #a7f3d0",
//                   backgroundColor:
//                     selected === label ? "#15803d" : "white",
//                   color: selected === label ? "white" : "#15803d",
//                   transition: "all 0.2s ease",
//                   minWidth: "180px",
//                   textAlign: "center",
//                   boxShadow:
//                     "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
//                 }}
//                 onMouseOver={(e) => {
//                   if (selected !== label)
//                     e.target.style.backgroundColor = "#dcfce7";
//                 }}
//                 onMouseOut={(e) => {
//                   if (selected !== label)
//                     e.target.style.backgroundColor = "white";
//                 }}
//               >
//                 {label}
//               </button>
//             ))}
//           </div>

//           {/* Content Section */}
//           <div style={{ minHeight: "400px" }}>
//             {renderContent()}
//           </div>

//           {/* Footer */}
//           <div
//             style={{
//               background: "linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)",
//               borderTop: "1px solid #86efac",
//               padding: "16px",
//               textAlign: "center",
//               borderRadius: "0 0 16px 16px",
//             }}
//           >
//             <p
//               style={{
//                 fontSize: "14px",
//                 color: "#15803d",
//                 margin: 0,
//               }}
//             >
//               Selected Report:{" "}
//               <span style={{ fontWeight: "bold", color: "#166534" }}>
//                 {selected}
//               </span>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState } from "react";
import BrandwiseAnalysis from "./components/BrandwiseAnalysis";
import PercentageAnalysis from "./components/PercentageAnalysis";

export default function TARGET_ANALYTICS() {
  const [selected, setSelected] = useState("Brandwise Target Analysis");
  const buttons = ["Brandwise Target Analysis", "Percentage Analysis"];

  const renderContent = () => {
    switch (selected) {
      case "Brandwise Target Analysis":
        return <BrandwiseAnalysis />;
      case "Percentage Analysis":
        return <PercentageAnalysis />;
      default:
        return <BrandwiseAnalysis />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #dbeafe",
          }}
        >
          {/* Buttons Section */}
          <div
            style={{
              padding: "25px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            {buttons.map((label) => (
              <button
                key={label}
                onClick={() => setSelected(label)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "8px",
                  fontWeight: "400",
                  cursor: "pointer",
                  border:
                    selected === label
                      ? "2px solid #15803d"
                      : "2px solid #a7f3d0",
                  backgroundColor: selected === label ? "#15803d" : "white",
                  color: selected === label ? "white" : "#15803d",
                  transition: "all 0.2s ease",
                  minWidth: "220px",
                  textAlign: "center",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
                }}
                onMouseOver={(e) => {
                  if (selected !== label)
                    e.target.style.backgroundColor = "#dcfce7";
                }}
                onMouseOut={(e) => {
                  if (selected !== label)
                    e.target.style.backgroundColor = "white";
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content Section */}
          <div style={{ minHeight: "400px" }}>{renderContent()}</div>

          {/* Footer */}
          <div
            style={{
              background: "linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)",
              borderTop: "1px solid #86efac",
              padding: "16px",
              textAlign: "center",
              borderRadius: "0 0 16px 16px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#15803d",
                margin: 0,
              }}
            >
              Selected Report:{" "}
              <span style={{ fontWeight: "bold", color: "#166534" }}>
                {selected}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}