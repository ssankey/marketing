
// // pages/stock-check/third-page.js - Updated with sequential display numbers
// import React, { useState, useEffect } from 'react';
// import * as XLSX from "xlsx";

// export default function SelectedItemsPage({ selectedData, quantities, onBack }) {
//   const [itemsWithDisplayNumbers, setItemsWithDisplayNumbers] = useState([]);

//   useEffect(() => {
//     // Add sequential display numbers to selected items
//     const dataWithDisplayNumbers = selectedData.map((item, index) => ({
//       ...item,
//       displaySLNO: index + 1 // Sequential display number starting from 1
//     }));
//     setItemsWithDisplayNumbers(dataWithDisplayNumbers);
//   }, [selectedData]);

//   const exportToExcel = () => {
//   // Prepare data rows
//   const headers = [
//     'S.No', 'CAS', 'Description', 'Cat_No', 'Customer Pack', 'Quantity', 'UOM',
//     'Stock In India', 'China Stock', 'HAZ / Non HAZ', 'Price',
//     'Discount', 'Final Price', 'Reference', 'Qty', 'Value'
//   ];

//   const rows = itemsWithDisplayNumbers.map(item => {
//     const customerPack = item.packSize?.quantity && item.packSize?.uom
//       ? `${item.packSize.quantity} ${item.packSize.uom}`
//       : '-';

//     return [
//       item.displaySLNO,
//       item.CAS || '',
//       item.Description || '',
//       item.Cat_No || '',
//       customerPack,
//       item.Quantity || '',
//       item.UOM || '',
//       item['Stock In India'] || '',
//       item['China Stock'] || '',
//       item['HAZ / Non HAZ'] || '',
//       item.Price || '',
//       item.discount || '',
//       parseFloat(item.finalPrice || 0).toFixed(2),
//       item.refNo || '',
//       quantities[item.SLNO] || 0,
//       parseFloat(item.value || 0).toFixed(2)
//     ];
//   });

//   // Create worksheet
//   const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
//   // Define the range of cells in the worksheet
//   const range = XLSX.utils.decode_range(worksheet['!ref']);
  
//   // Apply styling to all cells
//   for (let R = range.s.r; R <= range.e.r; R++) {
//     for (let C = range.s.c; C <= range.e.c; C++) {
//       const cellAddress = { c: C, r: R };
//       const cellRef = XLSX.utils.encode_cell(cellAddress);
      
//       // Initialize cell if it doesn't exist
//       if (!worksheet[cellRef]) {
//         worksheet[cellRef] = { t: 's', v: '' };
//       }
      
//       // Apply cell styling
//       worksheet[cellRef].s = {
//         alignment: { 
//           horizontal: "center", 
//           vertical: "center",
//           wrapText: true
//         },
//         border: {
//           top: { style: "thin", color: { rgb: "000000" } },
//           bottom: { style: "thin", color: { rgb: "000000" } },
//           left: { style: "thin", color: { rgb: "000000" } },
//           right: { style: "thin", color: { rgb: "000000" } }
//         },
//         font: {
//           sz: R === 0 ? 12 : 11, // Header font size 12, data font size 11
//           bold: R === 0 // Make header row bold
//         }
//       };
//     }
//   }

//   // Set column widths for better readability
//   const colWidths = [
//     { wch: 6 },  // S.No
//     { wch: 12 }, // CAS
//     { wch: 40 }, // Description
//     { wch: 12 }, // Cat_No
//     { wch: 15 }, // Customer Pack
//     { wch: 10 }, // Quantity
//     { wch: 8 },  // UOM
//     { wch: 15 }, // Stock In India
//     { wch: 12 }, // China Stock
//     { wch: 15 }, // HAZ / Non HAZ
//     { wch: 10 }, // Price
//     { wch: 10 }, // Discount
//     { wch: 12 }, // Final Price
//     { wch: 12 }, // Reference
//     { wch: 6 },  // Qty
//     { wch: 12 }  // Value
//   ];
  
