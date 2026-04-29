// pages/api/customers/new-vs-old-modal.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      mode,
      fy,
      month,
      year,
      period,
      customerType,
      slpCode,
      itmsGrpCod,
      cardCode,
      region,
      state,
    } = req.query;

    // ── Overall period range ──────────────────────────────────────────────────
    let startDate, endDate;
    if (mode === "daily") {
      const m = parseInt(month), y = parseInt(year);
      startDate = `${y}-${String(m).padStart(2,"0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${y}-${String(m).padStart(2,"0")}-${lastDay}`;
    } else {
      const [fyStart, fyEndShort] = fy.split("-");
      const fyStartYear = parseInt(fyStart);
      const fyEndYear = 2000 + parseInt(fyEndShort);
      startDate = `${fyStartYear}-04-01`;
      endDate   = `${fyEndYear}-03-31`;
    }

    // ── Period-specific date range (the clicked bar) ──────────────────────────
    let periodStart, periodEnd;
    // "ALL" means KPI card was clicked — use full period range
    if (period === "ALL") {
      periodStart = startDate;
      periodEnd   = endDate;
    } else {
      const p = parseInt(period);
      if (mode === "daily") {
        const m = parseInt(month), y = parseInt(year);
        const pad = String(p).padStart(2, "0");
        periodStart = `${y}-${String(m).padStart(2,"0")}-${pad}`;
        periodEnd   = periodStart;
      } else {
        const [fyStart, fyEndShort] = fy.split("-");
        const fyStartYear = parseInt(fyStart);
        const fyEndYear = 2000 + parseInt(fyEndShort);
        const mYear = p >= 4 ? fyStartYear : fyEndYear;
        const lastDay = new Date(mYear, p, 0).getDate();
        periodStart = `${mYear}-${String(p).padStart(2,"0")}-01`;
        periodEnd   = `${mYear}-${String(p).padStart(2,"0")}-${lastDay}`;
      }
    }

    // ── Optional filter clauses ───────────────────────────────────────────────
    const foWhere = [];
    if (slpCode)  foWhere.push(`O.SlpCode = ${parseInt(slpCode)}`);
    if (cardCode) foWhere.push(`O.CardCode = '${cardCode}'`);
    if (itmsGrpCod) foWhere.push(`IB.ItmsGrpNam = '${itmsGrpCod.replace(/'/g,"''")}'`);
    const foExtraSQL = foWhere.length ? `AND ${foWhere.join(" AND ")}` : "";

    const regionStateMapping = {
      Overseas: `ISNULL(C1.Country,'') <> 'IN'`,
      Central:  `C1.State IN ('AP','TE')`,
      South:    `C1.State IN ('KL','KT','TN','PC')`,
      "West 1": `C1.State IN ('MH','GO','DN')`,
      "West 2": `C1.State = 'GJ'`,
      North:    `C1.State IN ('DL','HR','HP','PU','RJ','UP','UT','MP','CH')`,
      East:     `C1.State IN ('WB','JH','AS','ME')`,
    };
    const stateCodeMapping = {
      "Telangana":"TE","Maharashtra":"MH","Tamil Nadu":"TN","Uttar Pradesh":"UP",
      "Gujarat":"GJ","Karnataka":"KT","Madhya Pradesh":"MP","West Bengal":"WB",
      "Delhi":"DL","Goa":"GO","Andhra Pradesh":"AP","Punjab":"PU","Haryana":"HR",
      "Rajasthan":"RJ","Jharkhand":"JH","Kerala":"KL","Uttarakhand":"UT",
      "Assam":"AS","Himachal Pradesh":"HP","Chandigarh":"CH","Puducherry":"PC",
    };

    let geoFilter = "";
    if (region && regionStateMapping[region]) geoFilter = `AND ${regionStateMapping[region]}`;
    else if (state === "Overseas") geoFilter = `AND ISNULL(C1.Country,'') <> 'IN'`;
    else if (state && stateCodeMapping[state]) geoFilter = `AND C1.State = '${stateCodeMapping[state]}'`;

    const categoryJoinFO = itmsGrpCod
      ? `INNER JOIN RDR1 RL ON O.DocEntry = RL.DocEntry
         INNER JOIN OITM IM ON RL.ItemCode = IM.ItemCode
         INNER JOIN OITB IB ON IM.ItmsGrpCod = IB.ItmsGrpCod`
      : "";

    const geoJoinFO = (region || state)
      ? `LEFT JOIN OCRD GC ON O.CardCode = GC.CardCode
         OUTER APPLY (
           SELECT TOP 1 State, Country FROM CRD1
           WHERE CardCode = GC.CardCode AND AdresType = 'B'
           ORDER BY Address
         ) AS C1`
      : "";

    // ── KEY FIX: wrap all inline date strings in CONVERT(DATE, ..., 23) ───────
    // SQL Server cannot implicitly compare DATETIME columns to plain VARCHAR
    // date strings when the session locale is not ISO. CONVERT(DATE,'...',23)
    // forces ISO 8601 (yyyy-mm-dd) parsing and eliminates the conversion error.
    const SD  = `CONVERT(DATE,'${startDate}',23)`;
    const ED  = `CONVERT(DATE,'${endDate}',23)`;
    const PSD = `CONVERT(DATE,'${periodStart}',23)`;
    const PED = `CONVERT(DATE,'${periodEnd}',23)`;

    const query = `
      WITH FirstOrders AS (
        SELECT CardCode, MIN(DocDate) AS FirstOrderDate
        FROM ORDR WHERE CANCELED = 'N'
        GROUP BY CardCode
      ),
      FilteredOrders AS (
        -- Join RDR1 to get LineTotal (net line value) instead of header DocTotal/VatSum.
        -- ORDR does not have VatSum column; LineTotal is the correct net value per line.
        SELECT DISTINCT
          O.DocEntry, O.CardCode, O.CardName,
          RL2.LineTotal, O.SlpCode, O.DocDate
        FROM ORDR O
        INNER JOIN RDR1 RL2 ON O.DocEntry = RL2.DocEntry
        ${categoryJoinFO}
        ${geoJoinFO}
        WHERE O.CANCELED = 'N'
          AND O.DocDate >= ${PSD}
          AND O.DocDate <= ${PED}
          ${foExtraSQL}
          ${geoFilter}
      ),
      Classified AS (
        SELECT
          FO.CardCode,
          -- PSD/PED = the clicked bar's own start/end date.
          -- New = first ever order is within THIS bar's period (e.g. March 2026).
          -- Old = had an order before this bar's period started.
          -- This matches the trend chart logic fixed in new-vs-old-trend.js.
          CASE
            WHEN FRO.FirstOrderDate >= ${PSD} AND FRO.FirstOrderDate <= ${PED}
            THEN 'New' ELSE 'Old'
          END AS CustomerType
        FROM (SELECT DISTINCT CardCode FROM FilteredOrders) FO
        LEFT JOIN FirstOrders FRO ON FO.CardCode = FRO.CardCode
      )
      SELECT
        C.CardCode,
        MAX(FO.CardName)                                     AS CustomerName,
        MAX(S.SlpName)                                       AS SalesPersonName,
        COUNT(DISTINCT FO.DocEntry)                          AS NoOfOrders,
        SUM(FO.LineTotal)                                    AS OrderValue,
        (SELECT TOP 1 IB2.ItmsGrpNam
         FROM RDR1 RL2
         JOIN OITM IM2 ON RL2.ItemCode = IM2.ItemCode
         JOIN OITB IB2 ON IM2.ItmsGrpCod = IB2.ItmsGrpCod
         WHERE RL2.DocEntry IN (SELECT DocEntry FROM FilteredOrders WHERE CardCode = C.CardCode)
         ${itmsGrpCod ? `AND IB2.ItmsGrpNam = '${itmsGrpCod.replace(/'/g,"''")}'` : ""}
         GROUP BY IB2.ItmsGrpNam ORDER BY COUNT(*) DESC)    AS Category,
        CASE
          WHEN ISNULL(C1_M.Country,'') <> 'IN'                              THEN 'Overseas'
          WHEN C1_M.State IN ('AP','TE')                                    THEN 'Central'
          WHEN C1_M.State IN ('KL','KT','TN','PC')                          THEN 'South'
          WHEN C1_M.State IN ('MH','GO','DN')                               THEN 'West 1'
          WHEN C1_M.State = 'GJ'                                            THEN 'West 2'
          WHEN C1_M.State IN ('DL','HR','HP','PU','RJ','UP','UT','MP','CH') THEN 'North'
          WHEN C1_M.State IN ('WB','JH','AS','ME')                          THEN 'East'
          ELSE 'Unknown'
        END                                                  AS Region,
        CASE C1_M.State
          WHEN 'AP' THEN 'Andhra Pradesh' WHEN 'AS' THEN 'Assam'
          WHEN 'CH' THEN 'Chandigarh'     WHEN 'DL' THEN 'Delhi'
          WHEN 'DN' THEN 'Dadra & NH'     WHEN 'GJ' THEN 'Gujarat'
          WHEN 'GO' THEN 'Goa'            WHEN 'HP' THEN 'Himachal Pradesh'
          WHEN 'HR' THEN 'Haryana'        WHEN 'JH' THEN 'Jharkhand'
          WHEN 'KL' THEN 'Kerala'         WHEN 'KT' THEN 'Karnataka'
          WHEN 'ME' THEN 'Meghalaya'      WHEN 'MH' THEN 'Maharashtra'
          WHEN 'MP' THEN 'Madhya Pradesh' WHEN 'PC' THEN 'Puducherry'
          WHEN 'PU' THEN 'Punjab'         WHEN 'RJ' THEN 'Rajasthan'
          WHEN 'TE' THEN 'Telangana'      WHEN 'TN' THEN 'Tamil Nadu'
          WHEN 'UP' THEN 'Uttar Pradesh'  WHEN 'UT' THEN 'Uttarakhand'
          WHEN 'WB' THEN 'West Bengal'    ELSE ISNULL(C1_M.Country,'Unknown')
        END                                                  AS State,
        CONVERT(VARCHAR(10), MAX(FRO.FirstOrderDate), 23)    AS FirstOrderDate,
        CONVERT(VARCHAR(10), MAX(FO.DocDate), 23)            AS LastOrderDate
      FROM Classified C
      JOIN FilteredOrders FO  ON C.CardCode = FO.CardCode
      LEFT JOIN OSLP S        ON FO.SlpCode = S.SlpCode
      LEFT JOIN OCRD CR2      ON C.CardCode = CR2.CardCode
      OUTER APPLY (
        SELECT TOP 1 State, Country FROM CRD1
        WHERE CardCode = CR2.CardCode AND AdresType = 'B'
        ORDER BY Address
      ) AS C1_M
      LEFT JOIN FirstOrders FRO ON C.CardCode = FRO.CardCode
      WHERE ('${customerType}' = 'All' OR C.CustomerType = '${customerType}')
      GROUP BY C.CardCode, C1_M.State, C1_M.Country
      ORDER BY OrderValue DESC;
    `;

    const rows = await queryDatabase(query, []);
    return res.status(200).json({ data: rows });

  } catch (err) {
    console.error("new-vs-old-modal API error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}