
// pages/stock-check/first-page.js - Fixed PKZ paste functionality
import React from 'react';

export default function ThreeColumnTable({ onTransmit, onBack, firstPageData, onDataChange, onClearAll }) {
  const { headerRefNo, headerDiscount, tableData } = firstPageData;

  const handleInputChange = (rowIndex, field, value) => {
    const newTableData = tableData.map((row, index) => 
      index === rowIndex ? { ...row, [field]: value } : row
    );
    
    onDataChange({
      ...firstPageData,
      tableData: newTableData
    });
  };

  const handlePackSizeChange = (rowIndex, field, value) => {
    const newTableData = tableData.map((row, index) => 
      index === rowIndex ? { 
        ...row, 
        packSize: { 
          ...row.packSize, 
          [field]: value 
        } 
      } : row
    );
    
    onDataChange({
      ...firstPageData,
      tableData: newTableData
    });
  };

  const handleHeaderChange = (field, value) => {
    onDataChange({
      ...firstPageData,
      [field]: value
    });
  };

  const handleCasPaste = (e, startIndex) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Split by spaces, newlines, or tabs and filter out empty strings
    const values = pastedText.split(/[\s\n\t]+/).filter(val => val.trim() !== '');
    
    if (values.length > 1) {
      // Multiple values detected, distribute them
      const newTableData = [...tableData];
      values.forEach((value, i) => {
        const targetIndex = startIndex + i;
        if (targetIndex < newTableData.length) {
          newTableData[targetIndex] = { ...newTableData[targetIndex], casNo: value.trim() };
        }
      });
      
      onDataChange({
        ...firstPageData,
        tableData: newTableData
      });
    } else {
      // Single value, just paste normally
      handleInputChange(startIndex, 'casNo', pastedText.trim());
    }
  };

  const handleQuantityPaste = (e, startIndex) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Split by spaces, newlines, or tabs and filter out empty strings
    const values = pastedText.split(/[\s\n\t]+/).filter(val => val.trim() !== '');
    
    if (values.length > 1) {
      // Multiple values detected, distribute them
      const newTableData = [...tableData];
      values.forEach((value, i) => {
        const targetIndex = startIndex + i;
        if (targetIndex < newTableData.length) {
          newTableData[targetIndex] = { 
            ...newTableData[targetIndex], 
            packSize: { 
              ...(newTableData[targetIndex].packSize || {}), // Ensure packSize exists
              quantity: value.trim() 
            } 
          };
        }
      });
      
      onDataChange({
        ...firstPageData,
        tableData: newTableData
      });
    } else {
      // Single value, just paste normally
      handlePackSizeChange(startIndex, 'quantity', pastedText.trim());
    }
  };

  const handleRefNoPaste = (e, startIndex) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Split by spaces, newlines, or tabs and filter out empty strings
    const values = pastedText.split(/[\s\n\t]+/).filter(val => val.trim() !== '');
    
    if (values.length > 1) {
      // Multiple values detected, distribute them
      const newTableData = [...tableData];
      values.forEach((value, i) => {
        const targetIndex = startIndex + i;
        if (targetIndex < newTableData.length) {
          newTableData[targetIndex] = { ...newTableData[targetIndex], refNo: value.trim() };
        }
      });
      
      onDataChange({
        ...firstPageData,
        tableData: newTableData
      });
    } else {
      // Single value, just paste normally
      handleInputChange(startIndex, 'refNo', pastedText.trim());
    }
  };

  const handleDiscountPaste = (e, startIndex) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Split by spaces, newlines, or tabs and filter out empty strings
    const values = pastedText.split(/[\s\n\t]+/).filter(val => val.trim() !== '');
    
    if (values.length > 1) {
      // Multiple values detected, distribute them
      const newTableData = [...tableData];
      values.forEach((value, i) => {
        const targetIndex = startIndex + i;
        if (targetIndex < newTableData.length) {
          newTableData[targetIndex] = { ...newTableData[targetIndex], discount: value.trim() };
        }
      });
      
      onDataChange({
        ...firstPageData,
        tableData: newTableData
      });
    } else {
      // Single value, just paste normally
      handleInputChange(startIndex, 'discount', pastedText.trim());
    }
  };

  const handleTransmit = async () => {
    // Validation 1: At least one CAS entry should be filled
    const rowsWithCasNo = tableData.filter(row => row.casNo && row.casNo.trim() !== '');
    
    if (rowsWithCasNo.length === 0) {
      alert('Validation Error: At least one CAS entry must be filled before transmitting.');
      return;
    }

    // Validation 2: For each CAS entry, there should be a discount (either in header or individual)
    const invalidRows = [];
    rowsWithCasNo.forEach((row, index) => {
      const hasHeaderDiscount = headerDiscount && headerDiscount.trim() !== '';
      const hasIndividualDiscount = row.discount && row.discount.trim() !== '';
      
      if (!hasHeaderDiscount && !hasIndividualDiscount) {
        invalidRows.push(index + 1);
      }
    });

    if (invalidRows.length > 0) {
      alert(`Validation Error: The following rows with CAS entries need a discount (either in header or individual): Row ${invalidRows.join(', ')}`);
      return;
    }

    // Prepare data for transmission - prefer individual discount over header discount
    const transmissionData = tableData.map(row => {
      if (row.casNo && row.casNo.trim() !== '') {
        return {
          ...row,
          // Use individual discount if available, otherwise use header discount
          discount: (row.discount && row.discount.trim() !== '') ? row.discount : headerDiscount,
          // Use individual refNo if available, otherwise use header refNo
          refNo: (row.refNo && row.refNo.trim() !== '') ? row.refNo : headerRefNo,
          // Ensure packSize exists
          packSize: row.packSize || { quantity: '' }
        };
      }
      return row;
    }).filter(row => row.casNo && row.casNo.trim() !== ''); // Only send rows with CAS entries

    // Pass data to parent component
    onTransmit(transmissionData, { refNo: headerRefNo, discount: headerDiscount });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)', padding: '24px' }}>
      <div style={{ width: '100%' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #dbeafe' }}>
          {/* Component Header */}
          <div style={{ 
            padding: '32px', 
            borderBottom: '1px solid #93c5fd', 
            background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)', 
            borderRadius: '16px 16px 0 0' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {onBack && (
                  <button
                    onClick={onBack}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'white',
                      color: '#2563eb',
                      fontWeight: '600',
                      borderRadius: '8px',
                      border: '2px solid #2563eb',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#2563eb';
                      e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.color = '#2563eb';
                    }}
                  >
                    ← Back
                  </button>
                )}
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>Quick Quote</h2>
                  <p style={{ fontSize: '16px', color: '#2563eb', marginTop: '8px', margin: '8px 0 0 0' }}>Paste the CAS entries, PKZ, Ref no and Discount</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onClearAll}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#2563eb',
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: '2px solid #2563eb',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#2563eb';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#2563eb';
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={handleTransmit}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  Transmit
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ backgroundColor: 'white', border: '2px solid #93c5fd', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
              {/* Table Header */}
              <table style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead style={{ background: 'linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)', borderBottom: '2px solid #60a5fa' }}>
                  <tr>
                    <th style={{ padding: '24px', textAlign: 'left', fontSize: '16px', fontWeight: 'bold', color: '#1e40af', borderRight: '2px solid #60a5fa', width: '25%' }}>
                      CAS Entry
                      <div style={{ 
                        marginTop: '12px', 
                        height: '48px', 
                        backgroundColor: '#eff6ff', 
                        borderRadius: '8px', 
                        border: '2px solid #93c5fd', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#2563eb', 
                        fontSize: '14px', 
                        fontWeight: '500' 
                      }}>
                        Paste multiple CAS entries
                      </div>
                    </th>
                    <th style={{ padding: '24px', textAlign: 'left', fontSize: '16px', fontWeight: 'bold', color: '#1e40af', borderRight: '2px solid #60a5fa', width: '25%' }}>
                      PKZ
                      <div style={{ 
                        marginTop: '12px', 
                        height: '48px', 
                        backgroundColor: '#eff6ff', 
                        borderRadius: '8px', 
                        border: '2px solid #93c5fd', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#2563eb', 
                        fontSize: '14px', 
                        fontWeight: '500' 
                      }}>
                        Paste multiple quantities
                      </div>
                    </th>
                    <th style={{ padding: '24px', textAlign: 'left', fontSize: '16px', fontWeight: 'bold', color: '#1e40af', borderRight: '2px solid #60a5fa', width: '25%' }}>
                      Reference No
                      <div style={{ marginTop: '12px' }}>
                        <input
                          type="text"
                          value={headerRefNo || ''}
                          onChange={(e) => handleHeaderChange('headerRefNo', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #60a5fa',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            backgroundColor: 'white',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          placeholder="Enter to fill all / paste multiple"
                          onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                          onBlur={(e) => e.target.style.borderColor = '#60a5fa'}
                        />
                      </div>
                    </th>
                    <th style={{ padding: '24px', textAlign: 'left', fontSize: '16px', fontWeight: 'bold', color: '#1e40af', width: '25%' }}>
                      Discount (%)
                      <div style={{ marginTop: '12px' }}>
                        <input
                          type="text"
                          value={headerDiscount || ''}
                          onChange={(e) => handleHeaderChange('headerDiscount', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #60a5fa',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            backgroundColor: 'white',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          placeholder="Enter to fill all / paste multiple"
                          onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                          onBlur={(e) => e.target.style.borderColor = '#60a5fa'}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
              </table>

              {/* Table Body */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', tableLayout: 'fixed' }}>
                  <tbody>
                    {tableData.map((row, index) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #dbeafe' }}>
                        <td style={{ padding: '16px 24px', borderRight: '1px solid #93c5fd', width: '25%', verticalAlign: 'top' }}>
                          <input
                            type="text"
                            value={row.casNo || ''}
                            onChange={(e) => handleInputChange(index, 'casNo', e.target.value)}
                            onPaste={(e) => handleCasPaste(e, index)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #93c5fd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              outline: 'none',
                              transition: 'border-color 0.15s',
                              boxSizing: 'border-box'
                            }}
                            placeholder={`CAS Entry ${index + 1}`}
                            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                            onMouseOver={(e) => e.target.style.borderColor = '#60a5fa'}
                            onMouseOut={(e) => {
                              if (e.target !== document.activeElement) {
                                e.target.style.borderColor = '#93c5fd';
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '16px 24px', borderRight: '1px solid #93c5fd', width: '25%', verticalAlign: 'top' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.packSize?.quantity || ''}
                            onChange={(e) => handlePackSizeChange(index, 'quantity', e.target.value)}
                            onPaste={(e) => handleQuantityPaste(e, index)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #93c5fd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              outline: 'none',
                              transition: 'border-color 0.15s',
                              boxSizing: 'border-box'
                            }}
                            placeholder="PKZ"
                            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                            onMouseOver={(e) => e.target.style.borderColor = '#60a5fa'}
                            onMouseOut={(e) => {
                              if (e.target !== document.activeElement) {
                                e.target.style.borderColor = '#93c5fd';
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '16px 24px', borderRight: '1px solid #93c5fd', width: '25%', verticalAlign: 'top' }}>
                          <input
                            type="text"
                            value={row.refNo || ''}
                            onChange={(e) => handleInputChange(index, 'refNo', e.target.value)}
                            onPaste={(e) => handleRefNoPaste(e, index)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #93c5fd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              outline: 'none',
                              transition: 'border-color 0.15s',
                              boxSizing: 'border-box'
                            }}
                            placeholder={`Reference No ${index + 1}`}
                            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                            onMouseOver={(e) => e.target.style.borderColor = '#60a5fa'}
                            onMouseOut={(e) => {
                              if (e.target !== document.activeElement) {
                                e.target.style.borderColor = '#93c5fd';
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '16px 24px', width: '25%', verticalAlign: 'top' }}>
                          <input
                            type="text"
                            value={row.discount || ''}
                            onChange={(e) => handleInputChange(index, 'discount', e.target.value)}
                            onPaste={(e) => handleDiscountPaste(e, index)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #93c5fd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              outline: 'none',
                              transition: 'border-color 0.15s',
                              boxSizing: 'border-box'
                            }}
                            placeholder={`Discount ${index + 1}`}
                            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                            onMouseOver={(e) => e.target.style.borderColor = '#60a5fa'}
                            onMouseOut={(e) => {
                              if (e.target !== document.activeElement) {
                                e.target.style.borderColor = '#93c5fd';
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer with Statistics */}
              <div style={{ 
                background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)', 
                borderTop: '2px solid #93c5fd', 
                padding: '24px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', color: '#1d4ed8', fontWeight: '500' }}>
                    Total Rows: <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{tableData.length}</span> | 
                    CAS Entries: <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{tableData.filter(row => row.casNo && row.casNo.trim() !== '').length}</span> |
                    PKZ Entries: <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{tableData.filter(row => row.packSize && row.packSize.quantity && row.packSize.quantity.toString().trim() !== '').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}