//   worksheet['!cols'] = colWidths;

//   // Create workbook
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Items");
  
//   // Export the file
//   XLSX.writeFile(workbook, "selected_items.xlsx");
// };

//   const totalValue = itemsWithDisplayNumbers.reduce((sum, item) => sum + item.value, 0);
//   // Count pack size matches for statistics
//   const packSizeMatches = itemsWithDisplayNumbers.filter(item => item.packSizeMatches).length;

//   return (
//     <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)', padding: '24px' }}>
//       <div style={{ width: '100%' }}>
//         <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #dbeafe' }}>
//           {/* Component Header */}
//           <div style={{ 
//             padding: '32px', 
//             borderBottom: '1px solid #93c5fd', 
//             background: 'linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)', 
//             borderRadius: '16px 16px 0 0' 
//           }}>
//             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
//               <div>
//                 <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d', margin: 0 }}>All Selected Items</h2>
//                 <p style={{ fontSize: '16px', color: '#16a34a', marginTop: '8px', margin: '8px 0 0 0' }}>
//                   Your selected stock items ready for export
//                   <span style={{ display: 'block', fontSize: '14px', color: '#059669', marginTop: '4px' }}>
//                     🟢 Green rows indicate pack size matches with your input
//                   </span>
//                 </p>
//               </div>
//               <div style={{ display: 'flex', gap: '12px' }}>
//                 <button
//                   onClick={onBack}
//                   style={{
//                     padding: '12px 24px',
//                     backgroundColor: 'white',
//                     color: '#16a34a',
//                     fontWeight: '600',
//                     borderRadius: '8px',
//                     border: '2px solid #16a34a',
//                     cursor: 'pointer',
//                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//                     transition: 'all 0.2s'
//                   }}
//                   onMouseOver={(e) => {
//                     e.target.style.backgroundColor = '#16a34a';
//                     e.target.style.color = 'white';
//                   }}
//                   onMouseOut={(e) => {
//                     e.target.style.backgroundColor = 'white';
//                     e.target.style.color = '#16a34a';
//                   }}
//                 >
//                   Back
//                 </button>
//                 <button
//                   onClick={exportToExcel}
//                   style={{
//                     padding: '12px 24px',
//                     backgroundColor: '#15803d',
//                     color: 'white',
//                     fontWeight: '600',
//                     borderRadius: '8px',
//                     border: 'none',
//                     cursor: 'pointer',
//                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//                     transition: 'all 0.2s',
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '8px'
//                   }}
//                   onMouseOver={(e) => e.target.style.backgroundColor = '#166534'}
//                   onMouseOut={(e) => e.target.style.backgroundColor = '#15803d'}
//                 >
//                   <span>📊</span>
//                   Export to Excel
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div style={{ padding: '32px' }}>
//             <div style={{ backgroundColor: 'white', border: '2px solid #86efac', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
//               {/* Table */}
//               <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                   <thead style={{ background: 'linear-gradient(90deg, #15803d 0%, #166534 100%)', position: 'sticky', top: 0, zIndex: 10 }}>
//                     <tr>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>S.No</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>CAS</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Description</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Cat_No</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Customer Pack</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Quantity</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>UOM</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Stock In India</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>China Stock</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>HAZ / Non HAZ</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Price</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Discount</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Final Price</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Reference</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Qty</th>
//                       <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d' }}>Value</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {itemsWithDisplayNumbers.map((item) => (
//                       <tr 
//                         key={item.SLNO} 
//                         style={{ 
//                           borderBottom: '1px solid #bbf7d0',
//                           backgroundColor: item.packSizeMatches ? '#dcfce7' : 'transparent'
//                         }}
//                       >
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.displaySLNO}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.CAS}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.Description}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.Cat_No}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>
//                           {item.packSize?.quantity && item.packSize?.uom ? (
//                             <span style={{ 
//                               fontSize: '14px', 
//                               fontWeight: '500',
//                               color: item.packSizeMatches ? '#059669' : '#6b7280'
//                             }}>
//                               {item.packSize.quantity} {item.packSize.uom}
//                               {item.packSizeMatches && <span style={{ marginLeft: '8px' }}>✅</span>}
//                             </span>
//                           ) : (
//                             <span style={{ color: '#9ca3af', fontSize: '14px' }}>-</span>
//                           )}
//                         </td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.Quantity}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.UOM}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item['Stock In India']}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item['China Stock']}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item['HAZ / Non HAZ']}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.Price}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.discount}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.finalPrice.toFixed(2)}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.refNo}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{quantities[item.SLNO] || 0}</td>
//                         <td style={{ padding: '12px', border: '1px solid #86efac' }}>{item.value.toFixed(2)}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Footer with Statistics */}
//               <div style={{ 
//                 background: 'linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)', 
//                 borderTop: '2px solid #86efac', 
//                 padding: '24px' 
//               }}>
//                 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//                   <div style={{ fontSize: '16px', color: '#15803d', fontWeight: '500' }}>
//                     Selected Items: <span style={{ fontWeight: 'bold', color: '#166534' }}>{itemsWithDisplayNumbers.length}</span> |
//                     Pack Size Matches: <span style={{ fontWeight: 'bold', color: '#059669' }}>{packSizeMatches}</span> |
//                     Total Value: <span style={{ fontWeight: 'bold', color: '#166534' }}>
//                       {totalValue.toFixed(2)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// pages/stock-check/third-page.js - Updated with full-width table and proper borders
import React, { useState, useEffect } from 'react';
import * as XLSX from "xlsx";

