// src/components/FilterDropdown.js
import React from "react";
import { Dropdown, ButtonGroup } from "react-bootstrap";
import { Calendar3 } from "react-bootstrap-icons";

const FilterDropdown = ({ currentFilter, setFilter, title }) => {
  const renderLabel = () => {
    switch (currentFilter) {
      case "today":
        return "Today";
      case "thisWeek":
        return "This Week";
      case "thisMonth":
        return "This Month";
      case "allTime":
        return "All Time";
      default:
        return "Filter";
    }
  };

  return (
    <Dropdown as={ButtonGroup}>
      <Dropdown.Toggle
        variant="outline-secondary"
        className="d-flex align-items-center gap-2"
      >
        <Calendar3 size={16} />
        <span className="text-capitalize">{renderLabel()}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {["today", "thisWeek", "thisMonth", "allTime"].map((option) => (
          <Dropdown.Item
            key={option}
            active={currentFilter === option}
            onClick={() => setFilter(option)}
            className="text-capitalize"
          >
            {option === "allTime"
              ? "All Time"
              : option === "thisWeek"
              ? "This Week"
              : option === "thisMonth"
              ? "This Month"
              : "Today"}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default FilterDropdown;
