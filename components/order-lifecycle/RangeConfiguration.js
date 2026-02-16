

// components/order-lifecycle/RangeConfiguration.js
import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_RANGES = [
  { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
  { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
  { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
  { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
  { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
];

const RangeConfiguration = ({ 
  customRanges, 
  onRangesChange, 
  onApplyRanges 
}) => {
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [tempRanges, setTempRanges] = useState([...customRanges]);
  const [showApplyButton, setShowApplyButton] = useState(false);
  const rangeDropdownRef = useRef(null);

  // Update tempRanges when customRanges changes
  useEffect(() => {
    setTempRanges([...customRanges]);
  }, [customRanges]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(event.target)) {
        setShowRangeDropdown(false);
        setShowApplyButton(false);
        setTempRanges([...customRanges]); // Reset temp ranges
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [customRanges]);

  const handleRangeInputChange = (rangeId, field, value) => {
    // Allow empty values for editing
    if (value === '') {
      setTempRanges(prev => prev.map(range => 
        range.id === rangeId 
          ? { ...range, [field]: '' }
          : range
      ));
      setShowApplyButton(true);
      return;
    }

    const numValue = parseInt(value);
    
    // Allow any positive number or zero
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    setTempRanges(prev => {
      const newRanges = prev.map(range => {
        if (range.id === rangeId) {
          const updated = { ...range };
          if (field === 'min') {
            updated.min = numValue;
          } else if (field === 'max') {
            updated.max = numValue;
          }
          return updated;
        }
        return range;
      });

      setShowApplyButton(true);
      return newRanges;
    });
  };

  const handleApplyRanges = () => {
    // Validate before applying
    const validatedRanges = tempRanges.map(range => ({
      ...range,
      min: range.min === '' ? 0 : parseInt(range.min),
      max: range.max === '' ? 999 : parseInt(range.max)
    }));

    // Final validation
    let isValid = true;
    let errorMessage = '';

    for (let i = 0; i < validatedRanges.length; i++) {
      const current = validatedRanges[i];
      
      // Check min < max for current range (except last one which can have max=999)
      if (current.max !== 999 && current.min >= current.max) {
        isValid = false;
        errorMessage = `Range ${i + 1}: Minimum (${current.min}) must be less than maximum (${current.max})`;
        break;
      }
      
      // Check that ranges connect properly (no gaps)
      if (i < validatedRanges.length - 1) {
        const next = validatedRanges[i + 1];
        if (current.max + 1 !== next.min) {
          isValid = false;
          errorMessage = `Range ${i + 1} and ${i + 2}: Gap detected. Range ${i + 1} ends at ${current.max} but Range ${i + 2} starts at ${next.min}`;
          break;
        }
      }
    }

    if (!isValid) {
      alert(errorMessage);
      return;
    }

    // Update labels based on ranges
    const updatedRanges = validatedRanges.map((range, index) => {
      if (index === validatedRanges.length - 1) {
        // Last range - use "X+ days"
        return {
          ...range,
          label: `${range.min}+ days`
        };
      } else {
        return {
          ...range,
          label: `${range.min}-${range.max} days`
        };
      }
    });

    // Apply ranges
    onApplyRanges(updatedRanges);
    setShowApplyButton(false);
    setShowRangeDropdown(false);
  };

  const handleResetRanges = () => {
    setTempRanges([...DEFAULT_RANGES]);
    onApplyRanges([...DEFAULT_RANGES]);
    setShowApplyButton(false);
  };

  return (
    <div style={{ position: "relative", flex: "0 0 auto" }} ref={rangeDropdownRef}>
      <button
        onClick={() => setShowRangeDropdown(!showRangeDropdown)}
        style={{
          padding: "10px 16px",
          background: "#f3f4f6",
          color: "#374151",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          whiteSpace: "nowrap"
        }}
      >
        <span>⚙️ Configure Ranges</span>
        <span style={{ fontSize: 12 }}>
          {showRangeDropdown ? '▲' : '▼'}
        </span>
      </button>

      {showRangeDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            padding: 16,
            zIndex: 1000,
            minWidth: 320,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid #e5e7eb"
          }}>
            <h6 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111827" }}>
              Customize Day Ranges
            </h6>
            <button
              onClick={handleResetRanges}
              style={{
                padding: "4px 12px",
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Reset to Default
            </button>
          </div>

          {tempRanges.map((range, index) => (
            <div key={range.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: range.color,
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, minWidth: 70, color: "#374151" }}>
                  Range {index + 1}:
                </span>
                <input
                  type="number"
                  value={range.min}
                  onChange={(e) => handleRangeInputChange(range.id, 'min', e.target.value)}
                  min="0"
                  style={{
                    width: 60,
                    padding: "6px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    textAlign: "center"
                  }}
                />
                <span style={{ fontSize: 13, color: "#6b7280" }}>to</span>
                {index === tempRanges.length - 1 ? (
                  <div
                    style={{
                      width: 60,
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      textAlign: "center",
                      background: "#f9fafb",
                      color: "#6b7280",
                      fontWeight: 500
                    }}
                  >
                    ∞
                  </div>
                ) : (
                  <input
                    type="number"
                    value={range.max}
                    onChange={(e) => handleRangeInputChange(range.id, 'max', e.target.value)}
                    min={parseInt(range.min) + 1}
                    style={{
                      width: 60,
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      textAlign: "center"
                    }}
                  />
                )}
                <span style={{ fontSize: 13, color: "#6b7280" }}>days</span>
              </div>
            </div>
          ))}

          {showApplyButton && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
              <button
                onClick={handleApplyRanges}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Apply Ranges
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RangeConfiguration;