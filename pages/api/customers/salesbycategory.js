


// import { queryDatabase } from "../../../../lib/db";
// import sql from "mssql";

// export default async function handler(req, res) {
//   const { id, salesPersonCode, category } = req.query;

//   if (!id) {
//     return res.status(400).json({ error: "Customer code is required" });
//   }

//   try {
//     const query = `
//       SELECT 
//         FORMAT(T0.DocDate, 'MMM-yyyy') AS [Month],
//         T4.ItmsGrpNam AS Category,
//         SUM(T1.LineTotal) AS Sales
//       FROM OINV T0
//       INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//       INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
//       LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
//       LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
//       WHERE 
//         T0.CANCELED = 'N'
//         AND T0.CardCode = @customerCode
//         ${salesPersonCode ? "AND T0.SlpCode = @salesPersonCode" : ""}
//         ${category ? "AND T4.ItmsGrpNam = @category" : ""}
//       GROUP BY 
//         FORMAT(T0.DocDate, 'MMM-yyyy'),
//         T4.ItmsGrpNam
//       HAVING 
//         SUM(T1.LineTotal) > 0
//       ORDER BY 
//         MIN(T0.DocDate), T4.ItmsGrpNam;
//     `;

//     const params = [
//       { name: "customerCode", type: sql.NVarChar, value: id },
//     ];

//     if (salesPersonCode) {
//       params.push({
//         name: "salesPersonCode",
//         type: sql.Int,
//         value: parseInt(salesPersonCode, 10),
//       });
//     }

//     if (category) {
//       params.push({
//         name: "category",
//         type: sql.NVarChar,
//         value: category,
//       });
//     }

//     const rawData = await queryDatabase(query, params);

//     const formatted = rawData.map((row) => ({
//       month: row.Month,
//       category: row.Category,
//       sales: row.Sales,
//     }));

//     return res.status(200).json(formatted);
//   } catch (error) {
//     console.error("Error fetching monthly category sales:", error);
//     return res.status(500).json({
//       message: "Failed to fetch monthly category sales",
//       error: error.message,
//     });
//   }
// }


import { getSalesByCategory } from "lib/models/customers";

export default async function handler(req, res) {
  const { id, salesPerson } = req.query;

  console.log("API received request with parameters:", { id, salesPerson });

  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    // Pass salesPerson parameter directly without modification
    const data = await getSalesByCategory(id, salesPerson);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching sales by category:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}