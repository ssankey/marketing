// pages/stock-change/first-page.js
import React, { useState } from 'react';

export default function ThreeColumnTable() {
  const [headerRefNo, setHeaderRefNo] = useState('');
  const [headerDiscount, setHeaderDiscount] = useState('');
  const [tableData, setTableData] = useState(
    Array(25).fill().map((_, index) => ({
      id: index + 1,
      casNo: '',
      refNo: '',
      discount: ''
    }))
  );

  const handleInputChange = (rowIndex, field, value) => {
    setTableData(prev => 
      prev.map((row, index) => 
        index === rowIndex ? { ...row, [field]: value } : row
      )
    );
  };

  const handleTransmit = () => {
    setTableData(prev => 
      prev.map(row => ({
        ...row,
        refNo: headerRefNo || row.refNo,
        discount: headerDiscount || row.discount
      }))
    );
  };

  const handleClearAll = () => {
    setHeaderRefNo('');
    setHeaderDiscount('');
    setTableData(prev => 
      prev.map(row => ({
        ...row,
        casNo: '',
        refNo: '',
        discount: ''
      }))
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Component Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Quick Stock Check</h2>
            <p className="text-sm text-gray-600 mt-1">Paste the CAS No , Ref no and Discount</p>
          </div>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Table Header */}
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 w-1/3">
                  CAS No
                  <div className="mt-2 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-500 text-xs">
                    Individual Entry
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 w-1/3">
                  Reference No
                  <div className="mt-2">
                    <input
                      type="text"
                      value={headerRefNo}
                      onChange={(e) => setHeaderRefNo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter to fill all"
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-1/3">
                  Discount
                  <div className="mt-2">
                    <input
                      type="text"
                      value={headerDiscount}
                      onChange={(e) => setHeaderDiscount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter to fill all"
                    />
                  </div>
                </th>
              </tr>
            </thead>
          </table>

          {/* Table Body */}
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 border-r border-gray-200 w-1/3">
                      <input
                        type="text"
                        value={row.casNo}
                        onChange={(e) => handleInputChange(index, 'casNo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={`CAS No ${index + 1}`}
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 w-1/3">
                      <input
                        type="text"
                        value={row.refNo}
                        onChange={(e) => handleInputChange(index, 'refNo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={`Reference No ${index + 1}`}
                      />
                    </td>
                    <td className="px-4 py-3 w-1/3">
                      <input
                        type="text"
                        value={row.discount}
                        onChange={(e) => handleInputChange(index, 'discount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={`Discount ${index + 1}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with Transmit Button */}
          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total Rows: {tableData.length} | 
                Filled Rows: {tableData.filter(row => row.casNo || row.refNo || row.discount).length}
              </div>
              <div className="space-x-3">
                <button
                  onClick={handleTransmit}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Transmit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Enter values in the "Reference No" and "Discount" header fields</li>
            <li>• Click "Transmit" to fill all corresponding rows with those values</li>
            <li>• Individual cells can still be edited manually after transmission</li>
            <li>• Use "Clear All" to reset the entire table</li>
          </ul>
        </div>
      </div>
    </div>
  );
}