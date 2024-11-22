

// import React from "react";
// import SortableTableHeader from "./SortableTableHeader";
// import { Table, Button } from "react-bootstrap";
// import { FaFileExcel } from "react-icons/fa"; // Excel icon from react-icons
// import downloadExcel from "utils/exporttoexcel";

// const GenericTable = ({
//   columns,
//   data,
//   onSort,
//   sortField,
//   sortDirection,
//   onExcelDownload,
// }) => (
//   <>
//     <Table striped hover responsive className="text-nowrap">
//       <thead>
//         <div
//           className="d-flex justify-content-end mb-3"
//           style={{  margin: "10" }}
//         >
//           <Button
//             variant="success"
//             size="sm"
//             onClick={onExcelDownload}
//             className="align-self-center"
//             style={{
//               padding: "5px 10px", // Adjust the button padding to make it more compact
//               fontSize: "14px", // Optional: Adjust the font size
//             }}
//           >
//             <FaFileExcel
//               style={{ fontSize: "18px", color: "green", margin: "0" }}
//             />{" "}
//             {/* Excel icon in green */}
//           </Button>
//         </div>
//         <tr>
//           {columns.map((col) => (
//             <SortableTableHeader
//               key={col.field}
//               label={col.label}
//               field={col.field}
//               sortField={sortField}
//               sortDirection={sortDirection}
//               onSort={onSort}
//             />
//           ))}
//         </tr>
//       </thead>
//       <tbody>
//         {data.map((row) => (
//           <tr key={row.id}>
//             {columns.map((col) => (
//               <td key={col.field}>
//                 {col.render ? col.render(row[col.field], row) : row[col.field]}
//               </td>
//             ))}
//           </tr>
//         ))}
//       </tbody>
//     </Table>
//   </>
// );

// export default GenericTable;

import React from "react";
import SortableTableHeader from "./SortableTableHeader";
import { Table, Button } from "react-bootstrap";
import { FaFileExcel } from "react-icons/fa"; // Excel icon from react-icons

const GenericTable = ({
  columns,
  data,
  onSort,
  sortField,
  sortDirection,
  onExcelDownload,
}) => (
  <>
    <Table striped hover responsive className="text-nowrap">
      <thead>
        <tr>
          <th
            colSpan={columns.length}
            style={{ textAlign: "left", paddingRight: "10px" }}
          >
            <Button
              variant="success"
              size="sm"
              onClick={onExcelDownload}
              style={{
                padding: "6px", // Compact padding around the button
                fontSize: "12px", // Adjust icon size
                // borderRadius: "50%", // Round button
                border: "none", // Remove default button border
                backgroundColor: "#28a745", // Keep the button color green
                boxShadow: "none", // Remove shadow
              }}
            >
              <FaFileExcel
                style={{ fontSize: "20px", margin: "0", color: "white" }}
              />
            </Button>
          </th>
        </tr>
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
              <td key={col.field}>
                {col.render ? col.render(row[col.field], row) : row[col.field]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  </>
);

export default GenericTable;
