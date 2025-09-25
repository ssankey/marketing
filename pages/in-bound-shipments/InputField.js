
// pages/in-bound-shipments/InputField.js
import React, { useState } from "react";

const InputField = ({ fieldKey, label, value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ✅ Vendor suggestions
  const fetchVendors = async (search) => {
    try {
      const res = await fetch(`/api/vendors?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data = await res.json();
      setSuggestions(data.vendors || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Vendor fetch error:", err);
    }
  };

 
// ✅ Product category suggestions
const fetchCategories = async (search) => {
  try {
    const res = await fetch(`/api/products/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();

    // 🔹 Filter results on frontend
    const filtered = (data.categories || []).filter((cat) =>
      cat.toLowerCase().includes(search.toLowerCase())
    );

    setSuggestions(filtered);
    setShowSuggestions(true);
  } catch (err) {
    console.error("Category fetch error:", err);
  }
};


  // ✅ Handle typing
  const handleChange = (e) => {
    const inputValue = e.target.value;
    onChange(fieldKey, inputValue);

    if (fieldKey === "vendor" && inputValue.length > 1) {
      fetchVendors(inputValue);
    } else if (fieldKey === "productCategory" && inputValue.length > 1) {
      fetchCategories(inputValue);
    } else {
      setShowSuggestions(false);
    }
  };

  // ✅ Handle selecting suggestion
  const handleSelect = (item) => {
    if (fieldKey === "vendor") {
      onChange(fieldKey, `${item.cardCode} - ${item.cardName}`);
    } else if (fieldKey === "productCategory") {
      onChange(fieldKey, item);
    }
    setShowSuggestions(false);
  };

  // ✅ Special cases
  const isDateField = [
    "date",
    "documentssentToCHADate",
    "sentDate",
    "mawbHawbDate",
    "landingDate",
    "boeDt",
    "dutyPaidDate",
    "clearedDate",
    "deliveryDate",
  ].includes(fieldKey);

  if (fieldKey === "currency") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        style={dropdownStyle}
      >
        <option value="USD">USD</option>
        <option value="INR">INR</option>
      </select>
    );
  }

  if (fieldKey === "typeBOE") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        style={dropdownStyle}
      >
        <option value="Bonding">Bonding</option>
        <option value="Duty Payment">Duty Payment</option>
      </select>
    );
  }

  if (isDateField) {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        style={inputStyle}
      />
    );
  }

  // ✅ Default input with optional suggestions
  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={`Enter ${label}`}
        style={{
          ...inputStyle,
          borderRadius: showSuggestions ? "8px 8px 0 0" : "8px",
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div style={suggestionBoxStyle}>
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(item)}
              style={suggestionItemStyle(idx, suggestions.length)}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#eff6ff")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "white")}
            >
              {fieldKey === "vendor" ? (
                <div>
                  <div style={{ fontWeight: 500 }}>{item.cardCode}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{item.cardName}</div>
                </div>
              ) : (
                <div>{item}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 🔹 Common Styles
const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  fontSize: "14px",
  backgroundColor: "white",
  outline: "none",
};

const dropdownStyle = {
  ...inputStyle,
  borderRadius: "8px",
};

const suggestionBoxStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  backgroundColor: "white",
  border: "1px solid #93c5fd",
  borderTop: "none",
  borderRadius: "0 0 8px 8px",
  maxHeight: "200px",
  overflowY: "auto",
  zIndex: 1000,
};

const suggestionItemStyle = (idx, total) => ({
  padding: "10px 14px",
  cursor: "pointer",
  borderBottom: idx < total - 1 ? "1px solid #eee" : "none",
});

export default InputField;
