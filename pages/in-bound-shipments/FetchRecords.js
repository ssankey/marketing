// // pages/in-bound-shipments/FetchRecords.js
// import React, { useState } from "react";
// import {formatDate} from "utils/formatDate";

// const FetchRecords = () => {
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

//   const handleFileDownload = async (boeNumber, filename) => {
//     try {
//       const response = await fetch(`/api/inbound/download/${encodeURIComponent(boeNumber)}/${encodeURIComponent(filename)}`);
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Error downloading file:", error);
//       alert("Failed to download file. Please try again.");
//     }
//   };

//   return (
//     <div style={{ padding: "32px" }}>
//       {/* Input + Button */}
//       <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
//         <input
//           type="text"
//           value={boeNo}
//           onChange={(e) => setBoeNo(e.target.value)}
//           placeholder="Enter BOE/SB NO"
//           style={{
//             flex: 1,
//             padding: "12px 16px",
//             border: "1px solid #93c5fd",
//             borderRadius: "8px",
//             fontSize: "14px",
//             background: "white",
//           }}
//         />
//         <button
//           style={{
//             padding: "12px 24px",
//             backgroundColor: "#2563eb",
//             color: "white",
//             fontWeight: "600",
//             borderRadius: "8px",
//             border: "none",
//             cursor: "pointer",
//             boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//           }}
//           onClick={handleFetch}
//         >
//           Fetch Data
//         </button>
//       </div>

//       {/* Placeholder message */}
//       {!boeNo && (
//         <div
//           style={{
//             padding: "24px",
//             textAlign: "center",
//             fontSize: "16px",
//             fontWeight: "500",
//             color: "#6b7280",
//             border: "2px dashed #93c5fd",
//             borderRadius: "12px",
//             background: "#f9fafb",
//           }}
//         >
//           Enter BOE/SB NO above and click <b>Fetch Data</b> to see results.
//         </div>
//       )}

//       {/* Table */}
//       {fetchedData && (
//         <div style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr style={{ background: "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)" }}>
//                 <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>Field</th>
//                 <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>Data</th>
//                 <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>Attachments</th>
//                 <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>Remarks</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Object.entries(fetchedData.record).map(([col, val]) => {
//                 if (col.endsWith("Remarks") || col === "CreatedAt") return null;

//                 const fieldKey = col.toLowerCase();
//                 const attachments = fetchedData.attachments.filter(
//                   (a) => a.FieldKey.toLowerCase() === fieldKey
//                 );

//                 return (
//                   <tr key={col} style={{ borderBottom: "1px solid #e2e8f0" }}>
//                     <td style={{ border: "1px solid #93c5fd", padding: "12px", backgroundColor: "#f8fafc", fontWeight: "500", color: "#1e40af" }}>
//                       {col}
//                     </td>
//                     <td style={{ border: "1px solid #93c5fd", padding: "12px", color: "#374151" }}>
//                       {val
//                         ? ((col.toLowerCase().includes("date") || col.toLowerCase() === "boedt") ? formatDate(val) : val)
//                         : "-"}
//                     </td>
//                     <td style={{ border: "1px solid #93c5fd", padding: "12px" }}>
//                       {attachments.length > 0 ? (
//                         <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//                           {attachments.map((attachment, i) => {
//                             const filename = attachment.FileLink.split("\\").pop() || `attachment_${i + 1}`;
//                             return (
//                               <button
//                                 key={i}
//                                 onClick={() => handleFileDownload(fetchedData.record.BOESBNo, filename)}
//                                 style={{
//                                   padding: "8px 12px",
//                                   backgroundColor: "#2563eb",
//                                   color: "white",
//                                   border: "none",
//                                   borderRadius: "6px",
//                                   cursor: "pointer",
//                                   fontSize: "12px",
//                                   fontWeight: "500",
//                                 }}
//                               >
//                                 📎 {filename}
//                               </button>
//                             );
//                           })}
//                         </div>
//                       ) : (
//                         <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No files</span>
//                       )}
//                     </td>
//                     <td style={{ border: "1px solid #93c5fd", padding: "12px", color: "#374151" }}>
//                       {fetchedData.record[col + "Remarks"] ?? "-"}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FetchRecords;


// // pages/in-bound-shipments/FetchRecords.js
// import React, { useState } from "react";
// import { formatDate } from "utils/formatDate";

// const FetchRecords = () => {
//   const [boeNo, setBoeNo] = useState("");
//   const [fetchedData, setFetchedData] = useState(null);
//   const [fetching, setFetching] = useState(false); // 🔹 loader state

