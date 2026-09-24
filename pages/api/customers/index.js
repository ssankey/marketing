

// /pages/api/customers/index.js
import { getCustomers } from 'lib/models/customers';
import sql from 'mssql';

// Same OCRD.State1 -> Region mapping as lib/energySeal/regionMapping.js,
// applied directly to T0.State1 (no CRD1 join needed — OCRD already carries
// the billing state on the customer master row itself).
const REGION_EXPR = `
  CASE
    WHEN ISNULL(T0.Country, '') <> 'IN' THEN 'Overseas'
    WHEN ISNULL(T0.State1, '') = '' THEN 'Unknown'
    WHEN T0.State1 = 'AP' THEN 'Central'
    WHEN T0.State1 = 'AS' THEN 'East'
    WHEN T0.State1 = 'CH' THEN 'North'
    WHEN T0.State1 = 'DL' THEN 'North'
    WHEN T0.State1 = 'DN' THEN 'West 1'
    WHEN T0.State1 = 'GJ' THEN 'West 2'
    WHEN T0.State1 = 'GO' THEN 'West 1'
    WHEN T0.State1 = 'HP' THEN 'North'
    WHEN T0.State1 = 'HR' THEN 'North'
    WHEN T0.State1 = 'JH' THEN 'East'
    WHEN T0.State1 = 'KL' THEN 'South'
    WHEN T0.State1 = 'KT' THEN 'South'
    WHEN T0.State1 = 'ME' THEN 'East'
    WHEN T0.State1 = 'MH' THEN 'West 1'
    WHEN T0.State1 = 'MP' THEN 'North'
    WHEN T0.State1 = 'PC' THEN 'South'
    WHEN T0.State1 = 'PU' THEN 'North'
    WHEN T0.State1 = 'RJ' THEN 'North'
    WHEN T0.State1 = 'TE' THEN 'Central'
    WHEN T0.State1 = 'TN' THEN 'South'
    WHEN T0.State1 = 'UP' THEN 'North'
    WHEN T0.State1 = 'UT' THEN 'North'
    WHEN T0.State1 = 'WB' THEN 'East'
    ELSE 'Unknown'
  END
`;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      search = '',
      sortField = 'CardName',
      sortDir = 'asc',
      status = 'all',
      salesPerson = '',
      region = '',
      page = '1',
      itemsPerPage = '20',
      getAll = 'false',
      type = 'full', // 'full' for table view, 'dropdown' for select options
    } = req.query;

    const isGetAll = getAll === 'true';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, parseInt(itemsPerPage, 10) || 20);
    const offset = (pageNum - 1) * perPage;

    // Build base WHERE clause
    let whereClause = "T0.CardType = 'C'"; // Only customers
    const params = [];

    // Add search filter if provided
    if (search) {
      whereClause += ` AND (
        T0.CardCode LIKE @search OR
        T0.CardName LIKE @search OR
        T0.Phone1 LIKE @search OR
        T0.E_Mail LIKE @search OR
        T0.City LIKE @search OR
        T0.State1 LIKE @search OR
        T0.Country LIKE @search OR
        T5.SlpName LIKE @search
      )`;
      params.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      whereClause += ` AND T0.validFor = @validFor`;
      params.push({ name: 'validFor', type: sql.NVarChar, value: status === 'active' ? 'Y' : 'N' });
    }

    // Sales Employee filter
    if (salesPerson) {
      whereClause += ` AND T0.SlpCode = @salesPerson`;
      params.push({ name: 'salesPerson', type: sql.Int, value: parseInt(salesPerson, 10) });
    }

    // Region filter — same computed expression repeated in WHERE, since SQL
    // Server can't reference a SELECT alias there.
    if (region) {
      whereClause += ` AND (${REGION_EXPR}) = @region`;
      params.push({ name: 'region', type: sql.NVarChar, value: region });
    }

    // Validate sort field to prevent SQL injection — must be a real selected column
    const validSortFields = [
      'CustomerCode', 'CustomerName', 'City', 'State', 'Country', 'Region',
      'SalesEmployeeName', 'Phone', 'Email', 'Balance', 'CreditLine',
    ];
    const sortColumnMap = {
      CustomerCode: 'T0.CardCode',
      CustomerName: 'T0.CardName',
      City: 'T0.City',
      State: 'T0.State1',
      Country: 'T0.Country',
      Region: `(${REGION_EXPR})`,
      SalesEmployeeName: 'T5.SlpName',
      Phone: 'T0.Phone1',
      Email: 'T0.E_Mail',
      Balance: 'T0.Balance',
      CreditLine: 'T0.CreditLine',
    };
    const safeSortField = validSortFields.includes(sortField) ? sortField : 'CustomerName';
    const safeSortDir = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const orderBySql = `${sortColumnMap[safeSortField]} ${safeSortDir}`;

    // Build the appropriate query based on type
    let dataQuery;
    if (type === 'dropdown') {
      dataQuery = `
        SELECT
          T0.CardCode AS CustomerCode,
          T0.CardName AS CustomerName
        FROM OCRD T0
        LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
        WHERE ${whereClause}
        ORDER BY T0.CardName ASC;
      `;
    } else {
      dataQuery = `
        SELECT
          T0.CardCode AS CustomerCode,
          T0.CardName AS CustomerName,
          T0.Phone1 AS Phone,
          T0.E_Mail AS Email,
          T0.City,
          T0.State1 AS State,
          T0.Country,
          (${REGION_EXPR}) AS Region,
          T0.Address AS BillingAddress,
          T0.Balance,
          T0.Currency,
          T0.ValidFor AS IsActive,
          T0.CreditLine,
          T0.SlpCode,
          T5.SlpName AS SalesEmployeeName
        FROM OCRD T0
        LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
        WHERE ${whereClause}
        ORDER BY ${orderBySql}
        ${isGetAll ? '' : 'OFFSET @offset ROWS FETCH NEXT @perPage ROWS ONLY'};
      `;

      const countQuery = `
        SELECT COUNT(*) AS total
        FROM OCRD T0
        LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
        WHERE ${whereClause};
      `;

      if (!isGetAll) {
        const countParams = [...params];
        const [rawCustomers, countResult] = await Promise.all([
          getCustomers(dataQuery, [
            ...params,
            { name: 'offset', type: sql.Int, value: offset },
            { name: 'perPage', type: sql.Int, value: perPage },
          ]),
          getCustomers(countQuery, countParams),
        ]);

        const customers = rawCustomers.map((customer) => ({
          ...customer,
          IsActive: customer.IsActive === 'Y',
        }));

        return res.status(200).json({
          customers,
          totalItems: countResult[0]?.total || 0,
        });
      }
    }

    // Execute query (dropdown, or getAll — no pagination)
    const rawCustomers = await getCustomers(dataQuery, params);

    const customers = rawCustomers.map((customer) => ({
      ...customer,
      IsActive: customer.IsActive === 'Y',
    }));

    if (type === 'dropdown') {
      return res.status(200).json({
        customers: customers.map((c) => ({
          value: c.CustomerCode,
          label: c.CustomerName,
        })),
      });
    }

    return res.status(200).json({
      customers,
      totalItems: customers.length,
    });

  } catch (error) {
    console.error('Error in customers API:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
