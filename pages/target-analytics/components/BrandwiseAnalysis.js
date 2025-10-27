

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

  // Hardcoded target margin values for categories (%)
  const targetMarginValues = {
    "3A Chemicals": 25,
    "BIKAI": 20,
    "CATO": 30,
    "FD Cell": 25,
    "KANTO": 25,
    "Capricorn": 20,
    "VOLAB": 20,
    "Density": 20,
    "Deutero": 25,
    "Trading": 15,
    "Life Science": 25,
    "Other": 20,
  };

  // Updated category mapping configuration
  const categoryMapping = {
    Items: "Trading",
    "3A Chemicals": "3A Chemicals",
    Catalyst: "Density",
    Solvent: "Density",
    Polymer: "Density",
    "Fine Chemicals": "Density",
    Reagent: "Density",
    "Biological Buffers": "Life Science",
    Intermediates: "Density",
    API: "CATO",
    "Stable Isotope reagents": "Deutero",
    "Building Blocks": "Density",
    Membranes: "Life Science",
    "Laboratory Containers & Storage": "FD Cell",
    Enzyme: "Life Science",
    Biochemicals: "Life Science",
    "Reference Materials": "KANTO",
    "Secondary Standards": "KANTO",
    Instruments: "BIKAI",
    Services: "NULL",
    "Analytical Standards": "KANTO",
    "Nucleosides and Nucleotides": "Life Science",
    Nitrosamine: "CATO",
    "Pesticide Standards": "CATO",
    Trading: "Trading",
    Carbohydrates: "Life Science",
    "USP Standards": "CATO",
    "EP Standards": "CATO",
    "Indian pharmacopoeia": "CATO",
    "British Pharmacopoeia": "CATO",
    Impurity: "CATO",
    "NMR Solvents": "Deutero",
    "Stable isotopes": "Deutero",
    Glucuronides: "CATO",
    Metabolites: "CATO",
    Capricorn: "Capricorn",
    "Analytical Instruments": "BIKAI",
    "Lab Consumables": "FD Cell",
    "Equipment and Instruments": "BIKAI",
    Ultrapur: "KANTO",
    Dyes: "Density",
    "New Life Biologics": "Life Science",
    "Food Grade": "Life Science",
    "Lab Systems & Fixtures": "BIKAI",
    Peptides: "Life Science",
    "Ultrapur-100": "KANTO",
    "Amino Acids": "Life Science",
    "Cell Culture": "Life Science",
    "Natural Products": "Life Science",
    "Multiple Pharmacopoeia": "CATO",
    "Metal Standard Solutions": "KANTO",
    "High Purity Acids": "KANTO",
    "HPLC consumables": "BIKAI",
    "HPLC configurations": "BIKAI",
    VOLAB: "VOLAB",
    "Life science": "Life Science",
    Kanto: "KANTO",
    "Meatls&materials": "Density",
  };

  // Function to merge categories in frontend
  const mergeCategories = (rawData) => {
    const mergedData = {};

    rawData.forEach((row) => {
      const key = `${row.Year}-${row.Month}`;

      if (!mergedData[key]) {
        mergedData[key] = {
          Year: row.Year,
          Month: row.Month,
          MonthNumber: row.MonthNumber,
        };
      }

      // Process each category column in the row
      Object.keys(row).forEach((column) => {
        if (column.endsWith("_Sales") || column.endsWith("_Margin")) {
          const originalCategory = column.replace(/_Sales|_Margin/, "");
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

          if (column.endsWith("_Sales")) {
            // Add sales directly
            mergedData[key][salesKey] += row[column] || 0;
          } else if (column.endsWith("_Margin")) {
            // For margin, store temporary data for weighted calculation
            if (!mergedData[key]._tempMargins) {
              mergedData[key]._tempMargins = {};
            }
            if (!mergedData[key]._tempMargins[targetCategory]) {
              mergedData[key]._tempMargins[targetCategory] = {
                totalWeightedMargin: 0,
                totalSales: 0,
              };
            }
            const sales = row[`${originalCategory}_Sales`] || 0;
            const margin = row[column] || 0;
            mergedData[key]._tempMargins[targetCategory].totalWeightedMargin +=
              sales * (margin / 100);
            mergedData[key]._tempMargins[targetCategory].totalSales += sales;
          }
        }
      });
    });

    // Calculate final weighted margins
    Object.keys(mergedData).forEach((key) => {
      const row = mergedData[key];
      if (row._tempMargins) {
        Object.keys(row._tempMargins).forEach((category) => {
          const { totalWeightedMargin, totalSales } = row._tempMargins[category];
          const marginKey = `${category}_Margin`;
          const marginValue =
            totalSales > 0 ? (totalWeightedMargin / totalSales) * 100 : 0;
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

        if (mergedData.length > 0) {
          // 🔧 NEW: Build category list as a UNION across ALL rows
          const categorySet = new Set();
          mergedData.forEach((r) => {
            Object.keys(r).forEach((k) => {
              if (k.endsWith("_Sales")) {
                const cat = k.replace("_Sales", "");
                if (cat !== "_tempMargins" && categoryMapping[cat] !== "NULL") {
                  categorySet.add(cat);
                }
              }
            });
          });

          // Optional: stable ordering for nicer presentation
          const preferredOrder = [
            "3A Chemicals",
            "BIKAI",
            "CATO",
            "FD Cell",
            "KANTO",
            "Capricorn",
            "VOLAB",
            "Density",
            "Deutero",
            "Trading",
            "Life Science",
            "Other",
          ];
          const finalCategories = [
            ...preferredOrder.filter((c) => categorySet.has(c)),
            ...[...categorySet].filter((c) => !preferredOrder.includes(c)),
          ];

          console.log("🎯 FINAL CATEGORIES (UNION):", finalCategories);

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
  };

  const handleDownloadExcel = () => {
    exportToExcel(data, categories, selectedYear, targetMarginValues);
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
          targetMargins={targetMarginValues}
        />
      )}
    </div>
  );
}
