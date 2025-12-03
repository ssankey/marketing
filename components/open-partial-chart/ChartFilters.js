// components/open-partial-chart/OpenClosedOrdersChartArray.js
import React from 'react';
import Select from 'react-select';
import { customSelectStyles } from './ChartConfig';

const ChartFilters = ({ 
  filters, 
  getSelectOptions, 
  handleFilterChange, 
  clearAllFilters,
  activeFiltersCount 
}) => {
  return (
    <div className="filters-section">
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
          <div className="filter-group">
            <label className="form-label text-muted small fw-medium mb-1">Sales Person</label>
            <Select
              options={getSelectOptions('Sales_Person')}
              value={filters.salesPerson ? { value: filters.salesPerson, label: filters.salesPerson } : null}
              onChange={(selectedOption) => handleFilterChange('salesPerson', selectedOption)}
              placeholder="All Sales Person"
              isClearable
              isSearchable
              styles={customSelectStyles}
            />
          </div>
        </div>
        
        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
          <div className="filter-group">
            <label className="form-label text-muted small fw-medium mb-1">Contact Person</label>
            <Select
              options={getSelectOptions('Contact_Person')}
              value={filters.contactPerson ? { value: filters.contactPerson, label: filters.contactPerson } : null}
              onChange={(selectedOption) => handleFilterChange('contactPerson', selectedOption)}
              placeholder="All Contact Person"
              isClearable
              isSearchable
              styles={customSelectStyles}
            />
          </div>
        </div>
        
        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
          <div className="filter-group">
            <label className="form-label text-muted small fw-medium mb-1">Category</label>
            <Select
              options={getSelectOptions('Category')}
              value={filters.category ? { value: filters.category, label: filters.category } : null}
              onChange={(selectedOption) => handleFilterChange('category', selectedOption)}
              placeholder="All Category"
              isClearable
              isSearchable
              styles={customSelectStyles}
            />
          </div>
        </div>
        
        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
          <div className="filter-group">
            <label className="form-label text-muted small fw-medium mb-1">Product</label>
            <Select
              options={getSelectOptions('Item_No')}
              value={filters.product ? { value: filters.product, label: filters.product } : null}
              onChange={(selectedOption) => handleFilterChange('product', selectedOption)}
              placeholder="All Product"
              isClearable
              isSearchable
              styles={customSelectStyles}
            />
          </div>
        </div>
        
        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
          <div className="filter-group">
            <label className="form-label text-muted small fw-medium mb-1">Customer</label>
            <Select
              options={getSelectOptions('Customer')}
              value={filters.customer ? { value: filters.customer, label: filters.customer } : null}
              onChange={(selectedOption) => handleFilterChange('customer', selectedOption)}
              placeholder="All Customer"
              isClearable
              isSearchable
              styles={customSelectStyles}
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .filters-section {
          background: #f8f9fa;
          padding: 1.25rem;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }
        
        @media (max-width: 768px) {
          .filters-section {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ChartFilters;