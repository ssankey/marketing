// /pages/api/dashboard/invoices.js
import { queryDatabase } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const query = `
      SELECT 
        t0.docentry, 
        t0.DocNum, 
        t0.docdate,
        t0.CardCode, 
        t0.CardName,
        t12.acctname, 
        t3.groupname,
        t0.DocTotal,
        t0.doctotalfc,
        t0.doccurr,
        t0.Comments 
      FROM OVPM t0   
      INNER JOIN OCRD t2 ON t0.cardcode = t2.cardcode 
      INNER JOIN OCRG t3 ON t2.GroupCode = t3.GroupCode
      INNER JOIN OACT t12 ON t0.trsfracct = t12.AcctCode
      WHERE t0.Canceled = 'N'
      ORDER BY t0.docdate DESC
    `;
    const data = await queryDatabase(query);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
