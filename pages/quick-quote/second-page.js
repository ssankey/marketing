// pages/stock-check/second-page.js
import React, { useState, useEffect } from 'react';

export default function SecondPage({ initialData, headerValues, onBack, onViewSelected }) {
  const [itemsData, setItemsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [selectedItems, setSelectedItems] = useState({});

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
        
        // Combine API data with initial data (discount and reference)
        const combinedData = data.items.map(item => {
          const initialItem = initialData.find(i => i.casNo === item.CAS);
          return {
            ...item,
            discount: initialItem?.discount || '',
            refNo: initialItem?.refNo || '',
            finalPrice: calculateFinalPrice(item.Price, initialItem?.discount),
            qty: 0,
            value: 0,
            selected: true // Default to Yes
          };
        });

        setItemsData(combinedData);
        
        // Initialize quantities and selected items state
        const initialQuantities = {};
        const initialSelected = {};
        combinedData.forEach(item => {
          initialQuantities[item.SLNO] = 0;
          initialSelected[item.SLNO] = true; // Default to Yes
        });
        setQuantities(initialQuantities);
        setSelectedItems(initialSelected);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData]);

  const calculateFinalPrice = (price, discount) => {
    if (!price || !discount) return price || 0;
    
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue)) return price;
    
    return price - (price * discountValue / 100);
  };

  const handleQuantityChange = (slno, value) => {
    // Prevent negative quantities
    let qty = parseFloat(value) || 0;
    if (qty < 0) {
      qty = 0;
    }
    
    setQuantities(prev => ({ ...prev, [slno]: qty }));
    
    // Update value
    const item = itemsData.find(i => i.SLNO === slno);
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
    if (item) {
      const qty = quantities[slno] || 0;
      const newValue = qty * item.finalPrice;
      setItemsData(prev => 
        prev.map(i => 
          i.SLNO === slno ? { ...i, value: newValue } : i
        )
      );
    }
  };

  const handleSelectChange = (slno, value) => {
    setSelectedItems(prev => ({ ...prev, [slno]: value }));
    setItemsData(prev => 
      prev.map(i => 
        i.SLNO === slno ? { ...i, selected: value } : i
      )
    );
  };

  const handleCheckAllValues = () => {
    const updatedData = itemsData.map(item => {
      const qty = quantities[item.SLNO] || 0;
      return {
        ...item,
        value: qty * item.finalPrice
      };
    });
    setItemsData(updatedData);
  };

  const handleViewSelected = () => {
    // Filter items that are selected as "YES" AND have quantity >= 1
    const validSelectedItems = itemsData.filter(item => 
      selectedItems[item.SLNO] && (quantities[item.SLNO] || 0) >= 1
    );
    
    if (validSelectedItems.length === 0) {
      alert('Please select at least one item with quantity 1 or more before proceeding.');
      return;
    }
    
    // Pass only the valid selected items (quantity >= 1 AND selected = YES)
    onViewSelected(validSelectedItems, quantities);
  };

  // Calculate selectedData for display
  const selectedData = itemsData.filter(item => selectedItems[item.SLNO]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div>Error: {error}</div>
      </div>
    );
  }

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
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>Quick Stock Results</h2>
                <p style={{ fontSize: '16px', color: '#2563eb', marginTop: '8px', margin: '8px 0 0 0' }}>Review and confirm your stock items</p>
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
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Quantity</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>UOM</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Stock In India</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>China Stock</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>HAZ / Non HAZ</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Price</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Discount</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Final Price</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Reference</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Qty</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Value</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: '#1e40af', border: '1px solid #93c5fd' }}>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsData.map((item) => (
                      <tr key={item.SLNO} style={{ borderBottom: '1px solid #dbeafe' }}>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.SLNO}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.CAS}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.Description}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.Cat_No}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.Quantity}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.UOM}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item['Stock In India']}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.ChinaStock}</td>
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
                            style={{
                              width: '80px',
                              padding: '4px 8px',
                              border: '1px solid #93c5fd',
                              borderRadius: '4px'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>{item.value.toFixed(2)}</td>
                        <td style={{ padding: '12px', border: '1px solid #93c5fd' }}>
                          <select
                            value={selectedItems[item.SLNO] ? 'Yes' : 'No'}
                            onChange={(e) => handleSelectChange(item.SLNO, e.target.value === 'Yes')}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #93c5fd',
                              borderRadius: '4px'
                            }}
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
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
                    Selected Items: <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{selectedData.length}</span> |
                    Total Value: <span style={{ fontWeight: 'bold', color: '#1e40af' }}>
                      {selectedData.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
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