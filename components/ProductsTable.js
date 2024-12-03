// components/ProductsTable.js

import React from "react";
import Link from "next/link";
import GenericTable from "./GenericTable";
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import downloadExcel from "utils/exporttoexcel";
import { useRouter } from "next/router";
import { Row, Col, Alert, Container } from "react-bootstrap";
import usePagination from "hooks/usePagination";
import useTableFilters from "hooks/useFilteredData";

export default function ProductsTable({
  products,
  totalItems,
  sortDir,
  isLoading,
  error, // New prop
}) {
  const ITEMS_PER_PAGE = 20; // Define items per page
  const { currentPage, totalPages, onPageChange } = usePagination(
    totalItems,
    ITEMS_PER_PAGE
  );





  const {
    searchTerm,
    sortField,
    handleSearch,
    handleSort,
  } = useTableFilters();



  // Define columns with sorting capabilities
  const columns = [
    {
      label: "CAT No.",
      field: "Cat_size_main", // Corresponds to T0.ItemCode AS Cat_size_main
      sortable: true,
      render: (value, row) => (
        <Link href={`/products/${row.Cat_size_main}`}>{value}</Link>
      ),
    },
    {
      label: "Item Name",
      field: "english", // Corresponds to T0.ItemName AS english
      sortable: true,
    },
    {
      label: "Category Name",
      field: "ItmsGrpNam", // Corresponds to T1.ItmsGrpNam
      sortable: true,
    },
    {
      label: "Category No.",
      field: "Cat_No", // Corresponds to T0.U_ALTCAT AS Cat_No
      sortable: true,
    },
    {
      label: "CAS No",
      field: "Cas", // Corresponds to T0.U_CasNo AS Cas
      sortable: false,
      render: (value) => value || "N/A",
    },
    {
      label: "Molecular Formula",
      field: "U_MolucularFormula",
      sortable: true,
    },
    {
      label: "Molecular Weight",
      field: "U_MolucularWeight",
      sortable: true,
    },
    {
      label: "MSDS",
      field: "U_MSDS",
      sortable: false,
      render: (value) =>
        value ? <a href={value} target="_blank" rel="noopener noreferrer">Download</a> : "N/A",
    },
    {
      label: "COA",
      field: "U_COA", // Corresponds to T5.U_COA
      sortable: false,
      render: (value) =>
        value ? <a href={value} target="_blank" rel="noopener noreferrer">Download</a> : "N/A",
    },
    {
      label: "Purity",
      field: "U_Purity",
      sortable: true,
    },
    {
      label: "SMILES",
      field: "U_Smiles",
      sortable: false,
      render: (value) => value || "N/A",
    },
    {
      label: "Website Display",
      field: "U_WebsiteDisplay",
      sortable: false,
      render: (value) => (value ? "Yes" : "No"),
    },
    // {
    //   label: "Category Update Timestamp",
    //   field: "U_CatUpdateTimeStamp",
    //   sortable: true,
    //   render: (value) => (value ? new Date(value).toLocaleString() : "N/A"),
    // },
    {
      label: "Melting Point",
      field: "U_MeltingPoint",
      sortable: true,
    },
    {
      label: "Boiling Point",
      field: "U_BoilingPoint",
      sortable: true,
    },
    {
      label: "Appearance",
      field: "U_Appearance",
      sortable: false,
      render: (value) => value || "N/A",
    },
    {
      label: "UN Number",
      field: "U_UNNumber",
      sortable: false,
      render: (value) => value || "N/A",
    },
    {
      label: "Stock In India",
      field: "Stock_In_India", // Corresponds to T2.OnHand AS Stock_In_India
      sortable: true,
    },
    {
      label: "Stock In China",
      field: "Stock_In_China", // Corresponds to T0.U_ChinaStock AS Stock_In_China
      sortable: true,
    },
    {
      label: "Quantity",
      field: "U_Quantity",
      sortable: true,
    },
    {
      label: "Unit of Measure",
      field: "U_UOM",
      sortable: true,
    },
    {
      label: "Price",
      field: "U_Price",
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      label: "Price (USD)",
      field: "U_PriceUSD",
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      label: "Item Type",
      field: "ItemType",
      sortable: true,
    },
    {
      label: "Valid For",
      field: "validFor",
      sortable: true,
      render: (value) => (value ? "Yes" : "No"),
    },
    {
      label: "Valid From",
      field: "validFrom",
      sortable: true,
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Valid To",
      field: "validTo",
      sortable: true,
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Created Date",
      field: "CreateDate",
      sortable: true,
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "Updated Date",
      field: "UpdateDate",
      sortable: true,
      render: (value) => (value ? value.split("T")[0] : "N/A"),
    },
    {
      label: "IUPAC Name",
      field: "U_IUPACName",
      sortable: false,
      render: (value) => value || "N/A",
    },
    {
      label: "Synonyms",
      field: "U_Synonyms",
      sortable: false,
      render: (value) => value || "N/A",
    },
    {
      label: "Applications",
      field: "U_Applications",
      sortable: false,
      render: (value) => value || "N/A",
    },
    {
      label: "Structure",
      field: "U_Structure",
      sortable: false,
      render: (value) => value || "N/A",
    },
    {
      label: "Actions",
      field: "actions",
      sortable: false,
      render: (value, row) => (
        <Link href={`/products/${row.Cat_size_main}`}>View Details</Link>
      ),
    },
  ];
  

  // Handle Excel download
  const handleExcelDownload = () => {
    downloadExcel(products, "Products");
  };

  return (
    <Container fluid>
      <>
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
        <TableFilters
          searchConfig={{
            enabled: true,
            placeholder: "Search products...",
            fields: ["ItemCode", "ItemName", "ItemType", "U_CasNo"],
          }}
          dateFilter={{ enabled: false }}
          onSearch={handleSearch}
          searchTerm={searchTerm}
          totalItems={totalItems}
          totalItemsLabel="Total Products"
        />
        <GenericTable
          columns={columns}
          data={products} // Use server-side paginated data directly
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDir}
          onExcelDownload={handleExcelDownload}
          isLoading={isLoading}
        />
        {products.length === 0 && !isLoading && !error && (
          <div className="text-center py-4">No products found.</div>
        )}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />

        {/* Display current page and total pages */}
        <Row className="mb-2">
          <Col className="text-center">
            <h5>
              Page {currentPage} of {totalPages}
            </h5>
          </Col>
        </Row>
      </>
    </Container>
  );
}
