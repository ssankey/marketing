
// pages/in-bound-shipments/RemarksField.js
import React from "react";

const RemarksField = ({ fieldKey, label, value, onChange }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder={`Remarks for ${label}`}
      style={{
        width: "100%",
        padding: "12px 16px",
        border: "1px solid #93c5fd",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "white",
        outline: "none",
      }}
    />
  );
};


export default RemarksField;
