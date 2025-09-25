
// // pages/in-bound-shipments/ImportExportTable.js
// import React, { useState, useRef } from "react";
// import { fieldLabels, fieldKeys } from "./fieldConfig";
// import InputField from "./InputField";
// import AttachmentField from "./AttachmentField";
// import RemarksField from "./RemarksField";

// const ImportExportTable = () => {
//   const [formData, setFormData] = useState(
//     fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {})
//   );

//   const [remarksData, setRemarksData] = useState(
//     fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {})
//   );

//   const [attachmentFiles, setAttachmentFiles] = useState({});
//   const fileInputRefs = useRef({});

//   // ✅ Handle text/date/currency/type inputs
//   const handleInputChange = (fieldKey, value) => {
//     setFormData((prev) => ({ ...prev, [fieldKey]: value }));
//   };

//   // ✅ Handle remarks
//   const handleRemarksChange = (fieldKey, value) => {
//     setRemarksData((prev) => ({ ...prev, [fieldKey]: value }));
//   };

//   // ✅ Handle file upload
//   const handleFileUpload = (fieldKey, files) => {
//     const fileArray = Array.from(files).slice(0, 5);
//     setAttachmentFiles((prev) => ({
//       ...prev,
//       [fieldKey]: [...(prev[fieldKey] || []), ...fileArray],
//     }));
//   };

//   const removeFile = (fieldKey, fileIndex) => {
//     setAttachmentFiles((prev) => ({
//       ...prev,
//       [fieldKey]: prev[fieldKey].filter((_, idx) => idx !== fileIndex),
//     }));
//   };

//   // ✅ Save: send data + remarks + attachments
//   const handleSave = async () => {
//     try {
//       const payload = {
//         formData,
//         remarksData,
//         attachmentFiles: Object.fromEntries(
//           Object.entries(attachmentFiles).map(([fieldKey, files]) => [
//             fieldKey,
//             files.map((file) => ({
//               name: file.name,
//               content: file.base64 || null, // base64 will be added below
//             })),
//           ])
//         ),
//       };

//       // 🔹 Convert File objects to base64
//       for (const [fieldKey, files] of Object.entries(attachmentFiles)) {
//         for (let i = 0; i < files.length; i++) {
//           const file = files[i];
//           if (!file.base64) {
//             const base64 = await new Promise((resolve, reject) => {
//               const r = new FileReader();
//               r.onload = () => resolve(r.result.split(",")[1]); // only base64 part
//               r.onerror = reject;
//               r.readAsDataURL(file);
//             });
//             payload.attachmentFiles[fieldKey][i].content = base64;
//           }
//         }
//       }

//       const res = await fetch("/api/inbound/create", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save");

//       alert("Saved successfully!");
//     } catch (err) {
//       console.error("Save error:", err);
//       alert("Error saving data: " + err.message);
//     }
//   };

