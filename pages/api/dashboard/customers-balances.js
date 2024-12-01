// /pages/api/dashboard/customers-balances.js
import { queryDatabase } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const query = `
      SELECT 
        t1.cardcode, 
        t1.cardname,
        (SUM(T0.Debit) - SUM(T0.Credit)) AS Balance
      FROM JDT1 t0
      LEFT OUTER JOIN OCRD t1 ON T0.ShortName = T1.CardCode  
      WHERE T0.ShortName LIKE 'C%%'
      GROUP BY t1.cardname, t1.cardcode
      HAVING (SUM(T0.Debit) - SUM(T0.Credit)) > 0
    `;
    const data = await queryDatabase(query);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching customer balances:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