//   const handleFetch = async () => {
//     try {
//       setFetching(true); // start loader
//       const res = await fetch(`/api/inbound/fetch?boeSbNo=${encodeURIComponent(boeNo)}`);
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to fetch");
//       setFetchedData(data);
//     } catch (err) {
//       alert("Error fetching: " + err.message);
//       setFetchedData(null);
//     } finally {
//       setFetching(false); // stop loader
//     }
//   };

//   const handleFileDownload = async (boeNumber, filename) => {
//     try {
//       const response = await fetch(
//         `/api/inbound/download/${encodeURIComponent(boeNumber)}/${encodeURIComponent(filename)}`
//       );
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Error downloading file:", error);
//       alert("Failed to download file. Please try again.");
//     }
//   };

//   return (
//     <div style={{ padding: "32px" }}>
//       {/* Input + Button */}
//       <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
//         <input
//           type="text"
//           value={boeNo}
//           onChange={(e) => setBoeNo(e.target.value)}
//           placeholder="Enter BOE/SB NO"
//           style={{
//             flex: 1,
//             padding: "12px 16px",
//             border: "1px solid #93c5fd",
//             borderRadius: "8px",
//             fontSize: "14px",
//             background: "white",
//           }}
//         />
//         <button
//           onClick={handleFetch}
//           disabled={fetching}
//           style={{
//             padding: "12px 24px",
//             backgroundColor: fetching ? "#93c5fd" : "#2563eb",
//             color: "white",
//             fontWeight: "600",
//             borderRadius: "8px",
//             border: "none",
//             cursor: fetching ? "not-allowed" : "pointer",
//             boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//           }}
//         >
//           {fetching ? "Fetching..." : "Fetch Data"}
//         </button>
//       </div>

//       {/* Placeholder message */}
//       {!boeNo && (
//         <div
//           style={{
//             padding: "24px",
//             textAlign: "center",
//             fontSize: "16px",
//             fontWeight: "500",
//             color: "#6b7280",
//             border: "2px dashed #93c5fd",
//             borderRadius: "12px",
//             background: "#f9fafb",
//           }}
//         >
//           Enter BOE/SB NO above and click <b>Fetch Data</b> to see results.
//         </div>
//       )}

