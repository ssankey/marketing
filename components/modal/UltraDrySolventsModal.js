// components/modal/UltraDrySolventsModal.js
import React, { useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import downloadExcel from "utils/exporttoexcel";
import { ULTRA_DRY_SOLVENTS_PRODUCTS } from "utils/energySeal/constants";

const BLUE = "#2a78d6";
const BLUE_SOFT = "#eaf2fc";
const BLUE_BORDER = "#cde2fb";
const INK = "#1e293b";

const COLUMNS = [
  { key: "itemNo", label: "Item No." },
  { key: "description", label: "Item Description" },
  { key: "cas", label: "Cas No" },
  { key: "itemGroup", label: "Item Group" },
];

const UltraDrySolventsModal = ({ show, onClose }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return ULTRA_DRY_SOLVENTS_PRODUCTS;
    const q = search.toLowerCase();
    return ULTRA_DRY_SOLVENTS_PRODUCTS.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search]);

  const handleExportExcel = () => {
    const exportData = filtered.map((r) => ({
      "Item No.": r.itemNo,
      "Item Description": r.description,
      "Cas No": r.cas,
      "Item Group": r.itemGroup,
    }));
    downloadExcel(exportData, "Ultra_Dry_Solvents_Products");
  };

  return (
    <Modal show={show} onHide={onClose} size="xl" centered backdrop="static" style={{ maxWidth: "95vw", margin: "auto" }}>
      <Modal.Header closeButton style={{ background: BLUE_SOFT, color: INK, borderBottom: `2px solid ${BLUE_BORDER}` }}>
        <Modal.Title style={{ fontWeight: 700, fontSize: "1.25rem", color: BLUE }}>
          Ultra Dry Solvents Products
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
          <Form.Control
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "300px", border: `2px solid ${BLUE_BORDER}` }}
          />
          <Button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            style={{ fontWeight: 600, padding: "0.5rem 1.5rem", backgroundColor: BLUE, borderColor: BLUE }}
          >
            📥 Export to Excel
          </Button>
        </div>

        <div style={{ overflowX: "auto", border: `1px solid ${BLUE_BORDER}`, borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead style={{ backgroundColor: BLUE_SOFT, position: "sticky", top: 0, zIndex: 10 }}>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} style={{ padding: "12px", textAlign: "left", fontWeight: 700, color: BLUE, whiteSpace: "nowrap", borderBottom: `2px solid ${BLUE_BORDER}` }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row, idx) => (
                  <tr key={row.itemNo} style={{ backgroundColor: idx % 2 === 0 ? "white" : "#f8fafc" }}>
                    {COLUMNS.map((col) => (
                      <td key={col.key} style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", whiteSpace: col.key === "description" ? "normal" : "nowrap", color: INK, minWidth: col.key === "description" ? 320 : undefined }}>
                        {row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default UltraDrySolventsModal;
