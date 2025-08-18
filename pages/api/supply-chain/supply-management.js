// pages/api/supply-chain/supply-management.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from '../../lib/db';
import { getCache, setCache } from "../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;

    // Check for authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    // Verify JWT token
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ error: "Token verification failed" });
    }

    // Extract user role and access codes
    const isAdmin = decoded.role === "admin";
    const contactCodes = decoded.contactCodes || [];
    const cardCodes = decoded.cardCodes || [];

    // Create cache key
    const userIdentifier = isAdmin
      ? "admin"
      : contactCodes.length
        ? contactCodes.join("-")
        : cardCodes.join("-");
    
    const cacheKey = `sales-order-invoice:${userIdentifier}`;

    // Check cache first
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    // Build WHERE clauses for authorization
    const whereClauses = [];
    const params = [];

    // Apply role-based filtering
    if (!isAdmin) {
      if (contactCodes.length > 0) {
        whereClauses.push(
          `T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`
        );
      } else if (cardCodes.length > 0) {
        whereClauses.push(
          `T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`
        );
      } else {
        return res.status(403).json({
          error: "No access: cardCodes or contactCodes not provided",
        });
      }
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT
          -- Order Information
          T0.DocNum AS [SO_No],
          T0.DocDate AS [SO_Date],
          T0.NumAtCard AS [Ref_No_PO_No],
          
          -- Invoice Information
          OINV.DocNum AS [Invoice_No],
          OINV.DocDate AS [Invoice_Date],
          OINV.U_DispatchDate AS [Dispatch_Date],
          OINV.trackno AS [Tracking_No],
          
          -- Sales Person Information
          T5.SlpName AS [Sales_Person],
          T0.SlpCode AS [SLP_Code],
          
          -- Customer Information
          T0.CardName AS [Customer_Name],
          T0.CardCode AS [Customer_Code],
          
          -- Product Information
          T1.ItemCode AS [Product],
          T1.Dscription AS [Product_Description],
          T4.ItmsGrpNam AS [Category],
          
          -- Contact Person Information
          T6.Name AS [Contact_Person],
          T0.CntctCode AS [Contact_Person_Code]
          
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode

      -- Join to get invoice information through delivery
      LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                     AND T1.LineNum = DLN1.BaseLine 
                     AND DLN1.BaseType = 17
      LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                     AND DLN1.LineNum = INV1.BaseLine 
                     AND INV1.BaseType = 15
      LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry 
                     AND OINV.CANCELED = 'N'

      ${whereSQL}
      ORDER BY T0.DocDate DESC, T0.DocNum DESC
    `;

    const results = await queryDatabase(query, params);
    
    // Cache the results for 30 minutes
    await setCache(cacheKey, results || [], 1800);
    
    // Return the plain array of objects
    res.status(200).json(results || []);

  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}