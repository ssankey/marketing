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
  onApply,
  onReset,
}) {
  return (
    <div
      style={{
        backgroundColor: "#f0fdf4",
        borderRadius: "10px",
        padding: isMobile ? "12px" : "16px",
        border: "1px solid #a7f3d0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        marginBottom: isMobile ? "16px" : "20px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(6, 1fr)",
          gap: isMobile ? "12px" : "12px",
          alignItems: "end",
        }}
      >
        {/* Financial Year Dropdown */}
        <div>
          <label
            style={{
              display: "block",
              color: "#15803d",
              fontWeight: "600",
              fontSize: isMobile ? "12px" : "13px",
              marginBottom: "6px",
            }}
          >
            Financial Year <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              width: "100%",
              padding: isMobile ? "8px 10px" : "9px 12px",
              borderRadius: "6px",
              border: "2px solid #a7f3d0",
              backgroundColor: "white",
              color: "#15803d",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#15803d")}
            onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
          >
            {FINANCIAL_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Sales Person Dropdown */}
        <div>
          <label
            style={{
              display: "block",
              color: "#15803d",
              fontWeight: "600",
              fontSize: isMobile ? "12px" : "13px",
              marginBottom: "6px",
            }}
          >
            Sales Person
          </label>
          <select
            value={selectedSalesPerson}
            onChange={(e) => setSelectedSalesPerson(e.target.value)}
            style={{
              width: "100%",
              padding: isMobile ? "8px 10px" : "9px 12px",
              borderRadius: "6px",
              border: "2px solid #a7f3d0",
              backgroundColor: "white",
              color: selectedSalesPerson ? "#15803d" : "#9ca3af",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#15803d")}
            onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
          >
            <option value="">Select Sales Person</option>
            {SALES_PERSONS.map((sp) => (
              <option key={sp.code} value={sp.code}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Region Dropdown */}
        <div>
          <label
            style={{
              display: "block",
              color: "#15803d",
              fontWeight: "600",
              fontSize: isMobile ? "12px" : "13px",
              marginBottom: "6px",
            }}
          >
            Region
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              width: "100%",
              padding: isMobile ? "8px 10px" : "9px 12px",
              borderRadius: "6px",
              border: "2px solid #a7f3d0",
              backgroundColor: "white",
              color: selectedRegion ? "#15803d" : "#9ca3af",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#15803d")}
            onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
          >
            <option value="">Select Region</option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* State Dropdown */}
        <div>
          <label
            style={{
              display: "block",
              color: "#15803d",
              fontWeight: "600",
              fontSize: isMobile ? "12px" : "13px",
              marginBottom: "6px",
            }}
          >
            State
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              width: "100%",
              padding: isMobile ? "8px 10px" : "9px 12px",
              borderRadius: "6px",
              border: "2px solid #a7f3d0",
              backgroundColor: "white",
              color: selectedState ? "#15803d" : "#9ca3af",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#15803d")}
            onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
          >
            <option value="">Select State</option>
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div>
          {!isMobile && <div style={{ height: "25px" }}></div>}
          <button
            onClick={onReset}
            style={{
              width: "100%",
              padding: isMobile ? "8px 10px" : "9px 12px",
              borderRadius: "6px",
              border: "2px solid #a7f3d0",
              backgroundColor: "white",
              color: "#15803d",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#f0fdf4";
              e.target.style.borderColor = "#15803d";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#a7f3d0";
            }}
          >
            🔄 Reset
          </button>
        </div>

        {/* Apply Button */}
        <div>
          {!isMobile && <div style={{ height: "25px" }}></div>}
          <button
            onClick={onApply}
            style={{
              width: "100%",
              padding: isMobile ? "8px 10px" : "9px 12px",
              borderRadius: "6px",
              border: "2px solid #15803d",
              backgroundColor: "#15803d",
              color: "white",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#166534";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#15803d";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
            }}
          >
            ✓ Apply
          </button>
        </div>
      </div>
    </div>
  );
}