

// // components/page/order-lifecycle/index.js
// import React, { useState, useEffect } from 'react';
// import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Search, X } from 'lucide-react';

// const OrderLifecycleTable = () => {
//   const [data, setData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(15);
//   const [searchTerm, setSearchTerm] = useState('');
  
//   // Calculate pagination based on filtered data
//   const totalItems = filteredData.length;
//   const totalPages = Math.ceil(totalItems / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const currentData = filteredData.slice(startIndex, endIndex);

//   // Format date function
//   const formatDate = (dateString) => {
//     if (!dateString || dateString === 'N/A') return 'N/A';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric'
//       });
//     } catch (e) {
//       return 'N/A';
//     }
//   };

//   // Search functionality
//   const handleSearch = (value) => {
//     setSearchTerm(value);
//     setCurrentPage(1); // Reset to first page when searching
    
//     if (!value.trim()) {
//       setFilteredData(data);
//       return;
//     }

//     const filtered = data.filter((item) => {
//       const searchLower = value.toLowerCase();
//       return (
//         (item.CustomerRefNo && item.CustomerRefNo.toLowerCase().includes(searchLower)) ||
//         (item.Item_No && item.Item_No.toLowerCase().includes(searchLower)) ||
//         (item.PO_Date && formatDate(item.PO_Date).toLowerCase().includes(searchLower)) ||
//         (item.GRN_Date && formatDate(item.GRN_Date).toLowerCase().includes(searchLower)) ||
//         (item.Invoice_Date && formatDate(item.Invoice_Date).toLowerCase().includes(searchLower)) ||
//         (item.Dispatch_Date && formatDate(item.Dispatch_Date).toLowerCase().includes(searchLower))
//       );
//     });
    
//     setFilteredData(filtered);
//   };

//   // Clear search
//   const clearSearch = () => {
//     setSearchTerm('');
//     setFilteredData(data);
//     setCurrentPage(1);
//   };

//   // Fetch data function
//   const fetchData = async () => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       // Get token from localStorage (same as your sales-cogs pattern)
//       const token = localStorage.getItem('token');
      
//       if (!token) {
//         throw new Error('Authentication token not found. Please login first.');
//       }

//       console.log('Making request to:', '/api/order-lifecycle');
//       console.log('Token exists:', !!token);

//       const response = await fetch('/api/order-lifecycle', {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       console.log('Response status:', response.status);
//       console.log('Response headers:', Object.fromEntries(response.headers));

//       if (!response.ok) {
//         if (response.status === 401) {
//           throw new Error('Session expired. Please login again.');
//         }
        
//         // Check if response is JSON or HTML
//         const contentType = response.headers.get('content-type');
//         if (contentType && contentType.includes('application/json')) {
//           const errorData = await response.json();
//           throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//         } else {
//           // If it's HTML, get the text content for debugging
//           const htmlResponse = await response.text();
//           console.error('HTML Response:', htmlResponse.substring(0, 500));
//           throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
//         }
//       }

//       // Check content type before parsing JSON
//       const contentType = response.headers.get('content-type');
//       if (!contentType || !contentType.includes('application/json')) {
//         const textResponse = await response.text();
//         console.error('Non-JSON Response:', textResponse.substring(0, 500));
//         throw new Error('Server returned non-JSON response');
//       }

//       const result = await response.json();
//       console.log('API Response:', result);
//       setData(result);
//       setFilteredData(result);
//     } catch (err) {
//       console.error('Full error details:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load data on component mount
//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Pagination handlers
//   const goToPage = (page) => {
//     setCurrentPage(page);
//   };

//   const goToPreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const goToNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pages = [];
//     const maxVisiblePages = 5;
    
//     if (totalPages <= maxVisiblePages) {
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       const start = Math.max(1, currentPage - 2);
//       const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
//       if (start > 1) {
//         pages.push(1);
//         if (start > 2) pages.push('...');
//       }
      
//       for (let i = start; i <= end; i++) {
//         pages.push(i);
//       }
      
//       if (end < totalPages) {
//         if (end < totalPages - 1) pages.push('...');
//         pages.push(totalPages);
//       }
//     }
    
//     return pages;
//   };

