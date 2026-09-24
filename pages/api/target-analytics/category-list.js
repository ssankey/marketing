
// pages/api/target-analytics/category-list.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const query = `
      SELECT DISTINCT ITMGRP.U_SubGroup1
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN OITM ITM ON T1.ItemCode = ITM.ItemCode
      LEFT JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
      WHERE ITMGRP.U_SubGroup1 IS NOT NULL AND ITMGRP.U_SubGroup1 <> ''
      ORDER BY ITMGRP.U_SubGroup1 ASC
    `;

    const results = await queryDatabase(query);
    
    const categoryList = results.map(row => row.U_SubGroup1);

    res.status(200).json({
      success: true,
      count: categoryList.length,
      data: categoryList
    });

  } catch (error) {
    console.error("Error fetching category list:", error);
    res.status(500).json({
      message: "Error fetching category list",
      error: error.message
    });
  }
}