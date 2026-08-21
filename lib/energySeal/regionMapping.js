// lib/energySeal/regionMapping.js
// Same OCRD/CRD1 State -> Region mapping used by target-analytics/percentage-analysis.js
// Shared by the Energy Seal sales-summary and line-items API routes.

export const REGION_FIELD_EXPR = `
  CASE
    WHEN ISNULL(C1.Country, '') <> 'IN' THEN 'Overseas'
    WHEN ISNULL(C1.State, '') = '' THEN 'Unknown'
    WHEN C1.State = 'AP' THEN 'Central'
    WHEN C1.State = 'AS' THEN 'East'
    WHEN C1.State = 'CH' THEN 'North'
    WHEN C1.State = 'DL' THEN 'North'
    WHEN C1.State = 'DN' THEN 'West 1'
    WHEN C1.State = 'GJ' THEN 'West 2'
    WHEN C1.State = 'GO' THEN 'West 1'
    WHEN C1.State = 'HP' THEN 'North'
    WHEN C1.State = 'HR' THEN 'North'
    WHEN C1.State = 'JH' THEN 'East'
    WHEN C1.State = 'KL' THEN 'South'
    WHEN C1.State = 'KT' THEN 'South'
    WHEN C1.State = 'ME' THEN 'East'
    WHEN C1.State = 'MH' THEN 'West 1'
    WHEN C1.State = 'MP' THEN 'North'
    WHEN C1.State = 'PC' THEN 'South'
    WHEN C1.State = 'PU' THEN 'North'
    WHEN C1.State = 'RJ' THEN 'North'
    WHEN C1.State = 'TE' THEN 'Central'
    WHEN C1.State = 'TN' THEN 'South'
    WHEN C1.State = 'UP' THEN 'North'
    WHEN C1.State = 'UT' THEN 'North'
    WHEN C1.State = 'WB' THEN 'East'
    ELSE 'Unknown'
  END
`;

export const REGION_JOIN = `
  JOIN OCRD C ON T0.CardCode = C.CardCode
  OUTER APPLY (
    SELECT TOP 1 State, Country
    FROM CRD1
    WHERE CardCode = C.CardCode AND AdresType = 'B'
    ORDER BY Address
  ) AS C1
`;

export const SALESPERSON_JOIN = `JOIN OSLP S ON T0.SlpCode = S.SlpCode`;

export function getGroupBySql(groupBy) {
  return groupBy === "salesperson"
    ? { fieldExpr: "S.SlpName", joinSQL: SALESPERSON_JOIN }
    : { fieldExpr: REGION_FIELD_EXPR, joinSQL: REGION_JOIN };
}
