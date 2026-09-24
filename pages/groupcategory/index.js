// path: pages/groupcategory/index.js
import React, { useState } from 'react';

const HorizontalDropdownMenu = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const productCategories = [
    {
      Groupcode: 1,
      GroupName: "Chemical Science",
      items: [
        { ItmsGrpCod: 101, ItmsGrpNam: "3A Chemicals" },
        { ItmsGrpCod: 102, ItmsGrpNam: "Catalyst" },
        { ItmsGrpCod: 103, ItmsGrpNam: "Solvent" },
        { ItmsGrpCod: 104, ItmsGrpNam: "Polymer" },
        { ItmsGrpCod: 105, ItmsGrpNam: "Fine Chemicals" },
        { ItmsGrpCod: 106, ItmsGrpNam: "Reagent" },
        { ItmsGrpCod: 108, ItmsGrpNam: "Cylinders" },
        { ItmsGrpCod: 109, ItmsGrpNam: "Intermediates" },
        { ItmsGrpCod: 110, ItmsGrpNam: "API (Active Pharmaceutical Ingredient)" },
        { ItmsGrpCod: 111, ItmsGrpNam: "Stable Isotope Reagents" },
        { ItmsGrpCod: 112, ItmsGrpNam: "Building Blocks" },
        { ItmsGrpCod: 144, ItmsGrpNam: "Dyes" },
        { ItmsGrpCod: 142, ItmsGrpNam: "Ultrapur" },
        { ItmsGrpCod: 149, ItmsGrpNam: "Ultrapur-100" },
        { ItmsGrpCod: 124, ItmsGrpNam: "Nitrosamine" },
        { ItmsGrpCod: 127, ItmsGrpNam: "Packaging Materials" },
        { ItmsGrpCod: 146, ItmsGrpNam: "Food Grade" },
        { ItmsGrpCod: 155, ItmsGrpNam: "High Purity Acids" },
        { ItmsGrpCod: 154, ItmsGrpNam: "Metal Standard Solutions" },
        { ItmsGrpCod: 156, ItmsGrpNam: "HPLC Consumables" },
        { ItmsGrpCod: 157, ItmsGrpNam: "HPLC Configurations" }
      ]
    },
    {
      Groupcode: 2,
      GroupName: "Life Science",
      items: [
        { ItmsGrpCod: 116, ItmsGrpNam: "Enzyme" },
        { ItmsGrpCod: 117, ItmsGrpNam: "Biochemicals" },
        { ItmsGrpCod: 107, ItmsGrpNam: "Biological Buffers" },
        { ItmsGrpCod: 123, ItmsGrpNam: "Nucleosides and Nucleotides" },
        { ItmsGrpCod: 148, ItmsGrpNam: "Peptides" },
        { ItmsGrpCod: 150, ItmsGrpNam: "Amino Acids" },
        { ItmsGrpCod: 151, ItmsGrpNam: "Cell Culture" },
        { ItmsGrpCod: 152, ItmsGrpNam: "Natural Products" },
        { ItmsGrpCod: 136, ItmsGrpNam: "Glucuronides" },
        { ItmsGrpCod: 137, ItmsGrpNam: "Metabolites" },
        { ItmsGrpCod: 128, ItmsGrpNam: "Carbohydrates" },
        { ItmsGrpCod: 145, ItmsGrpNam: "New Life Biologics" }
      ]
    },
    {
      Groupcode: 3,
      GroupName: "Analytical Reagents / Analytical Science",
      items: [
        { ItmsGrpCod: 118, ItmsGrpNam: "Reference Materials" },
        { ItmsGrpCod: 119, ItmsGrpNam: "Secondary Standards" },
        { ItmsGrpCod: 122, ItmsGrpNam: "Analytical Standards" },
        { ItmsGrpCod: 125, ItmsGrpNam: "Pesticide Standards" },
        { ItmsGrpCod: 129, ItmsGrpNam: "USP Standards" },
        { ItmsGrpCod: 130, ItmsGrpNam: "EP Standards" },
        { ItmsGrpCod: 131, ItmsGrpNam: "Indian Pharmacopoeia" },
        { ItmsGrpCod: 132, ItmsGrpNam: "British Pharmacopoeia" },
        { ItmsGrpCod: 153, ItmsGrpNam: "Multiple Pharmacopoeia" },
        { ItmsGrpCod: 133, ItmsGrpNam: "Impurity" },
        { ItmsGrpCod: 134, ItmsGrpNam: "NMR Solvents" },
        { ItmsGrpCod: 135, ItmsGrpNam: "Stable Isotopes" }
      ]
    },
    {
      Groupcode: 4,
      GroupName: "Lab Systems & Fixtures / Laboratory Supplies",
      items: [
        { ItmsGrpCod: 115, ItmsGrpNam: "Laboratory Containers & Storage" },
        { ItmsGrpCod: 114, ItmsGrpNam: "Cans" },
        { ItmsGrpCod: 140, ItmsGrpNam: "Lab Consumables" },
        { ItmsGrpCod: 120, ItmsGrpNam: "Instruments" },
        { ItmsGrpCod: 139, ItmsGrpNam: "Analytical Instruments" },
        { ItmsGrpCod: 141, ItmsGrpNam: "Equipment and Instruments" },
        { ItmsGrpCod: 147, ItmsGrpNam: "Lab Systems & Fixtures" }
      ]
    },
    {
      Groupcode: 5,
      GroupName: "Assets / Services / Trading",
      items: [
        { ItmsGrpCod: 143, ItmsGrpNam: "Assets" },
        { ItmsGrpCod: 121, ItmsGrpNam: "Services" },
        { ItmsGrpCod: 126, ItmsGrpNam: "Trading" },
        { ItmsGrpCod: 138, ItmsGrpNam: "Capricorn" }
      ]
    }
  ];

  const handleMouseEnter = (groupCode) => {
    setActiveDropdown(groupCode);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  const handleItemClick = (item) => {
    console.log('Selected item:', item);
    // You can add your item selection logic here
  };

  // Inline styles to avoid conflicts with other pages
  const containerStyle = {
    minHeight: '400px',
    padding: '16px',
    backgroundColor: '#f4f4f4',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '24px',
    minHeight: '400px'
  };

  const navStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '8px'
  };

  const buttonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s'
  };

  const buttonHoverStyle = {
    backgroundColor: '#0056b3'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: '0',
    minWidth: '250px',
    maxWidth: '300px',
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 1000,
    marginTop: '4px'
  };

  const dropdownItemStyle = {
    padding: '8px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const dropdownItemHoverStyle = {
    backgroundColor: '#f8f9fa',
    color: '#007bff'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
      
        
        <nav style={navStyle}>
          {productCategories.map((category) => (
            <div
              key={category.Groupcode}
              style={{ position: 'relative' }}
              onMouseEnter={() => handleMouseEnter(category.Groupcode)}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                style={buttonStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.target.style, buttonHoverStyle);
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#007bff';
                }}
              >
                {category.GroupName}
                <span style={{ fontSize: '10px' }}>▼</span>
              </button>
              
              {activeDropdown === category.Groupcode && (
                <div style={dropdownStyle}>
                  {category.items.map((item, index) => (
                    <div
                      key={item.ItmsGrpCod}
                      style={{
                        ...dropdownItemStyle,
                        borderBottom: index !== category.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={(e) => {
                        Object.assign(e.target.style, dropdownItemHoverStyle);
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#333';
                      }}
                    >
                      {item.ItmsGrpNam}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default HorizontalDropdownMenu;