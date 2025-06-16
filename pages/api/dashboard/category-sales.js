


    // // pages/api/dashboard/category-sales.js
    // import { queryDatabase } from "../../../lib/db";
    // import sql from "mssql";

    // const categoryColorMap = {
    // "3A Chemicals": "#4E79A7",
    // "Amino Acids": "#F28E2B",
    // "Analytical Instruments": "#E15759",
    // "Analytical Standards": "#76B7B2",
    // "API": "#59A14F",
    // "Assets": "#EDC948",
    // "Biochemicals": "#B07AA1",
    // "Biological Buffers": "#FF9DA7",
    // "British Pharmacopoeia": "#9C755F",
    // "Building Blocks": "#BAB0AC",
    // "Cans": "#17BECF",
    // "Capricorn": "#BCBD22",
    // "Carbohydrates": "#393B79",
    // "Catalyst": "#5254A3",
    // "Cell Culture": "#6B6ECF",
    // "Cylinders": "#9C9EDE",
    // "Dyes": "#637939",
    // "Enzyme": "#8CA252",
    // "EP Standards": "#B5CF6B",
    // "Equipment and Instruments": "#CEDB9C",
    // "Fine Chemicals": "#8C6D31",
    // "Food Grade": "#BD9E39",
    // "Glucuronides": "#E7BA52",
    // "High Purity Acids": "#843C39",
    // "Impurity": "#AD494A",
    // "Indian pharmacopoeia": "#D6616B",
    // "Instruments": "#E7969C",
    // "Intermediates": "#7B4173",
    // "Items": "#A55194",
    // "Lab Consumables": "#CE6DBD",
    // "Lab Systems & Fixtures": "#DE9ED6",
    // "Laboratory Containers & Storage": "#3182BD",
    // "Membranes": "#6BAED6",
    // "Metabolites": "#9ECAE1",
    // "Metal Standard Solutions": "#E6550D",
    // "Multiple Pharmacopoeia": "#FD8D3C",
    // "Natural Products": "#FDAE6B",
    // "New Life Biologics": "#FDD0A2",
    // "Nitrosamine": "#31A354",
    // "NMR Solvents": "#74C476",
    // "Nucleosides and Nucleotides": "#A1D99B",
    // "Packaging Materials": "#C7E9C0",
    // "Peptides": "#756BB1",
    // "Pesticide Standards": "#9E9AC8",
    // "Polymer": "#BCBDDC",
    // "Reagent": "#DADAEB",
    // "Reference Materials": "#636363",
    // "Secondary Standards": "#969696",
    // "Services": "#BDBDBD",
    // "Solvent": "#D9D9D9",
    // "Stable Isotope reagents": "#8DD3C7",
    // "Stable isotopes": "#FFFFB3",
    // "Trading": "#BEBADA",
    // "Ultrapur": "#FB8072",
    // "Ultrapur-100": "#80B1D3",
    // "USP Standards": "#FDB462"
    // };

    // export default async function handler(req, res) {
    // const {cardCode , salesPerson, category } = req.query;
    // console.log("Customer code:", cardCode, "Sales Person:", salesPerson, "Category:", category);

    // try {
    //     const paramDeclarations = `
    // ${cardCode ? '@cardCode NVARCHAR(20),' : ''}
    // ${salesPerson ? '@salesPersonCode INT,' : ''}
    // ${category ? '@categoryName NVARCHAR(100),' : ''}
    // `.replace(/,+\s*$/, ''); // Remove last comma

    // const paramAssignments = `
    // ${cardCode ? '@cardCode = @cardCode,' : ''}
    // ${salesPerson ? '@salesPersonCode = @salesPersonCode,' : ''}
    // ${category ? '@categoryName = @categoryName,' : ''}
    // `.replace(/,+\s*$/, ''); // Remove last comma

    //         const query = `
    //         DECLARE @cols NVARCHAR(MAX);
    //         SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate)
    //         FROM (
    //             SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, 
    //                     MIN(OINV.DocDate) AS MonthDate
    //             FROM OINV
    //             WHERE OINV.CANCELED = 'N'
    //             ${salesPerson ? 'AND OINV.SlpCode = @salesPersonCode' : ''}
    //             GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    //         ) AS MonthList;

    //         DECLARE @sql NVARCHAR(MAX) = '
    //         WITH CategorySales AS (
    //             SELECT 
    //                 T4.ItmsGrpNam AS Category,
    //                 FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
    //                 SUM(INV1.LineTotal) AS Amount
    //             FROM OINV
    //             INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
    //             INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
    //             INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    //             WHERE OINV.CANCELED = ''N''
    //             ${cardCode ? 'AND OINV.CardCode = @cardCode' : ''}
    //             ${salesPerson ? 'AND OINV.SlpCode = @salesPersonCode' : ''}
    //             ${category ? 'AND T4.ItmsGrpNam = @categoryName' : ''}
    //             GROUP BY T4.ItmsGrpNam, FORMAT(OINV.DocDate, ''MMM yyyy'')
    //         )
    //         SELECT * FROM (
    //             SELECT Category, MonthYear, Amount FROM CategorySales
    //         ) AS SourceData
    //         PIVOT (
    //             SUM(Amount) FOR MonthYear IN (' + @cols + ')
    //         ) AS PivotTable
    //         ORDER BY Category';

    //         EXEC sp_executesql @sql, 
    //             N'${paramDeclarations}', 
    //             ${paramAssignments};
    //         `;


    //     const params = [
        
    //     ];

    //     if (salesPerson) {
    //     params.push({
    //         name: "salesPersonCode",
    //         type: sql.Int,
    //         value: parseInt(salesPerson, 10),
    //     });
    //     }

    //     if (category) {
    //     params.push({
    //         name: "categoryName",
    //         type: sql.NVarChar(100),
    //         value: category,
    //     });
    //     }
    //     if (cardCode) {
    // params.push({
    //     name: "cardCode",
    //     type: sql.NVarChar(20),
    //     value: cardCode,
    // });
    // }


    //     console.log("Executing query with parameters:", params);
    //     const result = await queryDatabase(query, params);

    //     // Transform the data for charting
    //     const categories = result.map((row) => row.Category);
    //     const months =
    //     result.length > 0
    //         ? Object.keys(result[0]).filter((key) => key !== "Category")
    //         : [];

    //     const datasets = categories.map((category, idx) => {
    //     const categoryData = result.find((row) => row.Category === category);
    //     return {
    //         label: category,
    //         data: months.map((month) => categoryData[month] || 0),
    //         backgroundColor: getCategoryColor(category),
    //     };
    //     });

    //     res.status(200).json({
    //     labels: months,
    //     datasets,
    //     });
    // } catch (error) {
    //     console.error("Error fetching category sales data:", error);
    //     res.status(500).json({ error: "Failed to fetch category sales data" });
    // }
    // }

    // function getCategoryColor(category) {
    // return categoryColorMap[category] || "#CCCCCC"; // Default gray for unknown categories
    // }

    // // Simple hash function for consistent color assignment
    // function hashCode(str) {
    // let hash = 0;
    // for (let i = 0; i < str.length; i++) {
    //     hash = str.charCodeAt(i) + ((hash << 5) - hash);
    // }
    // return hash;
    // }

    // pages/api/dashboard/category-sales.js
