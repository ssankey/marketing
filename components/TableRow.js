// TableRow.js
import React from 'react';
import Link from 'next/link';
import StatusBadge from './StatusBadge';

const TableRow = ({ data, columns }) => {
  return (
    <tr className="text-sm">
      {columns.map((col) => {
        const value = data[col.field];
        
        return (
          <td key={col.field}>
            {col.render
              ? col.render(value, data)
              : value !== undefined
              ? value.toString()
              : 'N/A'}
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
