// 

import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  const { catSizeMain } = req.query;

  console.log('BatchNum API called with catSizeMain:', catSizeMain);

  if (!catSizeMain || catSizeMain.trim() === "") {
    return res.status(400).json({ message: "Cat_size_main required" });
  }

  try {
    // Updated query to match your data structure and filter out NULLs
    const results = await queryDatabase(
      `
      SELECT DISTINCT 
        T6.[U_vendorbatchno] AS batchNum
      FROM [dbo].[OITM] T0
      LEFT JOIN [dbo].[OIBT] T6 ON T0.[ItemCode] = T6.[ItemCode]
      WHERE T0.[ItemCode] = @catSizeMain 
        AND T6.[U_vendorbatchno] IS NOT NULL 
        AND T6.[U_vendorbatchno] != ''
        AND LEN(RTRIM(LTRIM(T6.[U_vendorbatchno]))) > 0
      ORDER BY T6.[U_vendorbatchno]
      `,
      [{ name: "catSizeMain", type: sql.NVarChar, value: catSizeMain }]
    );

    console.log(`BatchNum API - catSizeMain: ${catSizeMain}, Results count: ${results.length}`);
    console.log('Raw results:', results);
    
    // Log the actual results for debugging
    if (results.length === 0) {
      console.log(`No batch numbers found for: ${catSizeMain}`);
      
      // Let's also check if the ItemCode exists at all
      const itemExists = await queryDatabase(
        `SELECT COUNT(*) as count FROM [dbo].[OITM] WHERE [ItemCode] = @catSizeMain`,
        [{ name: "catSizeMain", type: sql.NVarChar, value: catSizeMain }]
      );
      console.log(`Item exists check:`, itemExists);
    } else {
      console.log(`Found batch numbers:`, results.map(r => r.batchNum));
    }

    return res.status(200).json({ batchNums: results });
  } catch (err) {
    console.error("BatchNum API error:", err);
    return res.status(500).json({ message: "Failed to fetch batch numbers", error: err.message });
  }
}