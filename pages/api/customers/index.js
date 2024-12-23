// /pages/api/customers/index.js

import { getCustomers } from 'lib/models/customers';
import { parseCookies } from 'utils/parseCookies';
import jwt from 'jsonwebtoken';
import sql from 'mssql';

/**
 * Handles GET requests to fetch a paginated list of customers.
 * Applies search, sorting, and status filters.
 * Admins see all customers; contact_persons see only their own data.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies to get the token
    const cookies = parseCookies(req);
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing' });
    }

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('JWT verification failed:', err);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const {
      page = 1,
      search = '',
      sortField = '',
      sortDir = 'asc',
      status = 'all',
    } = req.query;

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

    // Initialize WHERE clause with base condition
    let whereClause = "T0.CardType = 'C'"; // Only customers

    // Initialize parameters array for parameterized queries
    const parameters = [];

    // Handle search filter
    if (search) {
      parameters.push({ name: 'search', type: sql.VarChar, value: `%${search}%` });
      whereClause += `
        AND (
          T0.CardCode LIKE @search OR 
          T0.CardName LIKE @search OR 
          T0.Phone1 LIKE @search OR 
          T0.E_Mail LIKE @search
        )
      `;
    }

    // Handle status filter
    if (status && status !== 'all') {
      const statusValue = status === 'active' ? 'Y' : 'N';
      parameters.push({ name: 'status', type: sql.VarChar, value: statusValue });
      whereClause += ` AND T0.ValidFor = @status`;
    }

    // Role-based access control
    if (user.role === 'contact_person') {
      // Contact Persons see only their own data
      parameters.push({ name: 'cardCode', type: sql.VarChar, value: user.cardCode });
      parameters.push({ name: 'contactCode', type: sql.VarChar, value: user.contactCode });
      whereClause += ` AND T0.CardCode = @cardCode AND T0.CntctCode = @contactCode`;
    }
    // Admins can see all data; no additional filters

    // Construct COUNT query to get total items
    const countQuery = `
      SELECT COUNT(*) as total
      FROM OCRD T0  
      WHERE ${whereClause};
    `;

    // Execute COUNT query
    const totalResult = await getCustomers(countQuery, parameters);
    const totalItems = totalResult[0]?.total || 0;

    // Validate sortField to prevent SQL injection via sorting
    const validSortFields = ['CustomerName', 'CustomerCode', 'Balance', 'CreditLine'];
    const sortFieldValidated = validSortFields.includes(sortField) ? sortField : 'CustomerName';
    const sortDirValidated = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Construct data query with sorting and pagination
    const dataQuery = `
      SELECT
        T0.CardCode AS CustomerCode,
        T0.CardName AS CustomerName,
        T0.Phone1 AS Phone,
        T0.E_Mail AS Email,
        T0.Address AS BillingAddress,
        T0.Balance,
        T0.Currency,
        T0.ValidFor AS IsActive,
        T0.CreditLine,
        T5.SlpName AS SalesEmployeeName
      FROM OCRD T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause}
      ORDER BY T0.${sortFieldValidated} ${sortDirValidated}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY;
    `;

    parameters.push({ name: 'offset', type: sql.Int, value: offset });
    parameters.push({ name: 'limit', type: sql.Int, value: ITEMS_PER_PAGE });

    // Execute data query
    const rawCustomers = await getCustomers(dataQuery, parameters);

    // Transform IsActive field to boolean
    const customers = rawCustomers.map((customer) => ({
      ...customer,
      IsActive: customer.IsActive === 'Y',
    }));

    return res.status(200).json({
      customers,
      totalItems,
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
