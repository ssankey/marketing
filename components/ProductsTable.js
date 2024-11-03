// ProductsTable.js
import { useState } from "react";
import Link from "next/link";
import GenericTable from "./GenericTable";

export default function ProductsTable({ products, totalItems, isLoading }) {
  const [sortField, setSortField] = useState("ItemCode");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    // Toggle sort direction if the same field is clicked
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }

    // Trigger data fetching with new sort parameters if needed
    // You might need to update your data fetching logic here
  };

  const columns = [
    {
      label: "CAT No.",
      field: "ItemCode",
      render: (value, row) => (
        <Link href={`/products/${row.ItemCode}`}>
          {value}
        </Link>
      ),
    },
    { label: "Item Name", field: "ItemName" },
    { label: "Item Type", field: "ItemType" },
    { label: "CAS No", field: "U_CasNo", render: (value) => value || "N/A" },
    {
      label: "Created Date",
      field: "CreateDate",
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Updated Date",
      field: "UpdateDate",
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Actions",
      field: "actions",
      render: (value, row) => (
        <Link href={`/products/${row.ItemCode}`}>
          View Details
        </Link>
      ),
    },
  ];

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  return (
    <>
      <GenericTable
        columns={columns}
        data={products}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
      />
      {/* Pagination component can be added here */}
    </>
  );
}
