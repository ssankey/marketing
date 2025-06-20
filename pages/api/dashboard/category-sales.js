
// pages/api/dashboard/category-sales.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";
import { verify } from "jsonwebtoken";

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
  try {
    const { cardCode, salesPerson, category, customer, contactPerson } = req.query;
    const authHeader = req.headers.authorization;

    // Authentication check
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or malformed Authorization header',
        received: authHeader 
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: 'Token verification failed' });
    }

    const isAdmin = decoded.role === 'admin';
    const contactCodes = decoded.contactCodes || [];
    const cardCodes = decoded.cardCodes || [];

    // Build WHERE conditions and parameters
    const whereConditions = ["OINV.CANCELED = 'N'"];
    const params = [];

    // Role-based filtering
    if (!isAdmin) {
      if (contactCodes.length > 0) {
        whereConditions.push(`OINV.CntctCode IN (${contactCodes.map(c => `'${c}'`).join(',')})`);
      } else if (cardCodes.length > 0) {
        whereConditions.push(`OINV.CardCode IN (${cardCodes.map(c => `'${c}'`).join(',')})`);
      } else {
        return res.status(403).json({ 
          error: 'No access: cardCodes or contactCodes not provided' 
        });
      }
    }

    // Add filter conditions
    if (cardCode) {
      whereConditions.push('OINV.CardCode = @cardCode');
      params.push({ name: 'cardCode', type: sql.NVarChar(20), value: cardCode });
    }
    if (salesPerson) {
      whereConditions.push('OINV.SlpCode = @salesPersonCode');
      params.push({ name: 'salesPersonCode', type: sql.Int, value: parseInt(salesPerson, 10) });
    }
    if (category) {
      whereConditions.push('T4.ItmsGrpNam = @categoryName');
      params.push({ name: 'categoryName', type: sql.NVarChar(100), value: category });
    }
    if (customer) {
      whereConditions.push('OINV.CardCode = @customerCode');
      params.push({ name: 'customerCode', type: sql.NVarChar(20), value: customer });
    }
    if (contactPerson) {
      whereConditions.push('OINV.CntctCode = @contactPersonCode');
      params.push({ name: 'contactPersonCode', type: sql.NVarChar(20), value: contactPerson });
    }

    const whereClause = whereConditions.join(' AND ');

    // Build dynamic SQL query
    const query = `
      DECLARE @cols NVARCHAR(MAX);
      SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY SortOrder)
      FROM (
        SELECT DISTINCT 
          FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear,
          YEAR(OINV.DocDate) * 100 + MONTH(OINV.DocDate) AS SortOrder
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        ${customer || contactPerson ? 'LEFT JOIN OCRD C ON OINV.CardCode = C.CardCode' : ''}
        WHERE ${whereClause}
      ) AS MonthList;

      DECLARE @sql NVARCHAR(MAX) = '
        WITH CategorySales AS (
          SELECT 
            T4.ItmsGrpNam AS Category,
            FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
            SUM(INV1.LineTotal) AS Amount
          FROM OINV
          JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
          JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
          JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
          ${customer || contactPerson ? 'LEFT JOIN OCRD C ON OINV.CardCode = C.CardCode' : ''}
          WHERE ${whereClause.replace(/'/g, "''")}
          GROUP BY T4.ItmsGrpNam, FORMAT(OINV.DocDate, ''MMM yyyy'')
        )
        SELECT * FROM (
          SELECT Category, MonthYear, Amount FROM CategorySales
        ) AS SourceData
        PIVOT (
          SUM(Amount) FOR MonthYear IN (' + @cols + ')
        ) AS PivotTable
        ORDER BY Category';

      EXEC sp_executesql @sql
      ${params.length > 0 ? `, N'${params.map(p => `${p.name} ${p.type.name}`).join(', ')}', 
        ${params.map(p => `@${p.name}`).join(', ')}` : ''};
    `;

    // Execute query
    const result = await queryDatabase(query, params) || [];

    // Format response
    const categories = result.map(row => row.Category);
    let months = [];
    
    if (result.length > 0) {
      months = Object.keys(result[0]).filter(k => k !== "Category");
    }

    const datasets = categories.map(cat => {
      const data = result.find(r => r.Category === cat);
      return {
        label: cat,
        data: months.map(m => data[m] || 0),
        backgroundColor: categoryColorMap[cat] || "#CCCCCC"
      };
    });

    return res.status(200).json({ labels: months, datasets });

  } catch (error) {
    console.error("Error in category-sales API:", {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    return res.status(500).json({ 
      error: "Failed to fetch category sales data",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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