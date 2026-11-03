

// pages/api/customers/[id]/email.js
import { queryDatabase } from "../../../../lib/db";
import sql from 'mssql';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  try {
    const result = await queryDatabase(
      `SELECT TOP 1 E_Mail as email FROM OCRD WHERE CardCode = @cardCode`,
      [{ name: "cardCode", type: sql.NVarChar, value: id }]
    );
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
   

    return res.status(200).json({ email: result[0].email });
  } catch (error) {
    console.error('Error fetching customer email:', error);
    return res.status(500).json({ error: 'Failed to fetch customer email' });
  }
}