export default function SelectedItemsPage({ selectedData, quantities, onBack }) {
  const [itemsWithDisplayNumbers, setItemsWithDisplayNumbers] = useState([]);

  useEffect(() => {
    // Add sequential display numbers to selected items
    const dataWithDisplayNumbers = selectedData.map((item, index) => ({
      ...item,
      displaySLNO: index + 1 // Sequential display number starting from 1
    }));
    setItemsWithDisplayNumbers(dataWithDisplayNumbers);
  }, [selectedData]);

  const exportToExcel = () => {
    // Prepare data rows
    const headers = [
      'S.No', 'CAS', 'Description', 'Cat_No', 'Customer Pack', 'Quantity', 'UOM',
      'Stock In India', 'China Stock', 'HAZ / Non HAZ', 'Price',
      'Discount', 'Final Price', 'Reference', 'Qty', 'Value'
    ];

    const rows = itemsWithDisplayNumbers.map(item => {
      const customerPack = item.packSize?.quantity && item.packSize?.uom
        ? `${item.packSize.quantity} ${item.packSize.uom}`
        : '-';

      return [
        item.displaySLNO,
        item.CAS || '',
        item.Description || '',
        item.Cat_No || '',
        customerPack,
        item.Quantity || '',
        item.UOM || '',
        item['Stock In India'] || '',
        item['China Stock'] || '',
        item['HAZ / Non HAZ'] || '',
        item.Price || '',
        item.discount || '',
        parseFloat(item.finalPrice || 0).toFixed(2),
        item.refNo || '',
        quantities[item.SLNO] || 0,
        parseFloat(item.value || 0).toFixed(2)
      ];
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Define the range of cells in the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Apply styling to all cells
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        
        // Initialize cell if it doesn't exist
        if (!worksheet[cellRef]) {
          worksheet[cellRef] = { t: 's', v: '' };
        }
        
        // Apply cell styling
        worksheet[cellRef].s = {
          alignment: { 
            horizontal: "center", 
            vertical: "center",
            wrapText: true
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          },
          font: {
            sz: R === 0 ? 12 : 11, // Header font size 12, data font size 11
            bold: R === 0 // Make header row bold
          }
        };
      }
    }

    // Set column widths for better readability
    const colWidths = [
      { wch: 6 },  // S.No
      { wch: 12 }, // CAS
      { wch: 40 }, // Description
      { wch: 12 }, // Cat_No
      { wch: 15 }, // Customer Pack
      { wch: 10 }, // Quantity
      { wch: 8 },  // UOM
      { wch: 15 }, // Stock In India
      { wch: 12 }, // China Stock
      { wch: 15 }, // HAZ / Non HAZ
      { wch: 10 }, // Price
      { wch: 10 }, // Discount
      { wch: 12 }, // Final Price
      { wch: 12 }, // Reference
      { wch: 6 },  // Qty
      { wch: 12 }  // Value
    ];
    
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Items");
    
    // Export the file
    XLSX.writeFile(workbook, "selected_items.xlsx");
  };

  const totalValue = itemsWithDisplayNumbers.reduce((sum, item) => sum + item.value, 0);
  // Count pack size matches for statistics
  const packSizeMatches = itemsWithDisplayNumbers.filter(item => item.packSizeMatches).length;

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
                <p style={{ fontSize: '16px', color: '#16a34a', marginTop: '8px', margin: '8px 0 0 0' }}>
                  Your selected stock items ready for export
                  <span style={{ display: 'block', fontSize: '14px', color: '#059669', marginTop: '4px' }}>
                    🟢 Green rows indicate pack size matches with your input
                  </span>
                </p>
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
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed' // Ensures consistent column sizing
                }}>
                  <thead style={{ 
                    background: 'linear-gradient(90deg, #15803d 0%, #166534 100%)', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 10 
                  }}>
                    <tr>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '5%' }}>S.No</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '8%' }}>CAS</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '20%' }}>Description</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '8%' }}>Cat_No</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '10%' }}>Customer Pack</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '7%' }}>Quantity</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '5%' }}>UOM</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '10%' }}>Stock In India</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '8%' }}>China Stock</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '10%' }}>HAZ / Non HAZ</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '7%' }}>Price</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '7%' }}>Discount</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '8%' }}>Final Price</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '8%' }}>Reference</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '5%' }}>Qty</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'white', border: '1px solid #15803d', width: '8%' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsWithDisplayNumbers.map((item) => (
                      <tr 
                        key={item.SLNO} 
                        style={{ 
                          borderBottom: '1px solid #bbf7d0',
                          backgroundColor: item.packSizeMatches ? '#dcfce7' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '5%' }}>{item.displaySLNO}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '8%' }}>{item.CAS}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '20%' }}>{item.Description}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '8%' }}>{item.Cat_No}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '10%' }}>
                          {item.packSize?.quantity && item.packSize?.uom ? (
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: '500',
                              color: item.packSizeMatches ? '#059669' : '#6b7280'
                            }}>
                              {item.packSize.quantity} {item.packSize.uom}
                              {item.packSizeMatches && <span style={{ marginLeft: '8px' }}>✅</span>}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '7%' }}>{item.Quantity}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '5%' }}>{item.UOM}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '10%' }}>{item['Stock In India']}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '8%' }}>{item['China Stock']}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '10%' }}>{item['HAZ / Non HAZ']}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '7%' }}>{item.Price}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '7%' }}>{item.discount}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '8%' }}>{item.finalPrice.toFixed(2)}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '8%' }}>{item.refNo}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '5%' }}>{quantities[item.SLNO] || 0}</td>
                        <td style={{ padding: '12px', border: '1px solid #86efac', width: '8%' }}>{item.value.toFixed(2)}</td>
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
                    Selected Items: <span style={{ fontWeight: 'bold', color: '#166534' }}>{itemsWithDisplayNumbers.length}</span> |
                    Pack Size Matches: <span style={{ fontWeight: 'bold', color: '#059669' }}>{packSizeMatches}</span> |
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