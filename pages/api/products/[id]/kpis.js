// pages/api/products/[id]/kpis.js
import { getProductKPIs } from "../../../../lib/models/products";

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method === "GET") {
    try {
      const { kpiData, salesTrendData, topCustomersData, inventoryData } = await getProductKPIs(id);
      
      if (kpiData || salesTrendData || topCustomersData || inventoryData) {
        res.status(200).json({
          kpiData,
          salesTrendData,
          topCustomersData,
          inventoryData
        });
      } else {
        res.status(404).json({ message: "KPI data not found" });
      }
    } catch (error) {
      console.error("Error fetching KPI data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}