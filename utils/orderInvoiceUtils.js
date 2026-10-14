// utils/orderInvoiceUtils.js
// Calculate days between SO_Date and Invoice_Date
export const calculateDaysDifference = (soDate, invoiceDate) => {
  if (!soDate || !invoiceDate || invoiceDate === 'N/A') return null;
  
  const so = new Date(soDate);
  const invoice = new Date(invoiceDate);
  const diffTime = invoice - so;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : null;
};

// Get range category for given days
export const getRangeCategory = (days, dayRanges) => {
  if (days === null || days < 0) return null;
  
  for (let range of dayRanges) {
    if (days >= range.min && days <= range.max) {
      return range;
    }
  }
  return dayRanges[dayRanges.length - 1]; // Last range (>X Days)
};

// Generate day ranges based on customRanges
export const generateDayRanges = (ranges) => {
  return ranges.map((range, index) => ({
    label: range.max === null ? `${range.min}+ Days` : `${range.min}–${range.max} Days`,
    min: range.min,
    max: range.max === null ? Infinity : range.max,
    color: range.color,
    bgColor: range.bgColor
  }));
};

// Default ranges configuration
export const DEFAULT_RANGES = [
  { id: 1, min: 0, max: 3, color: '#28a745', bgColor: 'rgba(40, 167, 69, 0.7)' },
  { id: 2, min: 4, max: 5, color: '#fd7e14', bgColor: 'rgba(253, 126, 20, 0.7)' },
  { id: 3, min: 6, max: 8, color: '#007bff', bgColor: 'rgba(0, 123, 255, 0.7)' },
  { id: 4, min: 9, max: 10, color: '#6f42c1', bgColor: 'rgba(111, 66, 193, 0.7)' },
  { id: 5, min: 10, max: null, color: '#dc3545', bgColor: 'rgba(220, 53, 69, 0.7)' }
];

// Process order to invoice data
export const processOrderToInvoiceData = (data, filters, dayRanges, applyFilters) => {
  // Apply filters
  const filteredData = applyFilters(data, filters);

  // Only include records that have both SO_Date and Invoice_Date
  const validRecords = filteredData.filter(record => 
    record.SO_Date && 
    record.Invoice_Date && 
    record.Invoice_Date !== 'N/A'
  );

  // Calculate days for each record and add range info
  const recordsWithDays = validRecords.map(record => {
    const days = calculateDaysDifference(record.SO_Date, record.Invoice_Date);
    const rangeCategory = getRangeCategory(days, dayRanges);
    
    return {
      ...record,
      daysDifference: days,
      rangeCategory: rangeCategory
    };
  }).filter(record => record.rangeCategory !== null);

  // Group by month and range
  const monthlyData = {};
  const summaryData = {};

  recordsWithDays.forEach(record => {
    const monthKey = `${record.Month}-${record.Year}`;
    const rangeLabel = record.rangeCategory.label;

    // Initialize month data if it doesn't exist
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        monthName: record.Month,
        year: record.Year,
        monthNumber: record.MonthNumber,
        ranges: {}
      };
      
      // Initialize all ranges for this month using current dayRanges
      dayRanges.forEach(range => {
        monthlyData[monthKey].ranges[range.label] = {
          count: 0,
          records: [],
          color: range.color,
          bgColor: range.bgColor
        };
      });
    }

    // Initialize summary data if it doesn't exist
    if (!summaryData[monthKey]) {
      summaryData[monthKey] = {};
      dayRanges.forEach(range => {
        summaryData[monthKey][range.label] = 0;
      });
    }

    // Check if the range exists in monthlyData
    if (!monthlyData[monthKey].ranges[rangeLabel]) {
      monthlyData[monthKey].ranges[rangeLabel] = {
        count: 0,
        records: [],
        color: record.rangeCategory.color,
        bgColor: record.rangeCategory.bgColor
      };
    }

    // Add record to the range
    monthlyData[monthKey].ranges[rangeLabel].count++;
    monthlyData[monthKey].ranges[rangeLabel].records.push(record);
    
    // Initialize summary data for this range if it doesn't exist
    if (!summaryData[monthKey][rangeLabel]) {
      summaryData[monthKey][rangeLabel] = 0;
    }
    summaryData[monthKey][rangeLabel]++;
  });

  // Ensure all months have all ranges initialized (even with 0 counts)
  Object.keys(monthlyData).forEach(monthKey => {
    dayRanges.forEach(range => {
      if (!monthlyData[monthKey].ranges[range.label]) {
        monthlyData[monthKey].ranges[range.label] = {
          count: 0,
          records: [],
          color: range.color,
          bgColor: range.bgColor
        };
      }
      if (!summaryData[monthKey][range.label]) {
        summaryData[monthKey][range.label] = 0;
      }
    });
  });

  // Convert to array and sort by year/month
  const chartData = Object.values(monthlyData).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNumber - b.monthNumber;
  });

  return { chartData, summaryData };
};

// Create chart data for Chart.js
export const createChartData = (processedChartData, dayRanges) => {
  if (!processedChartData.length || !dayRanges.length) {
    return {
      labels: [],
      datasets: []
    };
  }

  return {
    labels: processedChartData.map(item => `${item.monthName}-${item.year}`),
    datasets: dayRanges.map(range => ({
      label: range.label,
      data: processedChartData.map(item => {
        // Safety check: ensure the range exists in the item
        return item.ranges && item.ranges[range.label] 
          ? item.ranges[range.label].count 
          : 0;
      }),
      backgroundColor: range.bgColor,
      borderColor: range.color,
      borderWidth: 1,
    }))
  };
};

// Create chart options for Chart.js
export const createChartOptions = (processedChartData, dayRanges, handleBarClick) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      display: false,
    },
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (context) => {
          const monthData = processedChartData[context[0].dataIndex];
          return `${monthData.monthName} ${monthData.year}`;
        },
        label: (context) => {
          const rangeLabel = context.dataset.label;
          const count = context.parsed.y;
          return `${rangeLabel}: ${count} orders`;
        }
      }
    }
  },
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const element = elements[0];
      const monthData = processedChartData[element.index];
      const rangeLabel = dayRanges[element.datasetIndex].label;
      handleBarClick(monthData, rangeLabel);
    }
  },
  onHover: (event, elements) => {
    const target = event.native?.target || event.target;
    if (target) {
      if (elements.length > 0) {
        target.style.cursor = 'pointer';
      } else {
        target.style.cursor = 'default';
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      stacked: false,
      title: {
        display: true,
        text: 'Number of Orders'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Month'
      }
    }
  }
});
