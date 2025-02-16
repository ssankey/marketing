


import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit; // Pagination offset

    try {
        // Query to match both ItemCode and ItemName
        const query = search
            ? `
                SELECT DISTINCT TOP ${limit} ItemCode, ItemName,
                    CASE 
                        WHEN ItemCode LIKE @SearchTerm THEN ItemCode
                        ELSE ItemName
                    END AS MatchedLabel
                FROM OITM 
                WHERE ItemName LIKE @SearchTerm OR ItemCode LIKE @SearchTerm 
                ORDER BY ItemCode ASC
              `
            : `SELECT DISTINCT TOP ${limit} ItemCode, ItemName FROM OITM ORDER BY ItemCode ASC`;

        const params = search
            ? [{ 
                name: "SearchTerm", 
                type: sql.NVarChar, 
                value: `%${search}%` 
            }]
            : [];

        const results = await queryDatabase(query, params);

        // Format response based on match type
        const products = results.map((row) => ({
            value: row.ItemCode,  // Always keep ItemCode as value
            label: row.MatchedLabel || row.ItemName, // Show ItemCode first if it matches
        }));

        res.status(200).json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

