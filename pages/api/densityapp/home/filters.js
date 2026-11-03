import { verify } from 'jsonwebtoken';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const isAdmin = decoded.role === 'admin';

    const [categories, customers, salesPersons] = await Promise.all([
      queryDatabase(`SELECT DISTINCT ItmsGrpNam FROM OITB ORDER BY ItmsGrpNam`, []),
      queryDatabase(`SELECT DISTINCT CardCode, CardName FROM OCRD WHERE CardType = 'C' ORDER BY CardName`, []),
      isAdmin
        ? queryDatabase(`SELECT DISTINCT SlpCode, SlpName FROM OSLP ORDER BY SlpName`, [])
        : Promise.resolve([]),
    ]);

    return res.status(200).json({
      categories:  categories.map(r => ({ value: r.ItmsGrpNam, label: r.ItmsGrpNam })),
      customers:   customers.map(r  => ({ value: r.CardCode,   label: r.CardName   })),
      salesPersons: salesPersons.map(r => ({ value: r.SlpCode, label: r.SlpName   })),
    });

  } catch (error) {
    console.error('filters error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}