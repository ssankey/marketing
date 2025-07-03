
// components/Category/DailySalesModal.js
import React, { useState, useEffect } from "react";
import { Modal, Badge } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DailySalesModal = ({ 
  show, 
  onHide, 
  month, 
  year, 
  monthName,
  type, 
  filterValue,
  categoryFilter,
  rowData
}) => {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;

    const fetchDailyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let url = `/api/category/dailySales?type=${type}&month=${month}&year=${year}`;
        
        // Add filter based on type - use the correct field names
        if (filterValue) {
          if (type === 'category') {
            url += `&category=${encodeURIComponent(filterValue)}`;
          } else if (type === 'customer') {
            url += `&customer=${encodeURIComponent(filterValue)}`;
          } else if (type === 'salesperson') {
            url += `&salesperson=${encodeURIComponent(filterValue)}`;
          }
        }

        // Add category filter if present
        if (categoryFilter && type !== 'category') {
          url += `&category=${encodeURIComponent(categoryFilter)}`;
        }

        console.log('Fetching URL:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data && Array.isArray(data.dailyData)) {
          setDailyData(data.dailyData);
        } else {
          setDailyData([]);
        }
      } catch (error) {
        console.error("Error fetching daily data:", error);
        setError(error.message);
        setDailyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyData();
  }, [show, month, year, type, filterValue, categoryFilter]);

  // Generate all days for the month to ensure complete chart
  const generateAllDaysInMonth = () => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const allDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const existingDay = dailyData.find(d => d.date === dateStr);
      
      allDays.push({
        date: dateStr,
        // Use the same rounding logic as the API
        sales: existingDay ? Math.round(existingDay.sales || 0) : 0,
        lineItems: existingDay ? Math.round(existingDay.lineItems || 0) : 0
      });
    }
    
    return allDays;
  };

  const allDaysData = generateAllDaysInMonth();

  // Calculate totals from the processed allDaysData (same as chart data)
  const totalLineItems = allDaysData.reduce((sum, day) => sum + day.lineItems, 0);
  const totalSales = allDaysData.reduce((sum, day) => sum + day.sales, 0);

  // Prepare chart data with all days
  const chartData = {
    labels: allDaysData.map(day => day.date.split('-')[2] || ''),
    datasets: [
      {
        label: 'Daily Sales',
        data: allDaysData.map(day => day.sales), // Already rounded in generateAllDaysInMonth
        backgroundColor: '#1864AB',
        borderColor: '#1864AB',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        datalabels: { display: false },
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dayData = allDaysData[context.dataIndex];
            if (!dayData) return '';
            return [
              `Line items: ${formatNumberWithIndianCommas(dayData.lineItems)}`,
              `Sales: ₹${formatNumberWithIndianCommas(dayData.sales)}`
            ];
          },
          title: (context) => {
            return `${monthName} ${year} - Day ${context[0].label}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day of Month'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Sales (₹)'
        },
        ticks: {
          callback: (value) => `₹${formatNumberWithIndianCommas(Math.round(value))}`
        }
      }
    }
  };

  // Generate modal title based on type and filters
  const getModalTitle = () => {
    let title = `${monthName} ${year} Daily Breakdown`;
    
    if (type === 'customer') {
      title += ` - ${rowData?.['Customer Name'] || rowData?.Customer || filterValue}`;
    } else if (type === 'salesperson') {
      title += ` - ${rowData?.['Sales Person Name'] || rowData?.SalesPerson || filterValue}`;
    } else {
      title += ` - ${filterValue}`;
    }
    
    if (categoryFilter && type !== 'category') {
      title += ` (${categoryFilter})`;
    }
    
    return title;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading daily sales data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-5">
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
          <p>Please try again later or contact support if the problem persists.</p>
        </div>
      );
    }

    return (
      <>
      
        
        <div style={{ height: '550px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl"
      centered
      dialogClassName="modal-95w"
      style={{ maxWidth: 'none' }}
    >
      <Modal.Header closeButton className="bg-light border-bottom-0 pb-2">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <Modal.Title className="fs-5 fw-bold text-dark mb-2">
                {getModalTitle()}
              </Modal.Title>
              <div className="d-flex gap-3 align-items-center">
                <Badge 
                  bg="primary" 
                  className="px-3 py-2 fs-6 fw-normal"
                  style={{ fontSize: '0.875rem' }}
                >
                  <i className="fas fa-list me-2"></i>
                  Line Items: {formatNumberWithIndianCommas(totalLineItems)}
                </Badge>
                <Badge 
                  bg="success" 
                  className="px-3 py-2 fs-6 fw-normal"
                  style={{ fontSize: '0.875rem' }}
                >
                  <i className="fas fa-rupee-sign me-2"></i>
                  Sales: ₹{formatNumberWithIndianCommas(totalSales)}
                </Badge>
              </div>
            </div>
            {/* <button
              type="button"
              className="btn-close btn-close-white bg-secondary rounded-circle p-2 ms-3"
              aria-label="Close"
              onClick={onHide}
              style={{
                backgroundColor: '#6c757d',
                opacity: 0.8,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#5a6268';
                e.target.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#6c757d';
                e.target.style.opacity = '0.8';
              }}
            /> */}
          </div>
        </div>
      </Modal.Header>
      <Modal.Body style={{ minHeight: '600px', padding: '1.5rem' }}>
        {renderContent()}
      </Modal.Body>
    </Modal>
  );
};

export default DailySalesModal;