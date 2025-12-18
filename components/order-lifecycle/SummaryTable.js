
// // components/order-lifecycle/SummaryTable.js
// import React, { useEffect, useRef } from "react";

// const SummaryTable = ({ chartData, customRanges, onCellClick }) => {
//   const scrollContainerRef = useRef(null);

//   const formatMonthYear = (monthStr) => {
//     const [year, month] = monthStr.split("-");
//     const monthNames = [
//       "Jan",
//       "Feb",
//       "Mar",
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//     ];
//     return `${monthNames[parseInt(month, 10) - 1]}-${year}`;
//   };

//   // Scroll to the RIGHT side whenever chartData changes
//   useEffect(() => {
//     if (scrollContainerRef.current) {
//       const el = scrollContainerRef.current;
//       // Use setTimeout to ensure DOM is fully rendered
//       setTimeout(() => {
//         el.scrollLeft = el.scrollWidth - el.clientWidth;
//       }, 0);
//     }
//   }, [chartData]);

//   return (
//     <div style={{ marginTop: 40 }}>
//       <h2
//         style={{
//           fontSize: 20,
//           fontWeight: 600,
//           color: "#1f2937",
//           marginBottom: 20,
//         }}
//       >
//         Summary Table
//       </h2>

//       {/* Scroll container */}
//       <div
//         ref={scrollContainerRef}
//         style={{
//           overflowX: "auto",
//           overflowY: "hidden",
//           maxWidth: "100%",
//           position: "relative",
//           // Optional: style the scrollbar
//           scrollbarWidth: "thin", // For Firefox
//           scrollbarColor: "#cbd5e1 #f1f5f9", // For Firefox
//         }}
//       >
//         <table
//           style={{
//             width: "auto", // Changed from 100% to auto
//             minWidth: "100%", // Ensures table is at least full width
//             borderCollapse: "collapse",
//             background: "#fff",
//             boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
//             borderRadius: 8,
//             overflow: "hidden",
//           }}
//         >
//           <thead>
//             <tr style={{ background: "#f9fafb" }}>
//               {/* Sticky first column header */}
//               <th
//                 style={{
//                   padding: "12px 16px",
//                   textAlign: "left",
//                   fontSize: 13,
//                   fontWeight: 600,
//                   color: "#374151",
//                   borderBottom: "2px solid #e5e7eb",
//                   position: "sticky",
//                   left: 0,
//                   minWidth: 180,
//                   background: "#f9fafb",
//                   zIndex: 20,
//                   boxShadow: "2px 0 4px rgba(0,0,0,0.05)", // Shadow for depth
//                 }}
//               >
//                 Range / Month
//               </th>
//               {chartData.map((monthData, idx) => (
//                 <th
//                   key={idx}
//                   style={{
//                     padding: "12px 16px",
//                     textAlign: "center",
//                     fontSize: 13,
//                     fontWeight: 600,
//                     color: "#374151",
//                     borderBottom: "2px solid #e5e7eb",
//                     minWidth: 120,
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   {formatMonthYear(monthData.month)}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {customRanges.map((range, rangeIdx) => {
//               const rowBg = rangeIdx % 2 === 0 ? "#fff" : "#f9fafb";

//               return (
//                 <tr key={range.id} style={{ background: rowBg }}>
//                   {/* Sticky first column cells */}
//                   <td
//                     style={{
//                       padding: 0,
//                       borderBottom: "1px solid #e5e7eb",
//                       position: "sticky",
//                       left: 0,
//                       minWidth: 180,
//                       background: rowBg,
//                       zIndex: 10,
//                       boxShadow: "2px 0 4px rgba(0,0,0,0.05)", // Shadow for depth
//                     }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 10,
//                         padding: "12px 16px",
//                       }}
//                     >
//                       <div
//                         style={{
//                           width: 16,
//                           height: 16,
//                           borderRadius: 4,
//                           background: range.color,
//                           flexShrink: 0,
//                         }}
//                       />
//                       <span
//                         style={{
//                           fontSize: 14,
//                           fontWeight: 500,
//                           color: "#1f2937",
//                         }}
//                       >
//                         {range.label}
//                       </span>
//                     </div>
//                   </td>

//                   {chartData.map((monthData, monthIdx) => {
//                     const count = monthData.buckets[range.label]?.count || 0;

//                     return (
//                       <td
//                         key={monthIdx}
//                         onClick={() =>
//                           count > 0 && onCellClick(monthData.month, range.label)
//                         }
//                         style={{
//                           padding: "12px 16px",
//                           textAlign: "center",
//                           fontSize: 14,
//                           color: "#374151",
//                           borderBottom: "1px solid #e5e7eb",
//                           cursor: count > 0 ? "pointer" : "default",
//                           transition: "background 0.2s",
//                           whiteSpace: "nowrap",
//                         }}
//                         onMouseEnter={(e) => {
//                           if (count > 0) {
//                             e.currentTarget.style.background = "#e0f2fe";
//                           }
//                         }}
//                         onMouseLeave={(e) => {
//                           e.currentTarget.style.background = rowBg;
//                         }}
//                       >
//                         {count || "-"}
//                       </td>
//                     );
//                   })}
//                 </tr>
//               );
//             })}

//             {/* Total Row */}
//             <tr style={{ background: "#f3f4f6", fontWeight: 600 }}>
//               <td
//                 style={{
//                   padding: 0,
//                   position: "sticky",
//                   left: 0,
//                   minWidth: 180,
//                   background: "#f3f4f6",
//                   zIndex: 15,
//                   boxShadow: "2px 0 4px rgba(0,0,0,0.05)", // Shadow for depth
//                 }}
//               >
//                 <div
//                   style={{
//                     padding: "12px 16px",
//                     fontSize: 14,
//                     color: "#1f2937",
//                   }}
//                 >
//                   Total
//                 </div>
//               </td>
//               {chartData.map((monthData, idx) => (
//                 <td
//                   key={idx}
//                   style={{
//                     padding: "12px 16px",
//                     textAlign: "center",
//                     fontSize: 14,
//                     color: "#1f2937",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   {monthData.total}
//                 </td>
//               ))}
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* Optional: Custom scrollbar styles for webkit browsers */}
//       <style jsx>{`
//         div::-webkit-scrollbar {
//           height: 8px;
//         }
//         div::-webkit-scrollbar-track {
//           background: #f1f5f9;
//           border-radius: 4px;
//         }
//         div::-webkit-scrollbar-thumb {
//           background: #cbd5e1;
//           border-radius: 4px;
//         }
//         div::-webkit-scrollbar-thumb:hover {
//           background: #94a3b8;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default SummaryTable;


// components/order-lifecycle/SummaryTable.js (WITH PERCENTAGES)
import React, { useEffect, useRef } from "react";

const SummaryTable = ({ chartData, customRanges, onCellClick }) => {
  const scrollContainerRef = useRef(null);

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[parseInt(month, 10) - 1]}-${year}`;
  };

  // Scroll to the RIGHT side whenever chartData changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      setTimeout(() => {
        el.scrollLeft = el.scrollWidth - el.clientWidth;
      }, 0);
    }
  }, [chartData]);

  return (
    <div style={{ marginTop: 40 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#1f2937",
          marginBottom: 20,
        }}
      >
        Summary Table
      </h2>

      <div
        ref={scrollContainerRef}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          maxWidth: "100%",
          position: "relative",
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 #f1f5f9",
        }}
      >
        <table
          style={{
            width: "auto",
            minWidth: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  borderBottom: "2px solid #e5e7eb",
                  position: "sticky",
                  left: 0,
                  minWidth: 180,
                  background: "#f9fafb",
                  zIndex: 20,
                  boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
                }}
              >
                Range / Month
              </th>
              {chartData.map((monthData, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    borderBottom: "2px solid #e5e7eb",
                    minWidth: 120,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatMonthYear(monthData.month)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {customRanges.map((range, rangeIdx) => {
              const rowBg = rangeIdx % 2 === 0 ? "#fff" : "#f9fafb";

              return (
                <tr key={range.id} style={{ background: rowBg }}>
                  <td
                    style={{
                      padding: 0,
                      borderBottom: "1px solid #e5e7eb",
                      position: "sticky",
                      left: 0,
                      minWidth: 180,
                      background: rowBg,
                      zIndex: 10,
                      boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 16px",
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: range.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#1f2937",
                        }}
                      >
                        {range.label}
                      </span>
                    </div>
                  </td>

                  {chartData.map((monthData, monthIdx) => {
                    const count = monthData.buckets[range.label]?.count || 0;
                    const total = monthData.total || 0;
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

                    return (
                      <td
                        key={monthIdx}
                        onClick={() =>
                          count > 0 && onCellClick(monthData.month, range.label)
                        }
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: 14,
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                          cursor: count > 0 ? "pointer" : "default",
                          transition: "background 0.2s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          if (count > 0) {
                            e.currentTarget.style.background = "#e0f2fe";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = rowBg;
                        }}
                      >
                        {count > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: 15 }}>{count}</span>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>({percentage}%)</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Total Row */}
            <tr style={{ background: "#f3f4f6", fontWeight: 600 }}>
              <td
                style={{
                  padding: 0,
                  position: "sticky",
                  left: 0,
                  minWidth: 180,
                  background: "#f3f4f6",
                  zIndex: 15,
                  boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    fontSize: 14,
                    color: "#1f2937",
                  }}
                >
                  Total
                </div>
              </td>
              {chartData.map((monthData, idx) => (
                <td
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 14,
                    color: "#1f2937",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{monthData.total}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>(100%)</span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        div::-webkit-scrollbar {
          height: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default SummaryTable;