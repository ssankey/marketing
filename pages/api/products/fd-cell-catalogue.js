// pages/api/products/fd-cell-catalogue.js
import { getFdCellCatalogueData } from "../../../lib/models/products";

// Fixed, known list of Cat Nos for the FD Cell Catalogue. Unlike the main Products
// list, this page is driven by this literal list, not a live search/filter against
// the full OITM table — so a code that doesn't exist in SAP still shows up in the
// table (flagged "Not Found") instead of silently vanishing.
const FD_CELL_CATALOGUE_ITEM_CODES = [
  "C000025-10Pc", "C001025-10Pc", "C000075-5Pc", "C001075-5Pc", "C000175-5Pc",
  "C001175-5Pc", "C000225-5Pc", "C001225-5Pc", "C002025-10Pc", "C003025-10Pc",
  "C002075-5Pc", "C005075-5Pc", "C002175-5Pc", "C003175-5Pc", "C002225-5Pc",
  "C003225-5Pc",
  "C011001-1Pc", "C011002-1Pc", "C011005-1Pc", "C011010-1Pc", "C011040-1Pc",
  "C010001-1Pc", "C010002-1Pc", "C010005-1Pc", "C010010-1Pc", "C010040-1Pc",
  "C020002-2Pc", "C020005-1Pc", "C022002-2Pc", "C022005-1Pc",
  "C023002-2Pc",
  "C091010-1Pc", "C096010-1Pc", "C097010-1Pc",
  "C030125-1Pc", "C0302501Pc", "C030500-1Pc", "C030001-1Pc",
  "C031125-1Pc", "C031250-1Pc", "C031500-1Pc", "C031001-1Pc",
  "C032125-1Pc", "C032250-1Pc", "C032500-1Pc", "C032001-1Pc",
  "C033125-1Pc", "C033250-1Pc", "C033500-1Pc", "C033001-1Pc",
  "C034125-1Pc", "C034250-1Pc", "C034500-1Pc", "C034001-1Pc",
  "C035125-1Pc", "C035250-1Pc", "C035500-1Pc", "C035001-1Pc",
  "C043003-1pc", "C043005-1Pc", "C044003-1Pc", "C043005-1Pc",
  "C084125-24Pc", "C084250-56Pc", "C084500-40Pc", "C084010-20Pc",
  "C080030-40Pc", "C080060-24Pc", "C080125-24Pc", "C080250-30Pc", "C080500-24Pc", "C080010-12Pc",
  "C060096-1Pc", "C060048-1Pc", "C060024-1pc", "C060012-1Pc", "C060006-1Pc",
  "C0610961Pc", "C061048-1Pc", "C061024-1Pc", "C061012-1Pc", "C061006-1Pc",
  "C063006-1Pc", "C063012-1Pc", "C063024-1Pc", "C063048-1Pc", "C063096-1Pc", "C064096-1Pc",
  "C050962-10Pc",
  "C073035-10Pc", "C073036-10Pc",
  "C070060-10Pc", "C070100-10Pc", "C070150-5Pc",
  "C071060-10Pc", "C071100-10Pc", "C071150-5pc",
  "L031052-25Pc",
  "L030050-25pc", "L030015-25Pc", "L030010-25Pc", "L030002-500pc",
  "L031002-500Pc", "L030001.5-500Pc", "L031001.5-500Pc",
  "L010001-50Pc", "L010002-50Pc", "L010005-50pc", "L010010-50Pc", "L010025-25pc", "L010050-20pc",
  "L011001-50Pc", "L011002-50Pc", "L011005-50Pc", "L011010-50Pc", "L011025-25Pc", "L011050-20Pc", "L011100-20Pc",
  "L223025-1Pc", "L223050-1Pc", "L223100-1Pc",
  "L243025-1Pc", "L243050-1pc", "L243100-1Pc",
  "L211025-1Pc", "L211050-1Pc", "L211100-1Pc",
  "L221025-1Pc", "L221050-1pc", "L221100-1Pc",
  "L2410251Pc", "L241050-1Pc", "L241100-1Pc",
  "D050001-96Pc", "D051001-960 Pc", "D052002-48Pc", "D053002-960Pc",
  "D050002-50Pc", "D051002-50pc", "D050004-50Pc", "D050005-50pc",
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const items = await getFdCellCatalogueData(FD_CELL_CATALOGUE_ITEM_CODES);
    res.status(200).json({ items, requestedCount: FD_CELL_CATALOGUE_ITEM_CODES.length });
  } catch (error) {
    console.error("Error fetching FD Cell Catalogue:", error);
    res.status(500).json({ message: "Failed to fetch FD Cell Catalogue data", error: error.message });
  }
}
