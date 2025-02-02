// // pages/api/getAllProduct.js
// import { getAllProducts } from "lib/models/excel-function";

// export default async function handler(req, res) {
//   try {
//     const data = await getAllProducts();
//     res.status(200).json(data);
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     res.status(500).json({ error: "Failed to fetch products." });
//   }
// }


import { getAllProducts } from "lib/models/excel-function";

export default async function handler(req, res) {
  const {
    status = "all",
    search = "",
    sortField = "ItemCode",
    category = "",
    sortDir = "asc",
  } = req.query; // Extract filters from the query parameters

  try {
    const data = await getAllProducts({
      status,
      search,
      category,
      sortField,
      sortDir,
      
    }); // Pass filters to the model
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products." });
  }
}
