

// /pages/api/customers/index.js
import { getCustomers } from 'lib/models/customers';

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
      type = 'full' // 'full' for table view, 'dropdown' for select options
    } = req.query;

    // Build base WHERE clause
    let whereClause = "T0.CardType = 'C'"; // Only customers

    // Add search filter if provided
    if (search) {
      const sanitizedSearch = search.replace(/'/g, "''");
      whereClause += ` AND (
        T0.CardCode LIKE '%${sanitizedSearch}%' OR 
        T0.CardName LIKE '%${sanitizedSearch}%' OR 
        T0.Phone1 LIKE '%${sanitizedSearch}%' OR 
        T0.E_Mail LIKE '%${sanitizedSearch}%' OR
        T0.City LIKE '%${sanitizedSearch}%' OR
        T0.State1 LIKE '%${sanitizedSearch}%' OR
        T0.Country LIKE '%${sanitizedSearch}%' OR
        T5.SlpName LIKE '%${sanitizedSearch}%'
      )`;
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      whereClause += ` AND T0.validFor = '${status === 'active' ? 'Y' : 'N'}'`;
    }

    // Build the appropriate query based on type
    let dataQuery;
    if (type === 'dropdown') {
      dataQuery = `
        SELECT
          T0.CardCode AS CustomerCode,
          T0.CardName AS CustomerName
        FROM OCRD T0
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
          T0.Address AS BillingAddress,
          T0.Balance,
          T0.Currency,
          T0.ValidFor AS IsActive,
          T0.CreditLine,
          T5.SlpName AS SalesEmployeeName
        FROM OCRD T0
        LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
        WHERE ${whereClause}
        ORDER BY ${sortField} ${sortDir.toUpperCase()};
      `;
    }

    // Execute query
    const rawCustomers = await getCustomers(dataQuery);
    
    // Transform the data
    const customers = rawCustomers.map(customer => ({
      ...customer,
      IsActive: customer.IsActive === 'Y'
    }));

    // Return appropriate response based on type
    if (type === 'dropdown') {
      return res.status(200).json({
        customers: customers.map(c => ({
          value: c.CustomerCode,
          label: c.CustomerName
        }))
      });
    }

    return res.status(200).json({
      customers,
      totalItems: customers.length
    });

  } catch (error) {
    console.error('Error in customers API:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}