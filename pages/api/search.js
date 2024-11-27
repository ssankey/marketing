import { queryDatabase } from '../../lib/db'; // Adjust the import path
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query: searchTerm } = req.query;

    // Handle empty query parameter
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
      // Prepare the search term with wildcards
      const searchPattern = `%${searchTerm}%`;

      // Define the parameters once
      const params = [{ name: 'search', type: sql.VarChar, value: searchPattern }];

      // Combine queries from multiple tables using UNION ALL
      const combinedQuery = `
        SELECT TOP 5 'Customer' AS type, CardName AS name, CAST(CardCode AS VARCHAR(50)) AS id
        FROM OCRD
        WHERE CardName LIKE @search

        UNION ALL

        SELECT TOP 5 'Product' AS type, ItemName AS name, CAST(ItemCode AS VARCHAR(50)) AS id
        FROM OITM
        WHERE ItemName LIKE @search

        UNION ALL

        SELECT TOP 5 'Order' AS type, CAST(DocNum AS VARCHAR(50)) AS name, CAST(DocEntry AS VARCHAR(50)) AS id
        FROM ORDR
        WHERE CAST(DocNum AS VARCHAR(50)) LIKE @search

        UNION ALL

        SELECT TOP 5 'Quotation' AS type, CAST(DocNum AS VARCHAR(50)) AS name, CAST(DocEntry AS VARCHAR(50)) AS id
        FROM OQUT
        WHERE CAST(DocNum AS VARCHAR(50)) LIKE @search

        UNION ALL

        SELECT TOP 5 'Invoice' AS type, CAST(DocNum AS VARCHAR(50)) AS name, CAST(DocEntry AS VARCHAR(50)) AS id
        FROM OINV
        WHERE CAST(DocNum AS VARCHAR(50)) LIKE @search

        UNION ALL

        SELECT TOP 5 'Employee' AS type, SlpName AS name, CAST(SlpCode AS VARCHAR(50)) AS id
        FROM OSLP
        WHERE SlpName LIKE @search

        UNION ALL

        SELECT TOP 5 'Category' AS type, ItmsGrpNam AS name, CAST(ItmsGrpCod AS VARCHAR(50)) AS id
        FROM OITB
        WHERE ItmsGrpNam LIKE @search
      `;

      // Execute the combined query
      const results = await queryDatabase(combinedQuery, params);

      // Format the results
      const suggestions = results.map((item) => ({
        type: item.type,
        name: item.name,
        id: item.id,
      }));

      // Send the suggestions as response
      res.status(200).json(suggestions);
    } catch (error) {
      console.error('Database error:', error); // Log the actual error
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}