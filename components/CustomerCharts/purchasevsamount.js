

import React from "react";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "utils/formatCurrency";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from "chart.js";

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement
);

const PurchasesAmountChart = ({ data }) => {
  const colorPalette = {
    primary: "#0d6efd", // Blue for number of purchases
    secondary: "#198754", // Green for amount spent
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = {
    labels: months,
    datasets: [
      {
        label: "No. of Purchases",
        data: data.map((item) => item.noOfPurchase),
        backgroundColor: colorPalette.primary,
        borderColor: colorPalette.primary,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
        order: 1,
        yAxisID: "y1",
      },
      {
        label: "Sales",
        data: data.map((item) => item.AmountSpend),
        backgroundColor: "rgba(0, 0, 0, 0)",
        borderColor: colorPalette.secondary,
        borderWidth: 2,
        type: "line",
        fill: false,
        tension: 0.4,
        order: 0,
        yAxisID: "y2",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { family: "'Inter', sans-serif", size: 13 },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "#212529",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        padding: 12,
        callbacks: {
          label: (tooltipItem) => {
            if (tooltipItem.datasetIndex === 0) {
              return `${tooltipItem.dataset.label}: ${tooltipItem.raw} `;
            }
            // return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toFixed(2 )}`;
            return `${tooltipItem.dataset.label}: ${formatCurrency(
              tooltipItem.raw
            )}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      y1: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          callback: (value) => Math.round(value),
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      y2: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          callback: (value) => `₹${value.toFixed(2)}`,
          font: { family: "'Inter', sans-serif", size: 12 },
        },
        position: "right",
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h4 className="text-xl font-semibold text-gray-900">
          {/* No. of Purchases & Amount Spent by Customer - Monthly ({year}) */}
          No. of Purchases & Sales - Monthly
        </h4>
      </div>
      <div className="p-4 bg-gray-50">
        <div className="h-[450px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default PurchasesAmountChart;

// const PurchasesAmountChart = ({ data }) => {
//   const colorPalette = {
//     primary: "#0d6efd", // Blue for number of purchases
//     secondary: "#198754", // Green for amount spent
//   };

//   const months = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ];

//   // Filter out months where both noOfPurchase and AmountSpend are zero
//   const filteredData = data.filter(
//     (item) => item.noOfPurchase !== 0 || item.AmountSpend !== 0
//   );

//   // Get the labels (months) for the filtered data
//   const filteredMonths = filteredData.map((item, index) => months[index]);

//   const chartData = {
//     labels: filteredMonths,
//     datasets: [
//       {
//         label: "No. of Purchases",
//         data: filteredData.map((item) => item.noOfPurchase),
//         backgroundColor: colorPalette.primary,
//         borderColor: colorPalette.primary,
//         borderWidth: 1,
//         barPercentage: 1,
//         categoryPercentage: 0.7,
//         order: 1,
//         yAxisID: "y1",
//       },
//       {
//         label: "Sales",
//         data: filteredData.map((item) => item.AmountSpend),
//         backgroundColor: "rgba(0, 0, 0, 0)",
//         borderColor: colorPalette.secondary,
//         borderWidth: 2,
//         type: "line",
//         fill: false,
//         tension: 0.4,
//         order: 0,
//         yAxisID: "y2",
//       },
//     ],
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: "top",
//         labels: {
//           font: { family: "'Inter', sans-serif", size: 13 },
//           padding: 20,
//         },
//       },
//       tooltip: {
//         backgroundColor: "#212529",
//         titleFont: { size: 14, weight: "bold" },
//         bodyFont: { size: 13 },
//         padding: 12,
//         callbacks: {
//           label: (tooltipItem) => {
//             if (tooltipItem.datasetIndex === 0) {
//               return `${tooltipItem.dataset.label}: ${tooltipItem.raw} `;
//             }
//             return `${tooltipItem.dataset.label}: ${formatCurrency(
//               tooltipItem.raw
//             )}`;
//           },
//         },
//       },
//     },
//     scales: {
//       x: {
//         grid: { display: false },
//         ticks: {
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//       },
//       y1: {
//         beginAtZero: true,
//         grid: { color: "rgba(0, 0, 0, 0.05)" },
//         ticks: {
//           callback: (value) => Math.round(value),
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//       },
//       y2: {
//         beginAtZero: true,
//         grid: { color: "rgba(0, 0, 0, 0.05)" },
//         ticks: {
//           callback: (value) => `₹${value.toFixed(2)}`,
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//         position: "right",
//       },
//     },
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm">
//       <div className="p-4 border-b">
//         <h4 className="text-xl font-semibold text-gray-900">
//           No. of Purchases & Sales - Monthly
//         </h4>
//       </div>
//       <div className="p-4 bg-gray-50">
//         <div className="h-[450px]">
//           <Bar data={chartData} options={chartOptions} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PurchasesAmountChart;
