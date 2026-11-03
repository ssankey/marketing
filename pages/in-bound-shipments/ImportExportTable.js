

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
  const [saving, setSaving] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sending, setSending] = useState(false);

  const handleInputChange = (fieldKey, value, vendorData = null) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
    
    if (fieldKey === "vendor" && vendorData && vendorData.country) {
      setFormData((prev) => ({ ...prev, country: vendorData.country }));
    }
  };

  const handleRemarksChange = (fieldKey, value) => {
    setRemarksData((prev) => ({ ...prev, [fieldKey]: value }));
  };

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

  // Format date to DD-MMM-YYYY
  const formatDisplayDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  // Field name mapping for email body
  const fieldNameMapping = {
    vendor: "Vendor",
    name: "Name",
    country: "Country",
    productCategory: "Product Category",
    productOwners: "Product Owners",
    preAlertFormSupplier: "Pre Alert from Supplier Date",
    supplierInvoiceNumber: "Supplier Invoice Number",
    supplierInvoiceNumberDate: "Supplier Invoice Number Date",
    invoiceValue: "Invoice Value",
    currency: "Currency",
    portOfLanding: "Port of Landing",
    typeBOE: "TYPE BOE",
    documentssentToCHADate: "Documents sent to CHA-Date",
    chaName: "CHA Name",
    mawbHawb: "MAWB/HAWB",
    mawbHawbDate: "MAWB/HAWB Date",
    landingDate: "Landing Date",
    pkg: "PKG",
    weight: "WEIGHT",
    boeSbNo: "BOE/SB NO",
    boeDt: "BOE DT",
    av: "AV",
    duty: "Duty",
    dutyPaidDate: "Duty Paid date",
    status: "Status",
    clearedDate: "Cleared Date at Density",
    deliveryDate: "Delivery Date at Density"
  };

  // Generate email body with remarks
  const generateEmailBody = () => {
    const chaTeamName = formData.chaName ? formData.chaName.split(' - ')[1] || formData.chaName : "CHA Team";
    
    let emailLines = [];
    
    fieldKeys.forEach(key => {
      const label = fieldNameMapping[key];
      if (!label) return;
      
      let value = formData[key] || "N/A";
      
      // Format dates
      if (key.toLowerCase().includes("date") || key === "boeDt") {
        value = formatDisplayDate(formData[key]);
      }
      
      // Add currency to invoice value
      if (key === "invoiceValue" && formData.invoiceValue) {
        value = `${formData.invoiceValue} ${formData.currency || ""}`;
      }
      
      // Skip currency as it's shown with invoice value
      if (key === "currency") return;
      
      // Add remarks if present
      const remarks = remarksData[key];
      if (remarks && remarks.trim()) {
        value = `${value} (${remarks.trim()})`;
      }
      
      emailLines.push(`${label}: ${value}`);
    });
    
    return `
Dear Team ${chaTeamName},

Please find below the shipment details for clearance:

${emailLines.join('\n')}

Kindly proceed with the required clearance formalities. Please confirm upon completion.

Best Regards,
Density Pharmachem Team
    `.trim();
  };

  const handleSendEmail = async () => {
    try {
      // Validate all fields
      const emptyFields = fieldKeys.filter(key => !formData[key] || formData[key].trim() === "");
      
      if (emptyFields.length > 0) {
        alert(`Please fill all required fields. Missing: ${emptyFields.join(", ")}`);
        return;
      }

      // Show email preview modal
      setShowEmailModal(true);
    } catch (err) {
      console.error("Error:", err);
      alert("Error preparing email: " + err.message);
    }
  };

  const confirmAndSend = async () => {
    try {
      setSending(true);

      // Get current timestamp for sent date
      const sentDate = new Date().toISOString();

      // Prepare payload with sent date
      const payload = {
        formData: {
          ...formData,
          sentDate: sentDate // Add sent date timestamp
        },
        remarksData,
        attachmentFiles: Object.fromEntries(
          Object.entries(attachmentFiles).map(([fieldKey, files]) => [
            fieldKey,
            files.map((file) => ({
              name: file.name,
              content: file.base64 || null,
            })),
          ])
        ),
      };

      // Convert File objects to base64
      for (const [fieldKey, files] of Object.entries(attachmentFiles)) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.base64) {
            const base64 = await new Promise((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result.split(",")[1]);
              r.onerror = reject;
              r.readAsDataURL(file);
            });
            payload.attachmentFiles[fieldKey][i].content = base64;
          }
        }
      }

      // Save to database
      const saveRes = await fetch("/api/inbound/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const saveData = await saveRes.json();
      
      if (saveRes.status === 409) {
        alert(saveData.message || "This BOE/SB Number already exists.");
        setSending(false);
        return;
      }
      
      if (!saveRes.ok) {
        throw new Error(saveData.message || saveData.error || "Failed to save");
      }

      // Now send email with remarks
      const emailRes = await fetch("/api/inbound/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: payload.formData,
          remarksData,
          attachmentFiles: payload.attachmentFiles,
        }),
      });

      const emailData = await emailRes.json();
      
      if (!emailRes.ok) {
        throw new Error(emailData.message || "Failed to send email");
      }

      alert("✅ Data saved and email sent successfully!");
      setShowEmailModal(false);
      
    } catch (err) {
      console.error("Error:", err);
      alert("Error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all fields?")) {
      setFormData(fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}));
      setRemarksData(fieldKeys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}));
      setAttachmentFiles({});
    }
  };

  return (
    <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)",
        padding: "24px",
      }}>
      <div style={{ width: "100%" }}>
        <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #dbeafe",
          }}>
          {/* Header */}
          <div style={{
              padding: "32px",
              borderBottom: "1px solid #93c5fd",
              background: "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)",
              borderRadius: "16px 16px 0 0",
            }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <div>
                <h2 style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#1e40af",
                    margin: 0,
                  }}>
                  Import/Export Document Management
                </h2>
                <p style={{
                    fontSize: "16px",
                    color: "#2563eb",
                    margin: "8px 0 0 0",
                  }}>
                  Manage all your import and export documentation
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleClear}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "white",
                    color: "#ef4444",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "2px solid #ef4444",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#fee2e2";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "white";
                  }}>
                  Clear All
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={saving}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: saving ? "#93c5fd" : "#10b981",
                    color: "white",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.target.style.backgroundColor = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) e.target.style.backgroundColor = "#10b981";
                  }}>
                  📧 Send Mail
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ padding: "32px" }}>
            <div style={{
                backgroundColor: "white",
                border: "2px solid #93c5fd",
                borderRadius: "12px",
                overflow: "hidden",
              }}>
              <table style={{ width: "100%", tableLayout: "fixed" }}>
                <thead style={{
                    background: "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)",
                    borderBottom: "2px solid #60a5fa",
                  }}>
                  <tr>
                    <th style={{ padding: "20px", width: "20%", color: "#1e40af" }}>Field</th>
                    <th style={{ padding: "20px", width: "30%", color: "#1e40af" }}>Data</th>
                    <th style={{ padding: "20px", width: "25%", color: "#1e40af" }}>Attachments</th>
                    <th style={{ padding: "20px", width: "25%", color: "#1e40af" }}>Remarks</th>
                  </tr>
                </thead>
              </table>

              <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                <table style={{ width: "100%", tableLayout: "fixed" }}>
                  <tbody>
                    {fieldLabels.map((label, idx) => (
                      <tr key={fieldKeys[idx]} style={{ borderBottom: "1px solid #dbeafe" }}>
                        <td style={{ padding: "16px 24px", width: "20%" }}>
                          <div style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#1e40af",
                              backgroundColor: "#eff6ff",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid #93c5fd",
                            }}>
                            {label}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", width: "30%" }}>
                          <InputField
                            fieldKey={fieldKeys[idx]}
                            label={label}
                            value={formData[fieldKeys[idx]]}
                            onChange={handleInputChange}
                            isReadOnly={fieldKeys[idx] === "country"}
                          />
                        </td>
                        <td style={{ padding: "16px 24px", width: "25%", maxWidth: "25%" }}>
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

      {/* Email Preview Modal */}
      {showEmailModal && (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}>
          <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}>
            {/* Modal Header */}
            <div style={{
                padding: "24px",
                borderBottom: "2px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#1e40af" }}>
                📧 Email Preview
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                }}>&times;</button>
            </div>

            {/* Modal Body */}
            <div style={{
                padding: "24px",
                overflowY: "auto",
                flex: 1,
              }}>
              <div style={{ marginBottom: "16px" }}>
                <strong>Subject:</strong> Import Shipment Details for Clearance — BOE No: {formData.boeSbNo}
              </div>
              <div style={{
                  backgroundColor: "#f9fafb",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}>
                {generateEmailBody()}
              </div>
              {Object.keys(attachmentFiles).length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <strong>Attachments:</strong>
                  <ul style={{ marginTop: "8px" }}>
                    {Object.entries(attachmentFiles).map(([fieldKey, files]) => 
                      files.map((file, idx) => (
                        <li key={`${fieldKey}-${idx}`}>{file.name}</li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
                padding: "20px 24px",
                borderTop: "2px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}>
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={sending}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  fontWeight: "600",
                  borderRadius: "8px",
                  border: "2px solid #d1d5db",
                  cursor: sending ? "not-allowed" : "pointer",
                }}>
                Cancel
              </button>
              <button
                onClick={confirmAndSend}
                disabled={sending}
                style={{
                  padding: "10px 20px",
                  backgroundColor: sending ? "#93c5fd" : "#10b981",
                  color: "white",
                  fontWeight: "600",
                  borderRadius: "8px",
                  border: "none",
                  cursor: sending ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!sending) e.target.style.backgroundColor = "#059669";
                }}
                onMouseLeave={(e) => {
                  if (!sending) e.target.style.backgroundColor = "#10b981";
                }}>
                {sending ? "Sending..." : "✓ Confirm & Send Mail"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExportTable;