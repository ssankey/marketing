
// pages/in-bound-shipments/AttachmentField.js
import React from "react";

const AttachmentField = ({ fieldKey, files, onUpload, onRemove, fileInputRefs }) => {
  // ✅ Define which fields should show attachments and their custom labels
  const attachmentConfig = {
    supplierInvoiceNo: "Upload Supplier Invoice",
    supplierInvoiceNumber: "Upload Supplier Invoice",
    mawbHawb: "Upload MAWB/HAWB",
    attachments: "Upload Attachments",
    boeSbNo: "Upload BOE/SB"
  };

  // ✅ Only show attachments for specific fields
  // If fieldKey is not in the config, return null (show nothing)
  if (!attachmentConfig[fieldKey]) {
    return null;
  }

  const currentFiles = files || [];
  const buttonLabel = attachmentConfig[fieldKey];

  const handleFileUpload = (event) => {
    onUpload(fieldKey, event.target.files);
  };

  return (
    <div>
      <input
        type="file"
        ref={(el) => (fileInputRefs.current[fieldKey] = el)}
        onChange={handleFileUpload}
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        style={{ display: "none" }}
      />

      <button
        onClick={() => fileInputRefs.current[fieldKey]?.click()}
        disabled={currentFiles.length >= 5}
        style={{
          width: "100%",
          padding: "12px 16px",
          border: "2px dashed #93c5fd",
          borderRadius: "8px",
          fontSize: "14px",
          backgroundColor: currentFiles.length >= 5 ? "#f3f4f6" : "#eff6ff",
          color: currentFiles.length >= 5 ? "#9ca3af" : "#2563eb",
          cursor: currentFiles.length >= 5 ? "not-allowed" : "pointer",
          fontWeight: "500",
        }}
      >
        {currentFiles.length >= 5
          ? "Max files reached (5)"
          : `${buttonLabel} (${currentFiles.length}/5)`}
      </button>

      {currentFiles.length > 0 && (
        <div style={{ marginTop: "8px", maxHeight: "120px", overflowY: "auto" }}>
          {currentFiles.map((file, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                marginBottom: "4px",
                fontSize: "12px",
              }}
            >
              {/* <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginRight: "8px",
                }}
              >
                {file.name}
              </span> */}
              <span
                title={file.name}
                style={{
                  display: "inline-block",
                  maxWidth: "150px", // 🔹 fixed width
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  verticalAlign: "middle",
                }}
              >
                {file.name}
              </span>

              <button
                onClick={() => onRemove(fieldKey, idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentField;