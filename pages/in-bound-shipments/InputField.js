
// pages/in-bound-shipments/InputField.js
import React, { useState, useEffect, useRef } from "react";
import DateInputField from "./DateInputField";

// Hardcoded Product Owners
const PRODUCT_OWNERS = [
  'Bhavani Shanker',
  'RAMAKRISHNAN SUNDARAM',
  'J Dinesh kumar',
  'Satish Nagaraj',
  'Saroj Kumar Purohit',
  'Christy Samuel',
  'Pratik Patil',
  'Mahesh Shegar',
  'Shafique',
  'Raghu B',
  'Maneesh S',
  'Dr. Prashant Kadam',
  'Jagadish Naidu M',
  'Kamal Kurra',
  'Ravindra Patil',
  'R Kalyan Babu',
  'Pratiksha Dabhane',
  'Hemanth V',
  'Ashwani Sharma',
  'Aditya Deshpande',
  'Ashish Tripathi'
];

// Hardcoded Product Categories
const PRODUCT_CATEGORIES = [
  '3A Chemicals',
  'Amino Acids',
  'Analytical Instruments',
  'Analytical Standards',
  'API',
  'Assets',
  'Biochemicals',
  'Biological Buffers',
  'British Pharmacopoeia',
  'Building Blocks',
  'Cans',
  'Capricorn',
  'Carbohydrates',
  'Catalyst',
  'Cell Culture',
  'Cylinders',
  'Dyes',
  'Enzyme',
  'EP Standards',
  'Equipment and Instruments',
  'Fine Chemicals',
  'Food Grade',
  'Glucuronides',
  'High Purity Acids',
  'HPLC configurations',
  'HPLC consumables',
  'Impurity',
  'Indian pharmacopoeia',
  'Instruments',
  'Intermediates',
  'Items',
  'Lab Consumables',
  'Lab Systems & Fixtures',
  'Laboratory Containers & Storage',
  'Membranes',
  'Metabolites',
  'Metal Standard Solutions',
  'Multiple Pharmacopoeia',
  'Natural Products',
  'New Life Biologics',
  'Nitrosamine',
  'NMR Solvents',
  'Nucleosides and Nucleotides',
  'Packaging Materials',
  'Peptides',
  'Pesticide Standards',
  'Polymer',
  'Reagent',
  'Reference Materials',
  'Secondary Standards',
  'Services',
  'Solvent',
  'Stable Isotope reagents',
  'Stable isotopes',
  'Trading',
  'Ultrapur',
  'Ultrapur-100',
  'USP Standards',
  'VOLAB'
];

// Field validation configuration
const FIELD_CONFIG = {
  invoiceValue: { type: 'decimal', maxLength: 18, decimals: 2 },
  duty: { type: 'decimal', maxLength: 18, decimals: 2 },
  vendor: { type: 'text', maxLength: 255 },
  name: { type: 'text', maxLength: 255 },
  country: { type: 'text', maxLength: 100 },
  productCategory: { type: 'text', maxLength: 255 },
  productOwners: { type: 'text', maxLength: 255 },
  supplierInvoiceNumber: { type: 'text', maxLength: 100 },
  currency: { type: 'text', maxLength: 10 },
  portOfLanding: { type: 'text', maxLength: 255 },
  typeBOE: { type: 'text', maxLength: 50 },
  chaName: { type: 'text', maxLength: 255 },
  mawbHawb: { type: 'text', maxLength: 100 },
  pkg: { type: 'text', maxLength: 100 },
  weight: { type: 'text', maxLength: 100 },
  boeSbNo: { type: 'text', maxLength: 100 },
  av: { type: 'text', maxLength: 100 },
  status: { type: 'text', maxLength: 100 },
};

