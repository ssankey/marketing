// utils/brandwise/dataProcessing.js
export const processDataForDisplay = (rawData, categoryNames) => {
  const grouped = {};
  
  rawData.forEach(row => {
    const year = row.Year;
    if (!grouped[year]) {
      grouped[year] = {};
    }
    grouped[year][row.MonthNumber] = row;
  });

  const displayData = [];
  
  Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
    const yearData = grouped[year];
    
    // Q3 (Oct, Nov, Dec)
    if (yearData[10] || yearData[11] || yearData[12]) {
      displayData.push(createQuarterRow(year, "Q3", [yearData[10], yearData[11], yearData[12]], categoryNames));
      if (yearData[12]) displayData.push({ ...yearData[12], Month: "Dec", isQuarter: false });
      if (yearData[11]) displayData.push({ ...yearData[11], Month: "Nov", isQuarter: false });
      if (yearData[10]) displayData.push({ ...yearData[10], Month: "Oct", isQuarter: false });
    }
    
    // Q2 (Jul, Aug, Sep)
    if (yearData[7] || yearData[8] || yearData[9]) {
      displayData.push(createQuarterRow(year, "Q2", [yearData[7], yearData[8], yearData[9]], categoryNames));
      if (yearData[9]) displayData.push({ ...yearData[9], Month: "Sep", isQuarter: false });
      if (yearData[8]) displayData.push({ ...yearData[8], Month: "Aug", isQuarter: false });
      if (yearData[7]) displayData.push({ ...yearData[7], Month: "Jul", isQuarter: false });
    }
    
    // Q1 (Apr, May, Jun)
    if (yearData[4] || yearData[5] || yearData[6]) {
      displayData.push(createQuarterRow(year, "Q1", [yearData[4], yearData[5], yearData[6]], categoryNames));
      if (yearData[6]) displayData.push({ ...yearData[6], Month: "Jun", isQuarter: false });
      if (yearData[5]) displayData.push({ ...yearData[5], Month: "May", isQuarter: false });
      if (yearData[4]) displayData.push({ ...yearData[4], Month: "Apr", isQuarter: false });
    }
    
    // Q4 (Jan, Feb, Mar)
    if (yearData[1] || yearData[2] || yearData[3]) {
      displayData.push(createQuarterRow(year, "Q4", [yearData[1], yearData[2], yearData[3]], categoryNames));
      if (yearData[3]) displayData.push({ ...yearData[3], Month: "Mar", isQuarter: false });
      if (yearData[2]) displayData.push({ ...yearData[2], Month: "Feb", isQuarter: false });
      if (yearData[1]) displayData.push({ ...yearData[1], Month: "Jan", isQuarter: false });
    }
  });

  return displayData;
};



export const createQuarterRow = (year, quarter, months, categoryNames) => {
  const quarterRow = {
    Year: year,
    Month: quarter,
    isQuarter: true,
  };

  categoryNames.forEach(category => {
    let totalSales = 0;
    let totalWeightedMargin = 0;
    
    months.forEach(month => {
      if (month) {
        const sales = month[`${category}_Sales`] || 0;
        const margin = month[`${category}_Margin`] || 0;
        
        totalSales += sales;
        totalWeightedMargin += sales * (margin / 100);
      }
    });

    quarterRow[`${category}_Sales`] = totalSales;
    quarterRow[`${category}_Margin`] = totalSales > 0 
      ? ((totalWeightedMargin / totalSales) * 100).toFixed(2)
      : 0;
  });

  return quarterRow;
};

export const calculateRowTotal = (row, categories) => {
  let totalSales = 0;
  let totalWeightedMargin = 0;

  categories.forEach(cat => {
    const sales = row[`${cat}_Sales`] || 0;
    const margin = row[`${cat}_Margin`] || 0;
    
    totalSales += sales;
    totalWeightedMargin += sales * (margin / 100);
  });

  const avgMargin = totalSales > 0
    ? ((totalWeightedMargin / totalSales) * 100).toFixed(2)
    : 0;

  return { totalSales, avgMargin };
};