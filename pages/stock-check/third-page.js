// pages/stock-check/third-page.js
import React from 'react';

export default function SelectedItemsPage({ selectedData, quantities, onBack }) {
  const exportToExcel = () => {
    // Create CSV content with proper formatting
    const headers = [
      'SLNO', 'CAS', 'Description', 'Cat_No', 'Quantity', 'UOM', 
      'Stock In India', 'China Stock', 'HAZ / Non HAZ', 'Price', 
      'Discount', 'Final Price', 'Reference', 'Qty', 'Value'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    selectedData.forEach(item => {
      const row = [
        item.SLNO,
        `"${item.CAS}"`,
        `"${item.Description}"`,
        `"${item.Cat_No}"`,
        item.Quantity,
        `"${item.UOM}"`,
        `"${item['Stock In India']}"`,
        `"${item['China Stock']}"`,
        `"${item['HAZ / Non HAZ']}"`,
        item.Price,
        item.discount,
        item.finalPrice.toFixed(2),
        `"${item.refNo}"`,
        quantities[item.SLNO] || 0,
        item.value.toFixed(2)
      ];
      csvContent += row.join(',') + '\n';
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'selected_items.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalValue = selectedData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)', padding: '24px' }}>
      <div style={{ width: '100%' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #dbeafe' }}>
          {/* Component Header */}
          <div style={{ 
            padding: '32px', 
            borderBottom: '1px solid #93c5fd', 
            background: 'linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)', 
            borderRadius: '16px 16px 0 0' 
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d', margin: 0 }}>All Selected Items</h2>
                <p style={{ fontSize: '16px', color: '#16a34a', marginTop: '8px', margin: '8px 0 0 0' }}>Your selected stock items ready for export</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onBack}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#16a34a',
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: '2px solid #16a34a',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#16a34a';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#16a34a';
                  }}
                >
                  Back
                </button>
                <button
                  onClick={exportToExcel}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#15803d',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#166534'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#15803d'}
                >
                  <span>📊</span>
                  Export to Excel
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ backgroundColor: 'white', border: '2px solid #86efac', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
              {/* Table */}
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'linear-gradient(90deg, #15803d 0%, #166534 100%)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>SLNO</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>CAS</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Description</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Cat_No</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Quantity</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>UOM</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Stock In India</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>China Stock</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>HAZ / Non HAZ</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Price</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Discount</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Final Price</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Reference</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Qty</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.map((item) => (
                      <tr key={item.SLNO} style={{ borderBottom: '1px solid #bbf7d0' }}>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.SLNO}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.CAS}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.Description}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.Cat_No}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.Quantity}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.UOM}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item['Stock In India']}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item['China Stock']}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item['HAZ / Non HAZ']}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.Price}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.discount}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.finalPrice.toFixed(2)}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.refNo}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{quantities[item.SLNO] || 0}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer with Statistics */}
              <div style={{ 
                background: 'linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)', 
                borderTop: '2px solid #86efac', 
                padding: '24px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', color: '#15803d', fontWeight: '500' }}>
                    Selected Items: <span style={{ fontWeight: 'bold', color: '#166534' }}>{selectedData.length}</span> |
                    Total Value: <span style={{ fontWeight: 'bold', color: '#166534' }}>
                      {totalValue.toFixed(2)}
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