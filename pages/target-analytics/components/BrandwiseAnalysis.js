
// // pages/target-analytics/components/BrandwiseAnalysis.js
// import React, { useState, useEffect } from "react";
// import FilterSection from "./brandwise/FilterSection";
// import FilterBadges from "./brandwise/FilterBadges";
// import QuarterlyTable from "./brandwise/QuarterlyTable";
// import LoadingState from "./brandwise/LoadingState";
// import EmptyState from "./brandwise/EmptyState";
// import { processDataForDisplay } from "utils/brandwise/dataProcessing";
// import { exportToExcel } from "utils/brandwise/excelExport";

// export default function BrandwiseAnalysis() {
//   const [isMobile, setIsMobile] = useState(false);
//   const [selectedYear, setSelectedYear] = useState("FY 2025-26");
//   const [selectedSalesPerson, setSelectedSalesPerson] = useState("");
//   const [selectedRegion, setSelectedRegion] = useState("");
//   const [selectedState, setSelectedState] = useState("");
//   const [data, setData] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Category mapping configuration - left side from backend, right side for frontend
//   const categoryMapping = {
//     "Items": "Life Science",
//     "3A Chemicals": "3A Chemicals", 
//     "Catalyst": "Density",
//     "Solvent": "Density",
//     "Polymer": "Density",
//     "Fine Chemicals": "Density",
//     "Reagent": "Density",
//     "Biological Buffers": "Life Science",
//     "Cylinders": "NULL",
//     "Intermediates": "Density", 
//     "API": "CATO",
//     "Stable Isotope reagents": "Deutero",
//     "Building Blocks": "Density",
//     "Membranes": "NULL",
//     "Cans": "NULL",
//     "Laboratory Containers & Storage": "FD Cell",
//     "Enzyme": "Life Science",
//     "Biochemicals": "Life Science",
//     "Reference Materials": "NULL",
//     "Secondary Standards": "NULL", 
//     "Instruments": "NULL",
//     "Services": "NULL",
//     "Analytical Standards": "NULL",
//     "Nucleosides and Nucleotides": "NULL",
//     "Nitrosamine": "CATO",
//     "Pesticide Standards": "CATO",
//     "Trading": "Trading",
//     "Packaging Materials": "NULL",
//     "Carbohydrates": "Life Science",
//     "USP Standards": "NULL",
//     "EP Standards": "NULL",
//     "Indian pharmacopoeia": "NULL",
//     "British Pharmacopoeia": "CATO",
//     "Impurity": "CATO",
//     "NMR Solvents": "Deutero",
//     "Stable isotopes": "Deutero",
//     "Glucuronides": "NULL",
//     "Metabolites": "NULL",
//     "Capricorn": "Capricorn",
//     "Analytical Instruments": "BIKAI",
//     "Lab Consumables": "FD Cell",
//     "Equipment and Instruments": "NULL",
//     "Ultrapur": "KANTO",
//     "Assets": "NULL",
//     "Dyes": "Density",
//     "New Life Biologics": "Life Science", 
//     "Food Grade": "NULL",
//     "Lab Systems & Fixtures": "NULL",
//     "Peptides": "Life Science",
//     "Ultrapur-100": "KANTO",
//     "Amino Acids": "Life Science",
//     "Cell Culture": "NULL",
//     "Natural Products": "Life Science",
//     "Multiple Pharmacopoeia": "NULL",
//     "Metal Standard Solutions": "KANTO",
//     "High Purity Acids": "NULL",
//     "HPLC consumables": "BIKAI",
//     "HPLC configurations": "BIKAI",
//     "VOLAB": "NULL",
//     "Life science": "NULL",
//     "Kanto": "NULL", 
//     "Meatls&materials": "NULL",
//     "Fixed Assets": "NULL"
//   };

//   // Function to merge categories in frontend
//   const mergeCategories = (rawData) => {
//     const mergedData = {};
    
//     rawData.forEach(row => {
//       const key = `${row.Year}-${row.Month}`;
      
//       if (!mergedData[key]) {
//         mergedData[key] = {
//           Year: row.Year,
//           Month: row.Month,
//           MonthNumber: row.MonthNumber
//         };
//       }
      
//       // Process each category column in the row
//       Object.keys(row).forEach(column => {
//         if (column.endsWith('_Sales') || column.endsWith('_Margin')) {
//           const originalCategory = column.replace(/_Sales|_Margin/, '');
//           const targetCategory = categoryMapping[originalCategory] || "Other";
          