//       {/* Table */}
//       {fetchedData && (
//         <div style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr style={{ background: "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)" }}>
//                 <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>
//                   Field
//                 </th>
//                 <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>
//                   Data
//                 </th>
//                 <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>
//                   Attachments
//                 </th>
//                 <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>
//                   Remarks
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {Object.entries(fetchedData.record).map(([col, val]) => {
//                 if (col.endsWith("Remarks") || col === "CreatedAt") return null;

//                 const fieldKey = col.toLowerCase();
//                 const attachments = fetchedData.attachments.filter(
//                   (a) => a.FieldKey.toLowerCase() === fieldKey
//                 );

//                 return (
//                   <tr key={col} style={{ borderBottom: "1px solid #e2e8f0" }}>
//                     <td
//                       style={{
//                         border: "1px solid #93c5fd",
//                         padding: "12px",
//                         backgroundColor: "#f8fafc",
//                         fontWeight: "500",
//                         color: "#1e40af",
//                       }}
//                     >
//                       {col}
//                     </td>
//                     <td
//                       style={{
//                         border: "1px solid #93c5fd",
//                         padding: "12px",
//                         color: "#374151",
//                       }}
//                     >
//                       {val
//                         ? col.toLowerCase().includes("date") || col.toLowerCase() === "boedt"
//                           ? formatDate(val)
//                           : val
//                         : "-"}
//                     </td>
//                     <td style={{ border: "1px solid #93c5fd", padding: "12px" }}>
//                       {attachments.length > 0 ? (
//                         <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//                           {attachments.map((attachment, i) => {
//                             const filename =
//                               attachment.FileLink.split("\\").pop() || `attachment_${i + 1}`;
//                             return (
//                               <button
//                                 key={i}
//                                 onClick={() =>
//                                   handleFileDownload(fetchedData.record.BOESBNo, filename)
//                                 }
//                                 style={{
//                                   padding: "8px 12px",
//                                   backgroundColor: "#2563eb",
//                                   color: "white",
//                                   border: "none",
//                                   borderRadius: "6px",
//                                   cursor: "pointer",
//                                   fontSize: "12px",
//                                   fontWeight: "500",
//                                 }}
//                               >
//                                 📎 {filename}
//                               </button>
//                             );
//                           })}
//                         </div>
//                       ) : (
//                         <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No files</span>
//                       )}
//                     </td>
//                     <td
//                       style={{
//                         border: "1px solid #93c5fd",
//                         padding: "12px",
//                         color: "#374151",
//                       }}
//                     >
//                       {fetchedData.record[col + "Remarks"] ?? "-"}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FetchRecords;

// pages/in-bound-shipments/FetchRecords.js
import React, { useState } from "react";
import { formatDate } from "utils/formatDate";

const FetchRecords = () => {
  const [boeNo, setBoeNo] = useState("");
  const [fetchedData, setFetchedData] = useState(null);
  const [fetching, setFetching] = useState(false); // 🔹 loader for Fetch Data
  const [downloading, setDownloading] = useState({}); // 🔹 loader for attachments

  const handleFetch = async () => {
    try {
      setFetching(true);
      const res = await fetch(`/api/inbound/fetch?boeSbNo=${encodeURIComponent(boeNo)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setFetchedData(data);
    } catch (err) {
      alert("Error fetching: " + err.message);
      setFetchedData(null);
    } finally {
      setFetching(false);
    }
  };

  const handleFileDownload = async (boeNumber, filename) => {
    try {
      setDownloading((prev) => ({ ...prev, [filename]: true })); // start loader
      const response = await fetch(
        `/api/inbound/download/${encodeURIComponent(boeNumber)}/${encodeURIComponent(filename)}`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    } finally {
      setDownloading((prev) => ({ ...prev, [filename]: false })); // stop loader
    }
  };

  return (
    <div style={{ padding: "32px" }}>
      {/* Input + Button */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <input
          type="text"
          value={boeNo}
          onChange={(e) => setBoeNo(e.target.value)}
          placeholder="Enter BOE/SB NO"
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "1px solid #93c5fd",
            borderRadius: "8px",
            fontSize: "14px",
            background: "white",
          }}
        />
        <button
          onClick={handleFetch}
          disabled={fetching}
          style={{
            padding: "12px 24px",
            backgroundColor: fetching ? "#93c5fd" : "#2563eb",
            color: "white",
            fontWeight: "600",
            borderRadius: "8px",
            border: "none",
            cursor: fetching ? "not-allowed" : "pointer",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          {fetching ? "Fetching..." : "Fetch Data"}
        </button>
      </div>

      {/* Placeholder message */}
      {!boeNo && (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "500",
            color: "#6b7280",
            border: "2px dashed #93c5fd",
            borderRadius: "12px",
            background: "#f9fafb",
          }}
        >
          Enter BOE/SB NO above and click <b>Fetch Data</b> to see results.
        </div>
      )}

      {/* Table */}
      {fetchedData && (
        <div style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)" }}>
                <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>
                  Field
                </th>
                <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>
                  Data
                </th>
                <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>
                  Attachments
                </th>
                <th style={{ padding: "16px", border: "1px solid #93c5fd", color: "#1e40af" }}>
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(fetchedData.record).map(([col, val]) => {
                if (col.endsWith("Remarks") || col === "CreatedAt") return null;

                const fieldKey = col.toLowerCase();
                const attachments = fetchedData.attachments.filter(
                  (a) => a.FieldKey.toLowerCase() === fieldKey
                );

                return (
                  <tr key={col} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        border: "1px solid #93c5fd",
                        padding: "12px",
                        backgroundColor: "#f8fafc",
                        fontWeight: "500",
                        color: "#1e40af",
                      }}
                    >
                      {col}
                    </td>
                    <td
                      style={{
                        border: "1px solid #93c5fd",
                        padding: "12px",
                        color: "#374151",
                      }}
                    >
                      {val
                        ? col.toLowerCase().includes("date") || col.toLowerCase() === "boedt"
                          ? formatDate(val)
                          : val
                        : "-"}
                    </td>
                    <td style={{ border: "1px solid #93c5fd", padding: "12px" }}>
                      {attachments.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {attachments.map((attachment, i) => {
                            const filename =
                              attachment.FileLink.split("\\").pop() || `attachment_${i + 1}`;
                            const isDownloading = downloading[filename];

                            return (
                              <button
                                key={i}
                                onClick={() =>
                                  handleFileDownload(fetchedData.record.BOESBNo, filename)
                                }
                                disabled={isDownloading}
                                style={{
                                  padding: "8px 12px",
                                  backgroundColor: isDownloading ? "#93c5fd" : "#2563eb",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: isDownloading ? "not-allowed" : "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                {isDownloading ? "Downloading..." : `📎 ${filename}`}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No files</span>
                      )}
                    </td>
                    <td
                      style={{
                        border: "1px solid #93c5fd",
                        padding: "12px",
                        color: "#374151",
                      }}
                    >
                      {fetchedData.record[col + "Remarks"] ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FetchRecords;
