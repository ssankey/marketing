

// pages/api/customers/[cardcode]/category-sales.js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

const categoryColorMap = {
  "3A Chemicals": "#4E79A7",
  "Amino Acids": "#F28E2B",
  "Analytical Instruments": "#E15759",
  "Analytical Standards": "#76B7B2",
  "API": "#59A14F",
  "Assets": "#EDC948",
  "Biochemicals": "#B07AA1",
  "Biological Buffers": "#FF9DA7",
  "British Pharmacopoeia": "#9C755F",
  "Building Blocks": "#BAB0AC",
  "Cans": "#17BECF",
  "Capricorn": "#BCBD22",
  "Carbohydrates": "#393B79",
  "Catalyst": "#5254A3",
  "Cell Culture": "#6B6ECF",
  "Cylinders": "#9C9EDE",
  "Dyes": "#637939",
  "Enzyme": "#8CA252",
  "EP Standards": "#B5CF6B",
  "Equipment and Instruments": "#CEDB9C",
  "Fine Chemicals": "#8C6D31",
  "Food Grade": "#BD9E39",
  "Glucuronides": "#E7BA52",
  "High Purity Acids": "#843C39",
  "Impurity": "#AD494A",
  "Indian pharmacopoeia": "#D6616B",
  "Instruments": "#E7969C",
  "Intermediates": "#7B4173",
  "Items": "#A55194",
  "Lab Consumables": "#CE6DBD",
  "Lab Systems & Fixtures": "#DE9ED6",
  "Laboratory Containers & Storage": "#3182BD",
  "Membranes": "#6BAED6",
  "Metabolites": "#9ECAE1",
  "Metal Standard Solutions": "#E6550D",
  "Multiple Pharmacopoeia": "#FD8D3C",
  "Natural Products": "#FDAE6B",
  "New Life Biologics": "#FDD0A2",
  "Nitrosamine": "#31A354",
  "NMR Solvents": "#74C476",
  "Nucleosides and Nucleotides": "#A1D99B",
  "Packaging Materials": "#C7E9C0",
  "Peptides": "#756BB1",
  "Pesticide Standards": "#9E9AC8",
  "Polymer": "#BCBDDC",
  "Reagent": "#DADAEB",
  "Reference Materials": "#636363",
  "Secondary Standards": "#969696",
  "Services": "#BDBDBD",
  "Solvent": "#D9D9D9",
  "Stable Isotope reagents": "#8DD3C7",
  "Stable isotopes": "#FFFFB3",
  "Trading": "#BEBADA",
  "Ultrapur": "#FB8072",
  "Ultrapur-100": "#80B1D3",
  "USP Standards": "#FDB462"
};

export default async function handler(req, res) {
  const { id, salesPerson, category, contactPerson } = req.query;

  try {
    // First, get the ordered list of months with proper chronological sorting
    const monthOrderQuery = `
      SELECT DISTINCT 
        FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear,
        MIN(OINV.DocDate) AS MinDate
      FROM OINV
      WHERE OINV.CANCELED = 'N'
      AND OINV.CardCode = @cardCode
      ${salesPerson ? 'AND OINV.SlpCode = @salesPersonCode' : ''}
      ${contactPerson ? 'AND OINV.CntctCode = @contactPersonCode' : ''}
      GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
      ORDER BY MIN(OINV.DocDate)
    `;

    const monthParams = [
      {
        name: "cardCode",
        type: sql.NVarChar(20),
        value: id,
      }
    ];

    if (salesPerson) {
      monthParams.push({
        name: "salesPersonCode",
        type: sql.Int,
        value: parseInt(salesPerson, 10),
      });
    }

    if (contactPerson) {
      monthParams.push({
        name: "contactPersonCode",
        type: sql.NVarChar(20),
        value: contactPerson,
      });
    }

    const monthResult = await queryDatabase(monthOrderQuery, monthParams);

    // If no months found, return empty data structure
    if (!monthResult || monthResult.length === 0) {
      return res.status(200).json({
        labels: [],
        datasets: []
      });
    }

    // Extract ordered months
    const orderedMonths = monthResult.map(row => row.MonthYear);

    // Build the PIVOT columns string in the correct order
    const colsString = orderedMonths.map(month => `[${month}]`).join(',');

    const query = `
      WITH CategorySales AS (
          SELECT 
              T4.ItmsGrpNam AS Category,
              FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear,
              SUM(INV1.LineTotal) AS Amount
          FROM OINV
          INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
          INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
          INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
          WHERE OINV.CANCELED = 'N'
          AND OINV.CardCode = @cardCode
          ${salesPerson ? 'AND OINV.SlpCode = @salesPersonCode' : ''}
          ${category ? 'AND T4.ItmsGrpNam = @categoryName' : ''}
          ${contactPerson ? 'AND OINV.CntctCode = @contactPersonCode' : ''}
          GROUP BY T4.ItmsGrpNam, FORMAT(OINV.DocDate, 'MMM yyyy')
      )
      SELECT * FROM (
          SELECT Category, MonthYear, Amount FROM CategorySales
      ) AS SourceData
      PIVOT (
          SUM(Amount) FOR MonthYear IN (${colsString})
      ) AS PivotTable
      ORDER BY Category
    `;

    const params = [
      {
        name: "cardCode",
        type: sql.NVarChar(20),
        value: id,
      },
    ];

    if (salesPerson) {
      params.push({
        name: "salesPersonCode",
        type: sql.Int,
        value: parseInt(salesPerson, 10),
      });
    }

    if (category) {
      params.push({
        name: "categoryName",
        type: sql.NVarChar(100),
        value: category,
      });
    }

    if (contactPerson) {
      params.push({
        name: "contactPersonCode",
        type: sql.NVarChar(20),
        value: contactPerson,
      });
    }

    const result = await queryDatabase(query, params);

    // Handle case where no data is found
    if (!result || result.length === 0) {
      return res.status(200).json({
        labels: orderedMonths,
        datasets: []
      });
    }

    // Transform the data for charting
    const categories = result.map((row) => row.Category);
    const months = orderedMonths; // Use the pre-ordered months

    const datasets = categories.map((category) => {
      const categoryData = result.find((row) => row.Category === category);
      return {
        label: category,
        data: months.map((month) => categoryData[month] || 0),
        backgroundColor: getCategoryColor(category),
      };
    });

    res.status(200).json({
      labels: months,
      datasets,
    });
  } catch (error) {
    console.error("Error fetching category sales data:", error);
    res.status(500).json({ error: "Failed to fetch category sales data" });
  }
}


function getCategoryColor(category) {
  return categoryColorMap[category] || "#CCCCCC"; // Default gray for unknown categories
}