
// pages/in-bound-shipments/DateInputField.js
import React, { useState, useRef, useEffect } from "react";

const DateInputField = ({ fieldKey, value, onChange }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [textValue, setTextValue] = useState(value ? formatToDisplay(value) : "");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const calendarRef = useRef(null);
  const dateInputRef = useRef(null);

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  function formatToDisplay(isoDate) {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  }

  // Validate and convert DD/MM/YYYY to YYYY-MM-DD
  function formatToISO(displayDate) {
    if (!displayDate || displayDate.length < 10) return null;
    
    const parts = displayDate.split("/");
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Validate ranges
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 1900 || year > 2100) return null;
    
    // Check if date is valid (handles leap years, month lengths, etc)
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      return null;
    }
    
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isoDate;
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  // Open calendar picker automatically
  useEffect(() => {
    if (showCalendar && dateInputRef.current) {
      setTimeout(() => {
        try {
          dateInputRef.current.showPicker?.();
        } catch (e) {
          dateInputRef.current.focus();
        }
      }, 50);
    }
  }, [showCalendar]);

  // Auto-format as user types
  const handleTextChange = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // Remove non-digits
    
    if (input.length > 8) input = input.slice(0, 8); // Max 8 digits (DDMMYYYY)

    let formatted = "";
    if (input.length > 0) {
      formatted = input.slice(0, 2); // DD
      if (input.length > 2) {
        formatted += "/" + input.slice(2, 4); // MM
      }
      if (input.length > 4) {
        formatted += "/" + input.slice(4, 8); // YYYY
      }
    }

    setTextValue(formatted);
    setError("");

    // Validate and update parent if we have complete date
    if (input.length === 8) {
      const isoDate = formatToISO(formatted);
      if (isoDate) {
        onChange(fieldKey, isoDate);
        setError("");
      } else {
        setError("Invalid date");
        onChange(fieldKey, "");
      }
    } else {
      onChange(fieldKey, "");
    }
  };

  const handleCalendarChange = (e) => {
    const isoDate = e.target.value;
    onChange(fieldKey, isoDate);
    setTextValue(formatToDisplay(isoDate));
    setError("");
    setShowCalendar(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setTextValue("");
    setError("");
    onChange(fieldKey, "");
    setShowCalendar(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCalendarButtonClick = (e) => {
    e.stopPropagation();
    setShowCalendar(!showCalendar);
  };

  return (
    <div style={{ position: "relative" }} ref={calendarRef}>
      <div style={{ display: "flex", gap: "4px" }}>
        <input
          ref={inputRef}
          type="text"
          value={textValue}
          onChange={handleTextChange}
          placeholder="DD/MM/YYYY *"
          maxLength={10}
          style={{
            flex: 1,
            padding: "8px 32px 8px 12px",
            border: `1px solid ${error ? "#ef4444" : "#93c5fd"}`,
            borderRadius: "6px",
            fontSize: "12px",
            backgroundColor: "white",
            outline: "none",
            transition: "border-color 0.2s ease"
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = "#60a5fa";
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = "#93c5fd";
          }}
        />
        
        {/* Clear button */}
        {textValue && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: "absolute",
              right: "36px",
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
              transition: "all 0.2s ease",
              zIndex: 1
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

        {/* Calendar toggle button */}
        <button
          type="button"
          onClick={handleCalendarButtonClick}
          style={{
            padding: "6px 8px",
            border: "1px solid #93c5fd",
            borderRadius: "6px",
            backgroundColor: showCalendar ? "#dbeafe" : "white",
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#dbeafe";
          }}
          onMouseLeave={(e) => {
            if (!showCalendar) e.target.style.backgroundColor = "white";
          }}
        >
          📅
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ 
          fontSize: "10px", 
          color: "#ef4444", 
          marginTop: "2px",
          fontWeight: "500"
        }}>
          {error}
        </div>
      )}

      {/* Calendar picker */}
      {showCalendar && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          backgroundColor: "white",
          border: "1px solid #93c5fd",
          borderRadius: "6px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          overflow: "hidden"
        }}>
          <input
            ref={dateInputRef}
            type="date"
            value={value}
            onChange={handleCalendarChange}
            style={{
              width: "100%",
              padding: "8px",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              outline: "none",
              colorScheme: "light"
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DateInputField;