// components/open-partial-chart/ChartConfig.js
import { formatCurrency } from "utils/formatCurrency";

export const monthMapping = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

export const formatMonthYear = (year, month) => {
  const monthIndex = monthMapping[month];
  if (monthIndex === undefined) return "Invalid Date";
  const date = new Date(year, monthIndex);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

export const colorPalette = {
  open: "#0d6efd",
  partial: "#ffc107",
};

export const createChartData = (processedData) => {
  const labels = processedData.map((d) => formatMonthYear(d.year, d.month));

  return {
    labels,
    datasets: [
      {
        label: "Open Orders",
        data: processedData.map((d) => d.openOrders || 0),
        backgroundColor: colorPalette.open,
        borderColor: colorPalette.open,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
      {
        label: "Partial Orders",
        data: processedData.map((d) => d.partialOrders || 0),
        backgroundColor: colorPalette.partial,
        borderColor: colorPalette.partial,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
    ],
  };
};

export const createChartOptions = (processedData, handleBarClick) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#212529",
        bodyFont: {
          size: 14,
          weight: 'bold'
        },
        titleFont: {
          size: 16,
          weight: 'bold'
        },
        padding: 16,
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label;
            const dataIndex = context.dataIndex;
            const dataPoint = processedData[dataIndex];

            if (datasetLabel === "Open Orders") {
              return [
                `Open Orders: ${dataPoint.openOrders}`,
                `Line Items: ${dataPoint.openLineItems}`,
                `Value: ${formatCurrency(dataPoint.openValue)}`
              ];
            } else if (datasetLabel === "Partial Orders") {
              return [
                `Partial Orders: ${dataPoint.partialOrders}`,
                `Line Items: ${dataPoint.partialLineItems}`,
                `Value: ${formatCurrency(dataPoint.partialValue)}`
              ];
            }
            return `${datasetLabel}: ${context.raw}`;
          },
        },
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        const datasetIndex = element.datasetIndex;
        const { year, month } = processedData[dataIndex];
        const status = datasetIndex === 0 ? "open" : "partial";
        handleBarClick(year, month, status);
      }
    },
    onHover: (event, chartElement) => {
      const target = event.native?.target || event.target;
      if (target && chartElement.length) {
        target.style.cursor = 'pointer';
      } else if (target) {
        target.style.cursor = 'default';
      }
    },
  };
};

export const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    fontSize: "0.875rem",
    minHeight: "32px",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#b0b0b0",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",
    padding: "8px 12px",
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
  }),
};