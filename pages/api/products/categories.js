import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const query = `SELECT DISTINCT ItmsGrpNam FROM OITB ORDER BY ItmsGrpNam ASC`;
    const results = await queryDatabase(query);
    const categories = results.map((row) => row.ItmsGrpNam);
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}
