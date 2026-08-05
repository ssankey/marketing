// // pages/stock-check/index.js - Updated Main Page
// import React, { useState } from 'react';
// import ThreeColumnTable from './first-page';
// import SecondPage from './second-page';
// import SelectedItemsPage from './third-page';

// export default function StockChangePage() {
//   const [currentPage, setCurrentPage] = useState('first');
//   const [tableData, setTableData] = useState([]);
//   const [headerValues, setHeaderValues] = useState({ refNo: '', discount: '' });
//   const [selectedItemsData, setSelectedItemsData] = useState([]);
//   const [quantitiesData, setQuantitiesData] = useState({});

//   const handleTransmit = (data, headerData) => {
//     setTableData(data);
//     setHeaderValues(headerData);
//     setCurrentPage('second');
//   };

//   const handleBackToFirstPage = () => {
//     setCurrentPage('first');
//   };

//   const handleViewSelected = (selectedData, quantities) => {
//     setSelectedItemsData(selectedData);
//     setQuantitiesData(quantities);
//     setCurrentPage('selected');
//   };

//   const handleBackToSecondPage = () => {
//     setCurrentPage('second');
//   };

//   return (
//     <div className="w-full py-8">
//       {currentPage === 'first' ? (
//         <ThreeColumnTable onTransmit={handleTransmit} />
//       ) : currentPage === 'second' ? (
//         <SecondPage 
//           initialData={tableData} 
//           headerValues={headerValues}
//           onBack={handleBackToFirstPage}
//           onViewSelected={handleViewSelected}
//         />
//       ) : (
//         <SelectedItemsPage 
//           selectedData={selectedItemsData}
//           quantities={quantitiesData}
//           onBack={handleBackToSecondPage}
//         />
//       )}
//     </div>
//   );
// }

// pages/stock-check/index.js - Updated Main Page with state management
import React, { useState } from 'react';
import ThreeColumnTable from './first-page';
import SecondPage from './second-page';
import SelectedItemsPage from './third-page';

export default function StockChangePage() {
  const [currentPage, setCurrentPage] = useState('first');
  const [tableData, setTableData] = useState([]);
  const [headerValues, setHeaderValues] = useState({ refNo: '', discount: '' });
  const [selectedItemsData, setSelectedItemsData] = useState([]);
  const [quantitiesData, setQuantitiesData] = useState({});
  
  // State for first page - lifted up to maintain persistence
  const [firstPageData, setFirstPageData] = useState({
    headerRefNo: '',
    headerDiscount: '',
    tableData: Array(25).fill().map((_, index) => ({
      id: index + 1,
      casNo: '',
      refNo: '',
      discount: ''
    }))
  });

  const handleTransmit = (data, headerData) => {
    setTableData(data);
    setHeaderValues(headerData);
    setCurrentPage('second');
  };

  const handleBackToFirstPage = () => {
    setCurrentPage('first');
  };

  const handleViewSelected = (selectedData, quantities) => {
    setSelectedItemsData(selectedData);
    setQuantitiesData(quantities);
    setCurrentPage('selected');
  };

  const handleBackToSecondPage = () => {
    setCurrentPage('second');
  };

  const handleFirstPageDataChange = (newData) => {
    setFirstPageData(newData);
  };

  const handleClearAll = () => {
    setFirstPageData({
      headerRefNo: '',
      headerDiscount: '',
      tableData: Array(25).fill().map((_, index) => ({
        id: index + 1,
        casNo: '',
        refNo: '',
        discount: ''
      }))
    });
  };

  return (
    <div className="w-full py-8">
      {currentPage === 'first' ? (
        <ThreeColumnTable 
          onTransmit={handleTransmit}
          firstPageData={firstPageData}
          onDataChange={handleFirstPageDataChange}
          onClearAll={handleClearAll}
        />
      ) : currentPage === 'second' ? (
        <SecondPage 
          initialData={tableData} 
          headerValues={headerValues}
          onBack={handleBackToFirstPage}
          onViewSelected={handleViewSelected}
        />
      ) : (
        <SelectedItemsPage 
          selectedData={selectedItemsData}
          quantities={quantitiesData}
          onBack={handleBackToSecondPage}
        />
      )}
    </div>
  );
}