const InputField = ({ fieldKey, label, value, onChange, isReadOnly = false }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isValidSelection, setIsValidSelection] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
    setIsValidSelection(!!value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateInput = (fieldKey, value) => {
    const config = FIELD_CONFIG[fieldKey];
    if (!config) return true;

    if (config.type === 'decimal') {
      if (value === '') return true;
      const numRegex = /^-?\d*\.?\d*$/;
      if (!numRegex.test(value)) {
        setValidationError('Only numbers and decimal point allowed');
        return false;
      }
      const parts = value.split('.');
      if (parts.length > 2) {
        setValidationError('Invalid decimal format');
        return false;
      }
      if (parts[1] && parts[1].length > config.decimals) {
        setValidationError(`Maximum ${config.decimals} decimal places allowed`);
        return false;
      }
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && Math.abs(numValue) >= Math.pow(10, config.maxLength - config.decimals)) {
        setValidationError(`Value too large`);
        return false;
      }
    }

    if (config.type === 'text' && value.length > config.maxLength) {
      setValidationError(`Maximum ${config.maxLength} characters allowed`);
      return false;
    }

    setValidationError('');
    return true;
  };

  // Debounced vendor fetch
  const fetchVendors = async (search = "") => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/vendors?search=${encodeURIComponent(search)}`);
        if (!res.ok) throw new Error("Failed to fetch vendors");
        const data = await res.json();
        setSuggestions(data.vendors || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Vendor fetch error:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Debounced CHA fetch
  const fetchCHA = async (search = "") => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/cha?search=${encodeURIComponent(search)}`);
        if (!res.ok) throw new Error("Failed to fetch CHA");
        const data = await res.json();
        setSuggestions(data.chaList || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("CHA fetch error:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const loadCategories = () => {
    setSuggestions(PRODUCT_CATEGORIES);
    setShowSuggestions(true);
  };

  const loadProductOwners = () => {
    setSuggestions(PRODUCT_OWNERS);
    setShowSuggestions(true);
  };

  const handleFocus = () => {
    if (fieldKey === "vendor") {
      fetchVendors("");
    } else if (fieldKey === "chaName") {
      fetchCHA("");
    } else if (fieldKey === "productCategory") {
      loadCategories();
    } else if (fieldKey === "productOwners") {
      loadProductOwners();
    }
  };

  const handleChange = (e) => {
    const typed = e.target.value;
    
    if (!validateInput(fieldKey, typed)) {
      return;
    }

    setInputValue(typed);
    setValidationError('');
    
    if (["vendor", "productCategory", "productOwners", "chaName"].includes(fieldKey)) {
      setIsValidSelection(false);
      onChange(fieldKey, "");
    } else {
      onChange(fieldKey, typed);
    }

    // Debounced filtering
    if (fieldKey === "vendor") {
      fetchVendors(typed);
    } else if (fieldKey === "chaName") {
      fetchCHA(typed);
    } else if (fieldKey === "productCategory") {
      if (typed.length > 0) {
        const filtered = PRODUCT_CATEGORIES.filter((cat) =>
          cat.toLowerCase().includes(typed.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        loadCategories();
      }
    } else if (fieldKey === "productOwners") {
      if (typed.length > 0) {
        const filtered = PRODUCT_OWNERS.filter((owner) =>
          owner.toLowerCase().includes(typed.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        loadProductOwners();
      }
    }
  };

  const handleSelect = (item) => {
    if (fieldKey === "vendor") {
      const display = `${item.cardCode} - ${item.cardName}`;
      setInputValue(display);
      setIsValidSelection(true);
      onChange(fieldKey, display, item);
    } else if (fieldKey === "chaName") {
      const display = `${item.CardCode} - ${item.CardName}`;
      setInputValue(display);
      setIsValidSelection(true);
      onChange(fieldKey, display, item);
    } else if (fieldKey === "productCategory") {
      setInputValue(item);
      setIsValidSelection(true);
      onChange(fieldKey, item);
    } else if (fieldKey === "productOwners") {
      setInputValue(item);
      setIsValidSelection(true);
      onChange(fieldKey, item);
    }
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue("");
    setIsValidSelection(false);
    onChange(fieldKey, "");
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const isSearchableDropdown = ["vendor", "productCategory", "productOwners", "chaName"].includes(fieldKey);
  
  const isDateField = [
    "preAlertFormSupplier",
    "supplierInvoiceNumberDate",
    "documentssentToCHADate",
    "sentDate",
    "mawbHawbDate",
    "landingDate",
    "boeDt",
    "dutyPaidDate",
    "clearedDate",
    "deliveryDate",
  ].includes(fieldKey);

  const isDecimalField = ["invoiceValue", "duty"].includes(fieldKey);

  if (fieldKey === "status") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        style={dropdownStyle}
        required
      >
        <option value="">Select Status *</option>
        <option value="Pending">Pending</option>
        <option value="Cleared">Cleared</option>
      </select>
    );
  }

  if (fieldKey === "currency") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        style={dropdownStyle}
        required
      >
        <option value="">Select Currency *</option>
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
        required
      >
        <option value="">Select Type *</option>
        <option value="Bonding">Bonding</option>
        <option value="Duty Payment">Duty Payment</option>
      </select>
    );
  }

  if (isDateField) {
    return <DateInputField fieldKey={fieldKey} value={value} onChange={onChange} />;
  }

  if (isSearchableDropdown) {
    const hasError = inputValue && !isValidSelection;

    return (
      <div style={{ position: "relative", minHeight: "28px" }} ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={`Select ${label} *`}
          readOnly={isReadOnly}
          required
          autoComplete="off"
          style={{
            ...inputStyle,
            paddingRight: inputValue ? "32px" : "12px",
            borderRadius: "6px",
            backgroundColor: isReadOnly ? "#f3f4f6" : "white",
            cursor: isReadOnly ? "not-allowed" : "text",
            borderColor: hasError ? "#ef4444" : "#93c5fd",
            borderWidth: hasError ? "2px" : "1px",
          }}
        />
        
        {inputValue && !isReadOnly && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: "absolute",
              right: "8px",
              top: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#6b7280",
              padding: "0",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f3f4f6";
              e.target.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#6b7280";
            }}
          >
            ×
          </button>
        )}
        
        {hasError && (
          <div style={{ 
            fontSize: "10px", 
            color: "#ef4444", 
            marginTop: "2px",
            fontWeight: "500",
            position: "absolute"
          }}>
            ⚠ Select from dropdown
          </div>
        )}

        {showSuggestions && (
          <div style={{
            ...suggestionBoxStyle,
            maxHeight: suggestions.length > 0 ? "150px" : "40px"
          }}>
            {isLoading ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: "11px", color: "#6b7280" }}>
                Loading...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  style={suggestionItemStyle(idx, suggestions.length)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#dbeafe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  {fieldKey === "vendor" || fieldKey === "chaName" ? (
                    <div>
                      <div style={{ fontWeight: 500, color: "#1e40af", fontSize: "11px" }}>
                        {fieldKey === "vendor" ? item.cardCode : item.CardCode}
                      </div>
                      <div style={{ fontSize: "10px", color: "#6b7280" }}>
                        {fieldKey === "vendor" ? item.cardName : item.CardName}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontWeight: 500, color: "#374151", fontSize: "11px" }}>
                      {item}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: "12px", textAlign: "center", color: "#6b7280", fontSize: "11px" }}>
                No results found
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        inputMode={isDecimalField ? "decimal" : "text"}
        value={value}
        onChange={handleChange}
        placeholder={`Enter ${label} *${isDecimalField ? ' (numbers only)' : ''}`}
        readOnly={isReadOnly}
        required
        style={{
          ...inputStyle,
          paddingRight: value ? "32px" : "12px",
          backgroundColor: isReadOnly ? "#f3f4f6" : "white",
          cursor: isReadOnly ? "not-allowed" : "text",
          borderColor: validationError ? "#ef4444" : "#93c5fd",
        }}
      />
      
      {value && !isReadOnly && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: "absolute",
            right: "8px",
            top: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#6b7280",
            padding: "0",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f3f4f6";
            e.target.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#6b7280";
          }}
        >
          ×
        </button>
      )}
      
      {validationError && (
        <div style={{ fontSize: "10px", color: "#ef4444", marginTop: "2px", fontWeight: "500" }}>
          {validationError}
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #93c5fd",
  borderRadius: "6px",
  fontSize: "12px",
  backgroundColor: "white",
  outline: "none",
  transition: "border-color 0.2s ease",
};

const dropdownStyle = {
  ...inputStyle,
  cursor: "pointer",
};

const suggestionBoxStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  backgroundColor: "white",
  border: "1px solid #93c5fd",
  borderTop: "1px solid #e5e7eb",
  borderRadius: "0 0 6px 6px",
  overflowY: "auto",
  zIndex: 1000,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  marginTop: "2px"
};

const suggestionItemStyle = (idx, total) => ({
  padding: "8px 10px",
  cursor: "pointer",
  borderBottom: idx < total - 1 ? "1px solid #f3f4f6" : "none",
  transition: "background-color 0.15s ease",
  backgroundColor: "white",
});

export default InputField;