//   // Show loading state
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
//         <div className="text-center">
//           <RefreshCw className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
//           <p className="text-xl text-gray-700 font-medium">Loading order lifecycle data...</p>
//           <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-rose-50">
//         <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
//           <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <button
//             onClick={fetchData}
//             className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Main dashboard view
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header Section */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
//             <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//             </svg>
//           </div>
//           <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//             Order Lifecycle Dashboard
//           </h1>
//           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//             Comprehensive tracking of your orders from PO creation to final dispatch
//           </p>
//         </div>

//         {/* Search and Controls Section */}
//         <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             {/* Search Bar */}
//             <div className="relative flex-1 max-w-md">
//               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                 <Search className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 value={searchTerm}
//                 onChange={(e) => handleSearch(e.target.value)}
//                 placeholder="Search by reference, item code, or date..."
//                 className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-700 placeholder-gray-400"
//               />
//               {searchTerm && (
//                 <button
//                   onClick={clearSearch}
//                   className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               )}
//             </div>

//             {/* Summary Info */}
//             <div className="flex items-center gap-6 text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                 <span className="text-gray-600">
//                   <span className="font-semibold text-gray-900">{totalItems}</span> orders
//                   {searchTerm && ` (filtered from ${data.length})`}
//                 </span>
//               </div>
//               <button
//                 onClick={fetchData}
//                 disabled={loading}
//                 className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
//               >
//                 <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//                 Refresh
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Table Container */}
//         <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
//                   <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
//                     Reference No
//                   </th>
//                   <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
//                     Item Code
//                   </th>
//                   <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
//                     PO Date
//                   </th>
//                   <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
//                     GRN Date
//                   </th>
//                   <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
//                     Invoice Date
//                   </th>
//                   <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
//                     Dispatch Date
//                   </th>
//                   <th className="px-6 py-5 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
//                     PO to GRN<br/>
//                     <span className="font-normal text-gray-300">(Days)</span>
//                   </th>
//                   <th className="px-6 py-5 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
//                     GRN to Invoice<br/>
//                     <span className="font-normal text-gray-300">(Days)</span>
//                   </th>
//                   <th className="px-6 py-5 text-center text-xs font-bold text-white uppercase tracking-wider">
//                     Invoice to Dispatch<br/>
//                     <span className="font-normal text-gray-300">(Days)</span>
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {currentData.length === 0 ? (
//                   <tr>
//                     <td colSpan="9" className="px-6 py-16 text-center">
//                       <div className="flex flex-col items-center">
//                         <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
//                         <h3 className="text-lg font-medium text-gray-900 mb-2">
//                           {searchTerm ? 'No matching results' : 'No data available'}
//                         </h3>
//                         <p className="text-gray-500">
//                           {searchTerm 
//                             ? 'Try adjusting your search criteria' 
//                             : 'No order lifecycle data found'
//                           }
//                         </p>
//                         {searchTerm && (
//                           <button
//                             onClick={clearSearch}
//                             className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
//                           >
//                             Clear search
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   currentData.map((row, index) => (
//                     <tr
//                       key={`${row.CustomerRefNo}-${index}`}
//                       className={`hover:bg-blue-50 transition-all duration-200 ${
//                         index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
//                       }`}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-semibold text-gray-900">
//                           {row.CustomerRefNo || 'N/A'}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-700 font-medium">
//                           {row.Item_No || 'N/A'}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
//                           row.PO_Date 
//                             ? 'bg-blue-100 text-blue-800' 
//                             : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {formatDate(row.PO_Date)}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-center">
//                         <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-xs font-bold ${
//                           row.PO_to_GRN_Days !== null && row.PO_to_GRN_Days !== undefined
//                             ? row.PO_to_GRN_Days <= 7
//                               ? 'bg-green-100 text-green-800'
//                               : row.PO_to_GRN_Days <= 14
//                                 ? 'bg-yellow-100 text-yellow-800'
//                                 : 'bg-red-100 text-red-800'
//                             : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {row.PO_to_GRN_Days !== null && row.PO_to_GRN_Days !== undefined ? row.PO_to_GRN_Days : '-'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
//                           row.GRN_Date 
//                             ? 'bg-green-100 text-green-800' 
//                             : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {formatDate(row.GRN_Date)}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-center">
//                         <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-xs font-bold ${
//                           row.GRN_to_Invoice_Days !== null && row.GRN_to_Invoice_Days !== undefined
//                             ? row.GRN_to_Invoice_Days <= 3
//                               ? 'bg-green-100 text-green-800'
//                               : row.GRN_to_Invoice_Days <= 7
//                                 ? 'bg-yellow-100 text-yellow-800'
//                                 : 'bg-red-100 text-red-800'
//                             : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {row.GRN_to_Invoice_Days !== null && row.GRN_to_Invoice_Days !== undefined ? row.GRN_to_Invoice_Days : '-'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
//                           row.Invoice_Date 
//                             ? 'bg-yellow-100 text-yellow-800' 
//                             : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {formatDate(row.Invoice_Date)}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-center">
//                         <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-xs font-bold ${
//                           row.Invoice_to_Dispatch_Days !== null && row.Invoice_to_Dispatch_Days !== undefined
//                             ? row.Invoice_to_Dispatch_Days <= 2
//                               ? 'bg-green-100 text-green-800'
//                               : row.Invoice_to_Dispatch_Days <= 5
//                                 ? 'bg-yellow-100 text-yellow-800'
//                                 : 'bg-red-100 text-red-800'
//                             : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {row.Invoice_to_Dispatch_Days !== null && row.Invoice_to_Dispatch_Days !== undefined ? row.Invoice_to_Dispatch_Days : '-'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
//                           row.Dispatch_Date 
//                             ? 'bg-purple-100 text-purple-800' 
//                             : 'bg-gray-100 text-gray-600'
//                         }`}>
//                           {formatDate(row.Dispatch_Date)}
//                         </span>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Enhanced Pagination */}
//           {totalPages > 1 && (
//             <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
//               <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
//                 <div className="text-sm text-gray-600">
//                   Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
//                   <span className="font-semibold text-gray-900">{Math.min(endIndex, totalItems)}</span> of{' '}
//                   <span className="font-semibold text-gray-900">{totalItems}</span> results
//                 </div>
                
//                 <div className="flex items-center space-x-1">
//                   {/* Previous Button */}
//                   <button
//                     onClick={goToPreviousPage}
//                     disabled={currentPage === 1}
//                     className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
//                       currentPage === 1
//                         ? 'text-gray-400 cursor-not-allowed'
//                         : 'text-gray-700 hover:bg-white hover:shadow-md hover:text-gray-900'
//                     }`}
//                   >
//                     <ChevronLeft className="h-4 w-4 mr-1" />
//                     Previous
//                   </button>

//                   {/* Page Numbers */}
//                   <div className="flex items-center space-x-1">
//                     {getPageNumbers().map((page, index) => (
//                       <React.Fragment key={index}>
//                         {page === '...' ? (
//                           <span className="px-3 py-2 text-gray-500">...</span>
//                         ) : (
//                           <button
//                             onClick={() => goToPage(page)}
//                             className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
//                               page === currentPage
//                                 ? 'bg-blue-600 text-white shadow-lg font-semibold'
//                                 : 'text-gray-700 hover:bg-white hover:shadow-md'
//                             }`}
//                           >
//                             {page}
//                           </button>
//                         )}
//                       </React.Fragment>
//                     ))}
//                   </div>

//                   {/* Next Button */}
//                   <button
//                     onClick={goToNextPage}
//                     disabled={currentPage === totalPages}
//                     className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
//                       currentPage === totalPages
//                         ? 'text-gray-400 cursor-not-allowed'
//                         : 'text-gray-700 hover:bg-white hover:shadow-md hover:text-gray-900'
//                     }`}
//                   >
//                     Next
//                     <ChevronRight className="h-4 w-4 ml-1" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrderLifecycleTable;


// pages/order-lifecycle.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import OrderLifecycleTable from "components/order-lifecycle/OrderLifeCycleTable";

export default function OrderLifecyclePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/order-lifecycle`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order lifecycle data: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  if (authLoading) {
    return <div>Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <OrderLifecycleTable
      data={data}
      isLoading={loading}
    />
  );
}

OrderLifecyclePage.seo = {
  title: "Order Lifecycle | Density",
  description: "Track your orders from PO to dispatch with detailed timeline information.",
  keywords: "order lifecycle, PO, GRN, invoice, dispatch",
};