//           // Skip NULL categories
//           if (targetCategory === "NULL") return;
          
//           const salesKey = `${targetCategory}_Sales`;
//           const marginKey = `${targetCategory}_Margin`;
          
//           // Initialize if not exists
//           if (!mergedData[key][salesKey]) {
//             mergedData[key][salesKey] = 0;
//             mergedData[key][marginKey] = 0;
//           }
          
//           if (column.endsWith('_Sales')) {
//             // Add sales directly
//             mergedData[key][salesKey] += row[column] || 0;
//           } else if (column.endsWith('_Margin')) {
//             // For margin, we need to calculate weighted average later
//             // Store temporary data for weighted calculation
//             if (!mergedData[key]._tempMargins) {
//               mergedData[key]._tempMargins = {};
//             }
//             if (!mergedData[key]._tempMargins[targetCategory]) {
//               mergedData[key]._tempMargins[targetCategory] = {
//                 totalWeightedMargin: 0,
//                 totalSales: 0
//               };
//             }
//             const sales = row[`${originalCategory}_Sales`] || 0;
//             const margin = row[column] || 0;
//             mergedData[key]._tempMargins[targetCategory].totalWeightedMargin += sales * (margin / 100);
//             mergedData[key]._tempMargins[targetCategory].totalSales += sales;
//           }
//         }
//       });
//     });
    
//     // Calculate final weighted margins - ROUND TO 2 DECIMALS
//     Object.keys(mergedData).forEach(key => {
//       const row = mergedData[key];
//       if (row._tempMargins) {
//         Object.keys(row._tempMargins).forEach(category => {
//           const { totalWeightedMargin, totalSales } = row._tempMargins[category];
//           const marginKey = `${category}_Margin`;
//           const marginValue = totalSales > 0 ? 
//             (totalWeightedMargin / totalSales) * 100 : 0;
//           // Round to 2 decimals
//           row[marginKey] = Number(marginValue.toFixed(2));
//         });
//         // Remove temporary data
//         delete row._tempMargins;
//       }
//     });
    
//     return Object.values(mergedData);
//   };

//   // Check for mobile viewport
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   // Fetch data automatically on component mount
//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const params = new URLSearchParams({
//         year: selectedYear,
//         ...(selectedSalesPerson && { slpCode: selectedSalesPerson }),
//         ...(selectedRegion && { region: selectedRegion }),
//         ...(selectedState && { state: selectedState }),
//       });

//       const response = await fetch(
//         `/api/target-analytics/quarterly-analysis?${params}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       const result = await response.json();

//       console.log("🔍 RAW API DATA:", result.data);

//       if (result.data && result.data.length > 0) {
//         // Merge categories in frontend
//         const mergedData = mergeCategories(result.data);
//         console.log("🔀 MERGED DATA:", mergedData);
        
//         // Extract final categories from merged data (excluding NULL categories)
//         if (mergedData.length > 0) {
//           const finalCategories = Object.keys(mergedData[0])
//             .filter(key => key.endsWith('_Sales'))
//             .map(key => key.replace('_Sales', ''))
//             .filter(cat => cat !== '_tempMargins' && categoryMapping[cat] !== "NULL"); // Exclude temp data and NULL categories
          
//           console.log("🎯 FINAL CATEGORIES:", finalCategories);
          
