// GenericTable.js
import React from 'react';
import SortableTableHeader from './SortableTableHeader';
import { Table } from 'react-bootstrap';

const GenericTable = ({ columns, data, onSort, sortField, sortDirection }) => (
  
  <>
  <Table striped hover responsive className="text-nowrap">
    <thead>
      <tr>
        {columns.map((col) => (
          <SortableTableHeader
            key={col.field}
            label={col.label}
            field={col.field}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id}>
          {columns.map((col) => (
            <td key={col.field}>{col.render ? col.render(row[col.field], row) : row[col.field]}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </Table>
  </>
);

export default GenericTable;
