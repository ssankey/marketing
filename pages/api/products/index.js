
  // // pages/api/products/index.js
  // import { getProductsFromDatabase } from "../../../lib/models/products";




  // export default async function handler(req, res) {
  //   if (req.method === "GET") {
  //     const {
  //       page = 1,
  //       search = "",
  //       sortField = "ItemCode",
  //       sortDir = "asc",
  //       status = "all",
  //     } = req.query;

  //     const ITEMS_PER_PAGE = 20; // Keep it consistent
  //     const pageNumber = parseInt(page, 10);
  //     const validPageNumber =
  //       Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  //     const offset = (validPageNumber - 1) * ITEMS_PER_PAGE;

  //     try {
  //       const productsData = await getProductsFromDatabase({
  //         search,
  //         sortField,
  //         sortDir,
  //         offset,
  //         ITEMS_PER_PAGE,
  //         status,
  //       });

  //       res.status(200).json(productsData);
  //     } catch (error) {
  //       console.error("Error fetching products:", error);
  //       res.status(500).json({ message: "Error fetching products" });
  //     }
  //   } else {
  //     res.status(405).json({ message: "Method Not Allowed" });
  //   }
  // }


  
  // pages/api/products/index.js
  

  // pages/api/products/index.js
import { getProductsFromDatabase } from "../../../lib/models/products";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const {
      page = 1,
      search = "",
      sortField = "ItemCode",
      sortDir = "asc",
      status = "all",
      category = "", // <-- ADD THIS
      getAll = false,
    } = req.query;

    const ITEMS_PER_PAGE = 20;
    const pageNumber = parseInt(page, 10);
    const validPageNumber =
      Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
    const offset = (validPageNumber - 1) * ITEMS_PER_PAGE;

    try {
      const productsData = await getProductsFromDatabase({
        search,
        category, // <-- PASS category here
        sortField,
        sortDir,
        offset,
        ITEMS_PER_PAGE,
        status,
        getAll ,
      });

      res.status(200).json(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