import { queryDatabase } from "../../../lib/db";
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
  const { cardCode, salesPerson, category } = req.query;

  try {
    // Build parameter declarations for sp_executesql
    const paramDeclarations = [];
    const paramValues = [];
    const params = [];

    if (cardCode) {
      paramDeclarations.push("@cardCode NVARCHAR(20)");
      paramValues.push("@cardCode");
      params.push({ name: "cardCode", type: sql.NVarChar(20), value: cardCode });
    }
    if (salesPerson) {
      paramDeclarations.push("@salesPersonCode INT");
      paramValues.push("@salesPersonCode");
      params.push({ name: "salesPersonCode", type: sql.Int, value: parseInt(salesPerson, 10) });
    }
    if (category) {
      paramDeclarations.push("@categoryName NVARCHAR(100)");
      paramValues.push("@categoryName");
      params.push({ name: "categoryName", type: sql.NVarChar(100), value: category });
    }

    const paramDeclarationString = paramDeclarations.join(", ");
    const paramValueString = paramValues.join(", ");

    let query;
    
    if (paramDeclarations.length > 0) {
      // Query with parameters
      query = `
        DECLARE @cols NVARCHAR(MAX);
        SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',')
        FROM (
          SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear
          FROM OINV
          WHERE OINV.CANCELED = 'N'
          ${salesPerson ? 'AND OINV.SlpCode = @salesPersonCode' : ''}
        ) AS MonthList;

        DECLARE @sql NVARCHAR(MAX) = '
          WITH CategorySales AS (
            SELECT T4.ItmsGrpNam AS Category,
                   FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
                   SUM(INV1.LineTotal) AS Amount
            FROM OINV
            JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
            JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
            JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
            WHERE OINV.CANCELED = ''N''
            ${cardCode ? 'AND OINV.CardCode = @cardCode' : ''}
            ${salesPerson ? 'AND OINV.SlpCode = @salesPersonCode' : ''}
            ${category ? 'AND T4.ItmsGrpNam = @categoryName' : ''}
            GROUP BY T4.ItmsGrpNam, FORMAT(OINV.DocDate, ''MMM yyyy'')
          )
          SELECT * FROM (
            SELECT Category, MonthYear, Amount FROM CategorySales
          ) AS SourceData
          PIVOT (
            SUM(Amount) FOR MonthYear IN (' + @cols + ')
          ) AS PivotTable
          ORDER BY Category';

        EXEC sp_executesql @sql, N'${paramDeclarationString}', ${paramValueString};
      `;
    } else {
      // Query without parameters
      query = `
        DECLARE @cols NVARCHAR(MAX);
        SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',')
        FROM (
          SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear
          FROM OINV
          WHERE OINV.CANCELED = 'N'
        ) AS MonthList;

        DECLARE @sql NVARCHAR(MAX) = '
          WITH CategorySales AS (
            SELECT T4.ItmsGrpNam AS Category,
                   FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
                   SUM(INV1.LineTotal) AS Amount
            FROM OINV
            JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
            JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
            JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
            WHERE OINV.CANCELED = ''N''
            GROUP BY T4.ItmsGrpNam, FORMAT(OINV.DocDate, ''MMM yyyy'')
          )
          SELECT * FROM (
            SELECT Category, MonthYear, Amount FROM CategorySales
          ) AS SourceData
          PIVOT (
            SUM(Amount) FOR MonthYear IN (' + @cols + ')
          ) AS PivotTable
          ORDER BY Category';

        EXEC sp_executesql @sql;
      `;
    }

    const result = await queryDatabase(query, params);

    const categories = result.map((row) => row.Category);
    const months = result.length ? Object.keys(result[0]).filter((k) => k !== "Category") : [];
    const datasets = categories.map((cat) => {
      const data = result.find((r) => r.Category === cat);
      return {
        label: cat,
        data: months.map((m) => data[m] || 0),
        backgroundColor: getCategoryColor(cat)
      };
    });

    res.status(200).json({ labels: months, datasets });
  } catch (error) {
    console.error("Error fetching category sales data:", error);
    res.status(500).json({ error: "Failed to fetch category sales data" });
  }
}

function getCategoryColor(category) {
  return categoryColorMap[category] || "#CCCCCC";
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}