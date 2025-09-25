
// // pages/in-bound-shipments/index.js
// import React, { useState } from "react";
// import ImportExportTable from "./ImportExportTable";

// const IndexPage = () => {
//   const [mode, setMode] = useState("");
//   const [boeNo, setBoeNo] = useState("");
//   const [fetchedData, setFetchedData] = useState(null);

//   const handleFetch = async () => {
//     try {
//       const res = await fetch(`/api/inbound/fetch?boeSbNo=${encodeURIComponent(boeNo)}`);
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to fetch");
//       setFetchedData(data);
//     } catch (err) {
//       alert("Error fetching: " + err.message);
//       setFetchedData(null);
//     }
//   };

//   // Handle file download from network path
//   const handleFileDownload = async (boeNumber, filename) => {
//     try {
//       const response = await fetch(`/api/inbound/download/${encodeURIComponent(boeNumber)}/${encodeURIComponent(filename)}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
      
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
      
//     } catch (error) {
//       console.error('Error downloading file:', error);
//       alert('Failed to download file. Please try again.');
//     }
//   };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)",
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
//           {/* Header Section */}
//           <div
//             style={{
//               padding: "32px",
//               borderBottom: "1px solid #93c5fd",
//               background: "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)",
//               borderRadius: "16px 16px 0 0",
//             }}
//           >
//             <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e40af", margin: 0 }}>
//               Import/Export Document Portal
//             </h2>
//             <p style={{ fontSize: "16px", color: "#2563eb", marginTop: "8px" }}>
//               Choose Create or Fetch existing records
//             </p>
//           </div>

//           {/* Top Controls */}
//           <div
//             style={{
//               padding: "24px",
//               borderBottom: "1px solid #dbeafe",
//               display: "flex",
//               gap: "16px",
//             }}
//           >
//             {/* Dropdown */}
//             <select
//               value={mode}
//               onChange={(e) => {
//                 setMode(e.target.value);
//                 setFetchedData(null);
//               }}
//               style={{
//                 padding: "12px 16px",
//                 border: "1px solid #93c5fd",
//                 borderRadius: "8px",
//                 fontSize: "14px",
//                 flex: "0 0 200px",
//                 background: "white",
//               }}
//             >
//               <option value="">Select Option</option>
//               <option value="create">Create</option>
//               <option value="fetch">Fetch</option>
//             </select>

//             {/* BOE/SB NO input (when mode = fetch) */}
//             {mode === "fetch" && (
//               <>
//                 <input
//                   type="text"
//                   value={boeNo}
//                   onChange={(e) => setBoeNo(e.target.value)}
//                   placeholder="Enter BOE/SB NO"
//                   style={{
//                     flex: 1,
//                     padding: "12px 16px",
//                     border: "1px solid #93c5fd",
//                     borderRadius: "8px",
//                     fontSize: "14px",
//                     background: "white",
//                   }}
//                 />
//                 <button
//                   style={{
//                     padding: "12px 24px",
//                     backgroundColor: "#2563eb",
//                     color: "white",
//                     fontWeight: "600",
//                     borderRadius: "8px",
//                     border: "none",
//                     cursor: "pointer",
//                     boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//                   }}
//                   onClick={handleFetch}
//                 >
//                   Fetch Data
//                 </button>
//               </>
//             )}
//           </div>

//           {/* Rendered Content */}
//           <div style={{ padding: "32px" }}>
//             {mode === "create" && <ImportExportTable />}

//             {mode === "fetch" && !boeNo && (
//               <div
//                 style={{
//                   padding: "24px",
//                   textAlign: "center",
//                   fontSize: "16px",
//                   fontWeight: "500",
//                   color: "#6b7280",
//                   border: "2px dashed #93c5fd",
//                   borderRadius: "12px",
//                   background: "#f9fafb",
//                 }}
//               >
//                 Enter BOE/SB NO above and click <b>Fetch Data</b> to see results.
//               </div>
//             )}

