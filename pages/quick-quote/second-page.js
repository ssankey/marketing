// pages/stock-check/second-page.js - Updated with CAS not found indicator
import React, { useState, useEffect } from 'react';

export default function SecondPage({ initialData, headerValues, onBack, onViewSelected }) {
  const [itemsData, setItemsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [notFoundCasNumbers, setNotFoundCasNumbers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Extract CAS numbers from initialData
        const casNumbers = initialData
          .filter(item => item.casNo && item.casNo.trim() !== '')
          .map(item => item.casNo.trim());

        const response = await fetch('/api/stock-check/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ casNumbers }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        // Find CAS numbers that were not found in the response
        const foundCasNumbers = data.items.map(item => item.CAS);
        const notFound = casNumbers.filter(cas => !foundCasNumbers.includes(cas));
        setNotFoundCasNumbers(notFound);
        
        // Combine API data with initial data (discount, reference, and pack size)
        const combinedData = data.items.map(item => {
          const initialItem = initialData.find(i => i.casNo === item.CAS);
          
          // Check if pack size matches (only quantity comparison)
          const packSizeMatches = checkPackSizeMatch(
            initialItem?.packSize,
            item.Quantity
          );
          
          return {
            ...item,
            originalSLNO: item.SLNO, // Keep original SLNO for reference
            discount: initialItem?.discount || '',
            refNo: initialItem?.refNo || '',
            packSize: initialItem?.packSize || null,
            packSizeMatches: packSizeMatches,
            finalPrice: calculateFinalPrice(item.Price, initialItem?.discount),
            qty: 0,
            value: 0,
            casFound: true // Mark as found since it's in the response
          };
        });

        // Add entries for CAS numbers that were not found
        const notFoundEntries = notFound.map((cas, index) => {
          const initialItem = initialData.find(i => i.casNo === cas);
          return {
            SLNO: combinedData.length + index + 1,
            CAS: cas,
            Description: 'Not Available',
            Cat_No: '-',
            Quantity: '-',
            UOM: '-',
            'Stock In India': '-',
            'China Stock': '-',
            'HAZ / Non HAZ': '-',
            Price: 0,
            discount: initialItem?.discount || '',
            refNo: initialItem?.refNo || '',
            packSize: initialItem?.packSize || null,
            packSizeMatches: false,
            finalPrice: 0,
            qty: 0,
            value: 0,
            casFound: false // Mark as not found
          };
        });

        // Combine found and not found items
        const allData = [...combinedData, ...notFoundEntries];

        // Sort by casFound status first (found items first), then by Final Price
        const sortedData = allData.sort((a, b) => {
          // First sort by casFound (found items first)
          if (a.casFound && !b.casFound) return -1;
          if (!a.casFound && b.casFound) return 1;
          // Then sort by final price within each group
          return a.finalPrice - b.finalPrice;
        });

        // Reassign sequential SLNO after sorting
        const dataWithSequentialSLNO = sortedData.map((item, index) => ({
          ...item,
          SLNO: index + 1 // Sequential SLNO starting from 1
        }));

        setItemsData(dataWithSequentialSLNO);
        
        // Initialize quantities using new sequential SLNO
        const initialQuantities = {};
        dataWithSequentialSLNO.forEach(item => {
          initialQuantities[item.SLNO] = 0;
        });
        setQuantities(initialQuantities);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData]);

  // Function to check if pack size matches with backend data (only quantity comparison)
  const checkPackSizeMatch = (packSize, backendQuantity) => {
    if (!packSize || !packSize.quantity) {
      return false;
    }
    
    // Convert customer input to numbers for comparison
    const customerQuantity = parseFloat(packSize.quantity);
    const backendQty = parseFloat(backendQuantity);
    
    // Check if quantities match
    return (
      !isNaN(customerQuantity) && 
      !isNaN(backendQty) &&
      customerQuantity === backendQty
    );
  };

  const calculateFinalPrice = (price, discount) => {
    if (!price || !discount) return price || 0;
    
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue)) return price;
    
    return price - (price * discountValue / 100);
  };

  const handleQuantityChange = (slno, value) => {
    const item = itemsData.find(i => i.SLNO === slno);
    
    // Don't allow quantity changes for items not found
    if (!item || !item.casFound) {
      return;
    }
    
    // Prevent negative quantities
    let qty = parseFloat(value) || 0;
    if (qty < 0) {
      qty = 0;
    }
    
    setQuantities(prev => ({ ...prev, [slno]: qty }));
    
    // Update value
    if (item) {
      const newValue = qty * item.finalPrice;
      setItemsData(prev => 
        prev.map(i => 
          i.SLNO === slno ? { ...i, qty, value: newValue } : i
        )
      );
    }
  };

  const handleCheckValue = (slno) => {
    const item = itemsData.find(i => i.SLNO === slno);
    if (item && item.casFound) {
      const qty = quantities[slno] || 0;
      const newValue = qty * item.finalPrice;
      setItemsData(prev => 
        prev.map(i => 
          i.SLNO === slno ? { ...i, value: newValue } : i
        )
      );
    }
  };

  const handleCheckAllValues = () => {
    const updatedData = itemsData.map(item => {
      if (!item.casFound) return item; // Skip not found items
      
      const qty = quantities[item.SLNO] || 0;
      return {
        ...item,
        value: qty * item.finalPrice
      };
    });
    setItemsData(updatedData);
  };

  const handleViewSelected = () => {
    // Filter items that have quantity >= 1 and were found in the system
    const validSelectedItems = itemsData.filter(item => 
      item.casFound && (quantities[item.SLNO] || 0) >= 1
    );
    
    if (validSelectedItems.length === 0) {
      alert('Please enter quantity 1 or more for at least one available item before proceeding.');
      return;
    }
    
    // Pass only the valid selected items (quantity >= 1 and found)
    onViewSelected(validSelectedItems, quantities);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ 
          fontSize: '18px', 
          color: '#2563eb', 
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '3px solid #dbeafe',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ 
          fontSize: '18px', 
          color: '#dc2626', 
          fontWeight: '500',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)', padding: '24px' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>Quick Stock Results</h2>
                <p style={{ fontSize: '16px', color: '#2563eb', marginTop: '8px', margin: '8px 0 0 0' }}>
                  Review and confirm your stock items
                  <span style={{ display: 'block', fontSize: '14px', marginTop: '8px' }}>
                    <span style={{ color: '#059669', marginRight: '16px' }}>
                      🟢 Green rows indicate PKZ matches with your input
                    </span>
                    <span style={{ color: '#dc2626' }}>
                      🔴 Light red rows indicate CAS numbers not found in our database
                    </span>
                  </span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
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
                  Back
                </button>
                <button
                  onClick={handleViewSelected}
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
                  View Selected Items
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ backgroundColor: 'white', border: '2px solid #93c5fd', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
              {/* Table */}
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>SLNO</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>CAS</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Description</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Cat_No</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>PKZ</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>UOM</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Customer PKZ</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Stock In India</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>China Stock</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>HAZ / Non HAZ</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Price</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Discount</th>
                      <th style={{ 
                        padding: '16px', 
                        textAlign: 'left', 
                        fontWeight: 'bold', 
                        color: '#1e40af', 
                        border: '1px solid #93c5fd'
                      }}>
                        Final Price
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Reference</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Qty</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsData.map((item) => (
                      <tr 
                        key={item.SLNO} 
                        style={{ 
                          borderBottom: '1px solid #dbeafe',
                          backgroundColor: !item.casFound ? '#fef2f2' : (item.packSizeMatches ? '#dcfce7' : 'transparent')
                        }}
                      >
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.SLNO}</td>
                        <td style={{ 
                          padding: '12px', 
                          border: '1px solid #93c5fd',
                          color: !item.casFound ? '#dc2626' : 'inherit'
                        }}>
                          {item.CAS}
                          
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          border: '1px solid #93c5fd',
                          color: !item.casFound ? '#dc2626' : 'inherit',
                          fontStyle: !item.casFound ? 'italic' : 'normal'
                        }}>
                          {item.Description}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.Cat_No}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.Quantity}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.UOM}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>
                          {item.packSize?.quantity ? (
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: '500',
                              color: item.packSizeMatches ? '#059669' : '#6b7280'
                            }}>
                              {item.packSize.quantity}
                              {item.packSizeMatches && <span style={{ marginLeft: '8px' }}>✅</span>}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item['Stock In India']}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item['China Stock']}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item['HAZ / Non HAZ']}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.Price}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.discount}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.finalPrice.toFixed(2)}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.refNo}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={quantities[item.SLNO] || ''}
                            onChange={(e) => handleQuantityChange(item.SLNO, e.target.value)}
                            onBlur={() => handleCheckValue(item.SLNO)}
                            disabled={!item.casFound}
                            style={{
                              width: '80px',
                              padding: '4px 8px',
                              border: '1px solid #93c5fd',
                              borderRadius: '4px',
                              backgroundColor: !item.casFound ? '#f3f4f6' : 'white',
                              cursor: !item.casFound ? 'not-allowed' : 'text'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.value.toFixed(2)}</td>
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
                    Items with Quantity: <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{itemsData.filter(item => item.casFound && (quantities[item.SLNO] || 0) > 0).length}</span> |
                    PKZ Matches: <span style={{ fontWeight: 'bold', color: '#059669' }}>{itemsData.filter(item => item.packSizeMatches).length}</span> |
                    Not Found: <span style={{ fontWeight: 'bold', color: '#965757ff' }}>{itemsData.filter(item => !item.casFound).length}</span> |
                    Total Value: <span style={{ fontWeight: 'bold', color: '#1e40af' }}>
                      {itemsData.filter(item => item.casFound).reduce((sum, item) => sum + item.value, 0).toFixed(2)}
                    </span>
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