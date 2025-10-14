

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

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch data automatically on component mount
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

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

      if (result.data && result.data.length > 0) {
        // Extract categories from column names
        const firstRow = result.data[0];
        const categoryNames = Object.keys(firstRow)
          .filter((key) => key.endsWith("_Sales"))
          .map((key) => key.replace("_Sales", ""));

        setCategories(categoryNames);
        setData(processDataForDisplay(result.data, categoryNames));
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

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleResetFilters = () => {
    setSelectedYear("FY 2025-26");
    setSelectedSalesPerson("");
    setSelectedRegion("");
    setSelectedState("");
    // Fetch data after resetting - with a slight delay to ensure state updates
    setTimeout(() => {
      fetchData();
    }, 100);
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
        onApply={handleApplyFilters}
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
        />
      )}
    </div>
  );
}