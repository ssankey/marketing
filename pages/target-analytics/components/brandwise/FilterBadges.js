import React from "react";
import { SALES_PERSONS } from "utils/brandwise/constants";

export default function FilterBadges({
  isMobile,
  selectedYear,
  selectedSalesPerson,
  selectedRegion,
  selectedState,
}) {
  if (!selectedSalesPerson && !selectedRegion && !selectedState) {
    return null;
  }

  return (
    <div
      style={{
        marginBottom: isMobile ? "12px" : "16px",
        padding: isMobile ? "10px 12px" : "12px 16px",
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span
          style={{
            color: "#15803d",
            fontSize: isMobile ? "12px" : "13px",
            fontWeight: "600",
          }}
        >
          Active Filters:
        </span>

        {/* Financial Year Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            backgroundColor: "#dcfce7",
            color: "#15803d",
            borderRadius: "5px",
            fontSize: isMobile ? "11px" : "12px",
            fontWeight: "500",
          }}
        >
          {selectedYear}
        </div>

        {/* Sales Person Badge */}
        {selectedSalesPerson && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              borderRadius: "5px",
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: "500",
            }}
          >
            {SALES_PERSONS.find((sp) => sp.code === selectedSalesPerson)?.name}
          </div>
        )}

        {/* Region Badge */}
        {selectedRegion && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              backgroundColor: "#fef3c7",
              color: "#92400e",
              borderRadius: "5px",
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: "500",
            }}
          >
            {selectedRegion}
          </div>
        )}

        {/* State Badge */}
        {selectedState && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              backgroundColor: "#fce7f3",
              color: "#9f1239",
              borderRadius: "5px",
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: "500",
            }}
          >
            {selectedState}
          </div>
        )}
      </div>
    </div>
  );
}