//           setCategories(finalCategories);
//           setData(processDataForDisplay(mergedData, finalCategories));
//         } else {
//           setCategories([]);
//           setData([]);
//         }
//       } else {
//         setCategories([]);
//         setData([]);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setCategories([]);
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyFilters = () => {
//     fetchData();
//   };

//   const handleResetFilters = () => {
//     setSelectedYear("FY 2025-26");
//     setSelectedSalesPerson("");
//     setSelectedRegion("");
//     setSelectedState("");
//     setTimeout(() => {
//       fetchData();
//     }, 100);
//   };

//   const handleDownloadExcel = () => {
//     exportToExcel(data, categories, selectedYear);
//   };

//   return (
//     <div style={{ padding: isMobile ? "12px" : "24px" }}>
//       <FilterSection
//         isMobile={isMobile}
//         selectedYear={selectedYear}
//         setSelectedYear={setSelectedYear}
//         selectedSalesPerson={selectedSalesPerson}
//         setSelectedSalesPerson={setSelectedSalesPerson}
//         selectedRegion={selectedRegion}
//         setSelectedRegion={setSelectedRegion}
//         selectedState={selectedState}
//         setSelectedState={setSelectedState}
//         onApply={handleApplyFilters}
//         onReset={handleResetFilters}
//       />

//       <FilterBadges
//         isMobile={isMobile}
//         selectedYear={selectedYear}
//         selectedSalesPerson={selectedSalesPerson}
//         selectedRegion={selectedRegion}
//         selectedState={selectedState}
//       />

//       {loading ? (
//         <LoadingState isMobile={isMobile} />
//       ) : data.length === 0 ? (
//         <EmptyState isMobile={isMobile} />
//       ) : (
//         <QuarterlyTable
//           isMobile={isMobile}
//           data={data}
//           categories={categories}
//           onDownloadExcel={handleDownloadExcel}
//         />
//       )}
//     </div>
//   );
// }


// pages/target-analytics/components/BrandwiseAnalysis.js
import React, { useState, useEffect } from "react";
import FilterSection from "./brandwise/FilterSection";
import FilterBadges from "./brandwise/FilterBadges";
import QuarterlyTable from "./brandwise/QuarterlyTable";
import LoadingState from "./brandwise/LoadingState";
import EmptyState from "./brandwise/EmptyState";
import { processDataForDisplay } from "utils/brandwise/dataProcessing";
import { exportToExcel } from "utils/brandwise/excelExport";

export default function BrandwiseAnalysis() {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedYear, setSelectedYear] = useState("FY 2025-26");
  const [selectedSalesPerson, setSelectedSalesPerson] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Category mapping configuration
  const categoryMapping = {
    "Items": "Life Science",
    "3A Chemicals": "3A Chemicals", 
    "Catalyst": "Density",
    "Solvent": "Density",
    "Polymer": "Density",
    "Fine Chemicals": "Density",
    "Reagent": "Density",
    "Biological Buffers": "Life Science",
    "Cylinders": "NULL",
    "Intermediates": "Density", 
    "API": "CATO",
    "Stable Isotope reagents": "Deutero",
    "Building Blocks": "Density",
    "Membranes": "NULL",
    "Cans": "NULL",
    "Laboratory Containers & Storage": "FD Cell",
    "Enzyme": "Life Science",
    "Biochemicals": "Life Science",
    "Reference Materials": "NULL",
    "Secondary Standards": "NULL", 
    "Instruments": "NULL",
    "Services": "NULL",
    "Analytical Standards": "NULL",
    "Nucleosides and Nucleotides": "NULL",
    "Nitrosamine": "CATO",
    "Pesticide Standards": "CATO",
    "Trading": "Trading",
    "Packaging Materials": "NULL",
    "Carbohydrates": "Life Science",
    "USP Standards": "NULL",
    "EP Standards": "NULL",
    "Indian pharmacopoeia": "NULL",
    "British Pharmacopoeia": "CATO",
    "Impurity": "CATO",
    "NMR Solvents": "Deutero",
    "Stable isotopes": "Deutero",
    "Glucuronides": "NULL",
    "Metabolites": "NULL",
    "Capricorn": "Capricorn",
    "Analytical Instruments": "BIKAI",
    "Lab Consumables": "FD Cell",
    "Equipment and Instruments": "NULL",
    "Ultrapur": "KANTO",
    "Assets": "NULL",
    "Dyes": "Density",
    "New Life Biologics": "Life Science", 
    "Food Grade": "NULL",
    "Lab Systems & Fixtures": "NULL",
    "Peptides": "Life Science",
    "Ultrapur-100": "KANTO",
    "Amino Acids": "Life Science",
    "Cell Culture": "NULL",
    "Natural Products": "Life Science",
    "Multiple Pharmacopoeia": "NULL",
    "Metal Standard Solutions": "KANTO",
    "High Purity Acids": "NULL",
    "HPLC consumables": "BIKAI",
    "HPLC configurations": "BIKAI",
    "VOLAB": "NULL",
    "Life science": "NULL",
    "Kanto": "NULL", 
    "Meatls&materials": "NULL",
    "Fixed Assets": "NULL"
  };

  // Function to merge categories in frontend
  const mergeCategories = (rawData) => {
    const mergedData = {};
    
    rawData.forEach(row => {
      const key = `${row.Year}-${row.Month}`;
      
      if (!mergedData[key]) {
        mergedData[key] = {
          Year: row.Year,
          Month: row.Month,
          MonthNumber: row.MonthNumber
        };
      }
      
      // Process each category column in the row
      Object.keys(row).forEach(column => {
        if (column.endsWith('_Sales') || column.endsWith('_Margin')) {
          const originalCategory = column.replace(/_Sales|_Margin/, '');
          const targetCategory = categoryMapping[originalCategory] || "Other";
          
          // Skip NULL categories
          if (targetCategory === "NULL") return;
          
          const salesKey = `${targetCategory}_Sales`;
          const marginKey = `${targetCategory}_Margin`;
          
          // Initialize if not exists
          if (!mergedData[key][salesKey]) {
            mergedData[key][salesKey] = 0;
            mergedData[key][marginKey] = 0;
          }
          
          if (column.endsWith('_Sales')) {
            // Add sales directly
            mergedData[key][salesKey] += row[column] || 0;
          } else if (column.endsWith('_Margin')) {
            // For margin, we need to calculate weighted average later
            // Store temporary data for weighted calculation
            if (!mergedData[key]._tempMargins) {
              mergedData[key]._tempMargins = {};
            }
            if (!mergedData[key]._tempMargins[targetCategory]) {
              mergedData[key]._tempMargins[targetCategory] = {
                totalWeightedMargin: 0,
                totalSales: 0
              };
            }
            const sales = row[`${originalCategory}_Sales`] || 0;
            const margin = row[column] || 0;
            mergedData[key]._tempMargins[targetCategory].totalWeightedMargin += sales * (margin / 100);
            mergedData[key]._tempMargins[targetCategory].totalSales += sales;
          }
        }
      });
    });
    
    // Calculate final weighted margins
    Object.keys(mergedData).forEach(key => {
      const row = mergedData[key];
      if (row._tempMargins) {
        Object.keys(row._tempMargins).forEach(category => {
          const { totalWeightedMargin, totalSales } = row._tempMargins[category];
          const marginKey = `${category}_Margin`;
          const marginValue = totalSales > 0 ? 
            (totalWeightedMargin / totalSales) * 100 : 0;
          row[marginKey] = Number(marginValue.toFixed(2));
        });
        // Remove temporary data
        delete row._tempMargins;
      }
    });
    
    return Object.values(mergedData);
  };

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedSalesPerson, selectedRegion, selectedState]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        year: selectedYear,
        ...(selectedSalesPerson && { slpCode: selectedSalesPerson }),
        ...(selectedRegion && { region: selectedRegion }),
        ...(selectedState && { state: selectedState }),
      });

      const response = await fetch(
        `/api/target-analytics/quarterly-analysis?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();

      console.log("🔍 RAW API DATA:", result.data);

      if (result.data && result.data.length > 0) {
        // Merge categories in frontend
        const mergedData = mergeCategories(result.data);
        console.log("🔀 MERGED DATA:", mergedData);
        
        // Extract final categories from merged data (excluding NULL categories)
        if (mergedData.length > 0) {
          const finalCategories = Object.keys(mergedData[0])
            .filter(key => key.endsWith('_Sales'))
            .map(key => key.replace('_Sales', ''))
            .filter(cat => cat !== '_tempMargins' && categoryMapping[cat] !== "NULL");
          
          console.log("🎯 FINAL CATEGORIES:", finalCategories);
          
          setCategories(finalCategories);
          setData(processDataForDisplay(mergedData, finalCategories));
        } else {
          setCategories([]);
          setData([]);
        }
      } else {
        setCategories([]);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setCategories([]);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedYear("FY 2025-26");
    setSelectedSalesPerson("");
    setSelectedRegion("");
    setSelectedState("");
    // No need to call fetchData here as useEffect will trigger automatically
  };

  const handleDownloadExcel = () => {
    exportToExcel(data, categories, selectedYear);
  };

  return (
    <div style={{ padding: isMobile ? "12px" : "24px" }}>
      <FilterSection
        isMobile={isMobile}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedSalesPerson={selectedSalesPerson}
        setSelectedSalesPerson={setSelectedSalesPerson}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        onReset={handleResetFilters}
        // Removed onApply prop since we auto-fetch now
      />

      <FilterBadges
        isMobile={isMobile}
        selectedYear={selectedYear}
        selectedSalesPerson={selectedSalesPerson}
        selectedRegion={selectedRegion}
        selectedState={selectedState}
      />

      {loading ? (
        <LoadingState isMobile={isMobile} />
      ) : data.length === 0 ? (
        <EmptyState isMobile={isMobile} />
      ) : (
        <QuarterlyTable
          isMobile={isMobile}
          data={data}
          categories={categories}
          onDownloadExcel={handleDownloadExcel}
        />
      )}
    </div>
  );
}