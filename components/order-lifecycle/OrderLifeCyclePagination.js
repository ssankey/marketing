// components/order-lifecycle/OrderLifecyclePagination.js
import React from "react";
import { Button } from "react-bootstrap";

const OrderLifecyclePagination = ({
  currentPage,
  pageCount,
  filteredCount,
  onPageChange
}) => {
  const buttonStyle = {
    minWidth: '80px',
    height: '40px',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#475569'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    color: '#ffffff',
    border: '1px solid #1e293b',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(30, 41, 59, 0.15)'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    background: '#f8fafc',
    color: '#cbd5e1',
    cursor: 'not-allowed',
    border: '1px solid #f1f5f9'
  };

  return (
    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
      <div className="text-center text-md-start">
        <span 
          className="px-4 py-2 rounded-lg fw-medium"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            color: '#475569',
            fontSize: '0.875rem',
            border: '1px solid #e2e8f0'
          }}
        >
          Page {currentPage} of {pageCount} • {filteredCount} records
        </span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <Button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={currentPage === 1 ? disabledButtonStyle : buttonStyle}
          className="pagination-btn"
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.target.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              e.target.style.background = buttonStyle.background;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          <i className="bi bi-chevron-double-left me-1"></i>
          First
        </Button>

        <Button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={currentPage === 1 ? disabledButtonStyle : buttonStyle}
          className="pagination-btn"
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.target.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              e.target.style.background = buttonStyle.background;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          <i className="bi bi-chevron-left me-1"></i>
          Prev
        </Button>

        {renderPageNumbers(currentPage, pageCount, onPageChange, buttonStyle, activeButtonStyle)}

        <Button
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          disabled={currentPage === pageCount || pageCount === 0}
          style={currentPage === pageCount || pageCount === 0 ? disabledButtonStyle : buttonStyle}
          className="pagination-btn"
          onMouseEnter={(e) => {
            if (currentPage !== pageCount && pageCount !== 0) {
              e.target.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== pageCount && pageCount !== 0) {
              e.target.style.background = buttonStyle.background;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          Next
          <i className="bi bi-chevron-right ms-1"></i>
        </Button>

        <Button
          onClick={() => onPageChange(pageCount)}
          disabled={currentPage === pageCount || pageCount === 0}
          style={currentPage === pageCount || pageCount === 0 ? disabledButtonStyle : buttonStyle}
          className="pagination-btn"
          onMouseEnter={(e) => {
            if (currentPage !== pageCount && pageCount !== 0) {
              e.target.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== pageCount && pageCount !== 0) {
              e.target.style.background = buttonStyle.background;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          Last
          <i className="bi bi-chevron-double-right ms-1"></i>
        </Button>
      </div>
    </div>
  );
};

const renderPageNumbers = (currentPage, pageCount, onPageChange, buttonStyle, activeButtonStyle) => {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(pageCount, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <Button
        key={i}
        onClick={() => onPageChange(i)}
        style={i === currentPage ? activeButtonStyle : buttonStyle}
        className="pagination-btn"
        onMouseEnter={(e) => {
          if (i !== currentPage) {
            e.target.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (i !== currentPage) {
            e.target.style.background = buttonStyle.background;
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        {i}
      </Button>
    );
  }

  return pages;
};

export default OrderLifecyclePagination;