//   // ✅ Clear everything
//   const handleClear = () => {
//     setFormData(fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}));
//     setRemarksData(fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}));
//     setAttachmentFiles({});
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
//           {/* Header */}
//           <div
//             style={{
//               padding: "32px",
//               borderBottom: "1px solid #93c5fd",
//               background: "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)",
//               borderRadius: "16px 16px 0 0",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <div>
//                 <h2
//                   style={{
//                     fontSize: "28px",
//                     fontWeight: "bold",
//                     color: "#1e40af",
//                     margin: 0,
//                   }}
//                 >
//                   Import/Export Document Management
//                 </h2>
//                 <p
//                   style={{
//                     fontSize: "16px",
//                     color: "#2563eb",
//                     margin: "8px 0 0 0",
//                   }}
//                 >
//                   Manage all your import and export documentation
//                 </p>
//               </div>
//               <div style={{ display: "flex", gap: "12px" }}>
//                 <button
//                   onClick={handleClear}
//                   style={{
//                     padding: "12px 24px",
//                     backgroundColor: "white",
//                     color: "#2563eb",
//                     fontWeight: "600",
//                     borderRadius: "8px",
//                     border: "2px solid #2563eb",
//                     cursor: "pointer",
//                   }}
//                 >
//                   Clear All
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   style={{
//                     padding: "12px 24px",
//                     backgroundColor: "#2563eb",
//                     color: "white",
//                     fontWeight: "600",
//                     borderRadius: "8px",
//                     border: "none",
//                     cursor: "pointer",
//                   }}
//                 >
//                   Save Data
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Table */}
//           <div style={{ padding: "32px" }}>
//             <div
//               style={{
//                 backgroundColor: "white",
//                 border: "2px solid #93c5fd",
//                 borderRadius: "12px",
//                 overflow: "hidden",
//               }}
//             >
//               <table style={{ width: "100%" }}>
//                 <thead
//                   style={{
//                     background:
//                       "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)",
//                     borderBottom: "2px solid #60a5fa",
//                   }}
//                 >
//                   <tr>
//                     <th style={{ padding: "20px", width: "20%", color: "#1e40af" }}>
//                       Field
//                     </th>
//                     <th style={{ padding: "20px", width: "30%", color: "#1e40af" }}>
//                       Data
//                     </th>
//                     <th style={{ padding: "20px", width: "25%", color: "#1e40af" }}>
//                       Attachments
//                     </th>
//                     <th style={{ padding: "20px", width: "25%", color: "#1e40af" }}>
//                       Remarks
//                     </th>
//                   </tr>
//                 </thead>
//               </table>

//               <div style={{ maxHeight: "600px", overflowY: "auto" }}>
//                 <table style={{ width: "100%" }}>
//                   <tbody>
//                     {fieldLabels.map((label, idx) => (
//                       <tr
//                         key={fieldKeys[idx]}
//                         style={{ borderBottom: "1px solid #dbeafe" }}
//                       >
//                         <td style={{ padding: "16px 24px", width: "20%" }}>
//                           <div
//                             style={{
//                               fontSize: "14px",
//                               fontWeight: "500",
//                               color: "#1e40af",
//                               backgroundColor: "#eff6ff",
//                               padding: "8px 12px",
//                               borderRadius: "6px",
//                               border: "1px solid #93c5fd",
//                             }}
//                           >
//                             {label}
//                           </div>
//                         </td>
//                         <td style={{ padding: "16px 24px", width: "30%" }}>
//                           <InputField
//                             fieldKey={fieldKeys[idx]}
//                             label={label}
//                             value={formData[fieldKeys[idx]]}
//                             onChange={handleInputChange}
//                           />
//                         </td>
//                         <td style={{ padding: "16px 24px", width: "25%" }}>
//                           <AttachmentField
//                             fieldKey={fieldKeys[idx]}
//                             files={attachmentFiles[fieldKeys[idx]] || []}
//                             onUpload={handleFileUpload}
//                             onRemove={removeFile}
//                             fileInputRefs={fileInputRefs}
//                           />
//                         </td>
//                         <td style={{ padding: "16px 24px", width: "25%" }}>
//                           <RemarksField
//                             fieldKey={fieldKeys[idx]}
//                             label={label}
//                             value={remarksData[fieldKeys[idx]]}
//                             onChange={handleRemarksChange}
//                           />
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ImportExportTable;


// pages/in-bound-shipments/ImportExportTable.js
import React, { useState, useRef } from "react";
import { fieldLabels, fieldKeys } from "../../utils/fieldConfig";
import InputField from "./InputField";
import AttachmentField from "./AttachmentField";
import RemarksField from "./RemarksField";

const ImportExportTable = () => {
  const [formData, setFormData] = useState(
    fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {})
  );

  const [remarksData, setRemarksData] = useState(
    fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {})
  );

  const [attachmentFiles, setAttachmentFiles] = useState({});
  const fileInputRefs = useRef({});
  const [saving, setSaving] = useState(false); // 🔹 loader state

  // ✅ Handle text/date/currency/type inputs
  const handleInputChange = (fieldKey, value) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  // ✅ Handle remarks
  const handleRemarksChange = (fieldKey, value) => {
    setRemarksData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  // ✅ Handle file upload
  const handleFileUpload = (fieldKey, files) => {
    const fileArray = Array.from(files).slice(0, 5);
    setAttachmentFiles((prev) => ({
      ...prev,
      [fieldKey]: [...(prev[fieldKey] || []), ...fileArray],
    }));
  };

  const removeFile = (fieldKey, fileIndex) => {
    setAttachmentFiles((prev) => ({
      ...prev,
      [fieldKey]: prev[fieldKey].filter((_, idx) => idx !== fileIndex),
    }));
  };

  // ✅ Save: send data + remarks + attachments
  const handleSave = async () => {
    try {
      setSaving(true); // start loader
      const payload = {
        formData,
        remarksData,
        attachmentFiles: Object.fromEntries(
          Object.entries(attachmentFiles).map(([fieldKey, files]) => [
            fieldKey,
            files.map((file) => ({
              name: file.name,
              content: file.base64 || null, // base64 will be added below
            })),
          ])
        ),
      };

      // 🔹 Convert File objects to base64
      for (const [fieldKey, files] of Object.entries(attachmentFiles)) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.base64) {
            const base64 = await new Promise((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result.split(",")[1]); // only base64 part
              r.onerror = reject;
              r.readAsDataURL(file);
            });
            payload.attachmentFiles[fieldKey][i].content = base64;
          }
        }
      }

      const res = await fetch("/api/inbound/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      alert("Saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving data: " + err.message);
    } finally {
      setSaving(false); // stop loader
    }
  };

  // ✅ Clear everything
  const handleClear = () => {
    setFormData(fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}));
    setRemarksData(fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}));
    setAttachmentFiles({});
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
          {/* Header */}
          <div
            style={{
              padding: "32px",
              borderBottom: "1px solid #93c5fd",
              background: "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)",
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#1e40af",
                    margin: 0,
                  }}
                >
                  Import/Export Document Management
                </h2>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#2563eb",
                    margin: "8px 0 0 0",
                  }}
                >
                  Manage all your import and export documentation
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleClear}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "white",
                    color: "#2563eb",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "2px solid #2563eb",
                    cursor: "pointer",
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: saving ? "#93c5fd" : "#2563eb",
                    color: "white",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Data"}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ padding: "32px" }}>
            <div
              style={{
                backgroundColor: "white",
                border: "2px solid #93c5fd",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    background:
                      "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)",
                    borderBottom: "2px solid #60a5fa",
                  }}
                >
                  <tr>
                    <th style={{ padding: "20px", width: "20%", color: "#1e40af" }}>
                      Field
                    </th>
                    <th style={{ padding: "20px", width: "30%", color: "#1e40af" }}>
                      Data
                    </th>
                    <th style={{ padding: "20px", width: "25%", color: "#1e40af" }}>
                      Attachments
                    </th>
                    <th style={{ padding: "20px", width: "25%", color: "#1e40af" }}>
                      Remarks
                    </th>
                  </tr>
                </thead>
              </table>

              <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    {fieldLabels.map((label, idx) => (
                      <tr
                        key={fieldKeys[idx]}
                        style={{ borderBottom: "1px solid #dbeafe" }}
                      >
                        <td style={{ padding: "16px 24px", width: "20%" }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#1e40af",
                              backgroundColor: "#eff6ff",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid #93c5fd",
                            }}
                          >
                            {label}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", width: "30%" }}>
                          <InputField
                            fieldKey={fieldKeys[idx]}
                            label={label}
                            value={formData[fieldKeys[idx]]}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td style={{ padding: "16px 24px", width: "25%" }}>
                          <AttachmentField
                            fieldKey={fieldKeys[idx]}
                            files={attachmentFiles[fieldKeys[idx]] || []}
                            onUpload={handleFileUpload}
                            onRemove={removeFile}
                            fileInputRefs={fileInputRefs}
                          />
                        </td>
                        <td style={{ padding: "16px 24px", width: "25%" }}>
                          <RemarksField
                            fieldKey={fieldKeys[idx]}
                            label={label}
                            value={remarksData[fieldKeys[idx]]}
                            onChange={handleRemarksChange}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportTable;