//             {mode === "fetch" && fetchedData && (
//               <div style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden" }}>
//                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                   <thead>
//                     <tr style={{ background: "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)" }}>
//                       <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af", fontWeight: "600" }}>Field</th>
//                       <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af", fontWeight: "600" }}>Data</th>
//                       <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af", fontWeight: "600" }}>Attachments</th>
//                       <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af", fontWeight: "600" }}>Remarks</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {Object.entries(fetchedData.record).map(([col, val]) => {
//                       if (col.endsWith("Remarks") || col === "CreatedAt") return null;

//                       const fieldKey = col.toLowerCase();
//                       const attachments = fetchedData.attachments.filter(
//                         (a) => a.FieldKey.toLowerCase() === fieldKey
//                       );

//                       return (
//                         <tr key={col} style={{ borderBottom: "1px solid #e2e8f0" }}>
//                           <td style={{ 
//                             border: "1px solid #93c5fd", 
//                             padding: "12px",
//                             backgroundColor: "#f8fafc",
//                             fontWeight: "500",
//                             color: "#1e40af"
//                           }}>
//                             {col}
//                           </td>
//                           <td style={{ 
//                             border: "1px solid #93c5fd", 
//                             padding: "12px",
//                             color: "#374151"
//                           }}>
//                             {val ?? "-"}
//                           </td>
//                           <td style={{ 
//                             border: "1px solid #93c5fd", 
//                             padding: "12px"
//                           }}>
//                             {attachments.length > 0 ? (
//                               <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//                                 {attachments.map((attachment, i) => {
//                                   // Extract filename from FileLink path
//                                   const filename = attachment.FileLink.split('\\').pop() || `attachment_${i + 1}`;
                                  
//                                   return (
//                                     <button
//                                       key={i}
//                                       onClick={() => handleFileDownload(fetchedData.record.BOESBNo, filename)}
//                                       style={{
//                                         padding: "8px 12px",
//                                         backgroundColor: "#2563eb",
//                                         color: "white",
//                                         border: "none",
//                                         borderRadius: "6px",
//                                         cursor: "pointer",
//                                         fontSize: "12px",
//                                         fontWeight: "500",
//                                         display: "flex",
//                                         alignItems: "center",
//                                         gap: "6px",
//                                         hover: "#1d4ed8"
//                                       }}
//                                       onMouseOver={(e) => e.target.style.backgroundColor = "#1d4ed8"}
//                                       onMouseOut={(e) => e.target.style.backgroundColor = "#2563eb"}
//                                     >
//                                       📎 {filename}
//                                     </button>
//                                   );
//                                 })}
//                               </div>
//                             ) : (
//                               <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No files</span>
//                             )}
//                           </td>
//                           <td style={{ 
//                             border: "1px solid #93c5fd", 
//                             padding: "12px",
//                             color: "#374151"
//                           }}>
//                             {fetchedData.record[col + "Remarks"] ?? "-"}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IndexPage;

import React, { useState } from "react";
import ImportExportTable from "./ImportExportTable";
import FetchRecords from "./FetchRecords";

const IndexPage = () => {
  const [mode, setMode] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)", padding: "24px" }}>
      <div style={{ width: "100%" }}>
        <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #dbeafe" }}>
          
          {/* Header */}
          <div style={{ padding: "32px", borderBottom: "1px solid #93c5fd", background: "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)", borderRadius: "16px 16px 0 0" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e40af", margin: 0 }}>Inbound Shipment Document Portal</h2>
            <p style={{ fontSize: "16px", color: "#2563eb", marginTop: "8px" }}>Choose Create or Fetch existing records</p>
          </div>

          {/* Mode Selector */}
          <div style={{ padding: "24px", borderBottom: "1px solid #dbeafe" }}>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "1px solid #93c5fd",
                borderRadius: "8px",
                fontSize: "14px",
                flex: "0 0 200px",
                background: "white",
              }}
            >
              <option value="">Select Option</option>
              <option value="create">Create</option>
              <option value="fetch">Fetch</option>
            </select>
          </div>

          {/* Render Content */}
          {mode === "create" && <ImportExportTable />}
          {mode === "fetch" && <FetchRecords />}
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
