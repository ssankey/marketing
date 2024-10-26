// SortableTableHeader.js
const SortableTableHeader = ({ label, field, sortField, sortDirection, onSort }) => (
    <th onClick={() => onSort(field)} className="cursor-pointer">
      {label}{sortField === field && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
    </th>
  );
  
  export default SortableTableHeader;
  