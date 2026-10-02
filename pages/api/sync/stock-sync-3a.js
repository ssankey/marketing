// pages/api/sync/stock-sync-3a.js
import mysqlPool from '../../../lib/mysqlDb';
import sql from 'mssql';

// TEST_DENSITY connection — same server/credentials as sendMismatchReport.js
const testDbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.TEST_DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  connectionTimeout: 60000,
  requestTimeout: 30000,
};

function stripM40Prefix(catSizeMain) {
  return catSizeMain.replace(/^M40/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let testPool;

  try {
    const [rows] = await mysqlPool.query(
      'SELECT cat_size_main, stock_in_china FROM `3AProducts` WHERE DATE(UpdatedDate) = CURDATE() AND is_active = 1'
    );

    if (!rows.length) {
      return res.status(200).json({ success: true, updated: 0, skipped: 0, notFound: 0 });
    }

    testPool = await sql.connect(testDbConfig);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const row of rows) {
      const catSizeMain = stripM40Prefix(row.cat_size_main);
      const mysqlStock = row.stock_in_china ?? 0;

      const current = await testPool.request()
        .input('catSizeMain', sql.NVarChar, catSizeMain)
        .query('SELECT stock_in_china FROM chemical_density WHERE cat_size_main = @catSizeMain');

      if (!current.recordset.length) {
        notFound++;
        continue;
      }

      const currentStock = current.recordset[0].stock_in_china;

      if (Number(currentStock) !== Number(mysqlStock)) {
        await testPool.request()
          .input('catSizeMain', sql.NVarChar, catSizeMain)
          .input('stock', sql.Decimal(10, 2), mysqlStock)
          .query('UPDATE chemical_density SET stock_in_china = @stock WHERE cat_size_main = @catSizeMain');
        updated++;
      } else {
        skipped++;
      }
    }

    return res.status(200).json({ success: true, updated, skipped, notFound });
  } catch (error) {
    console.error('[stock-sync-3a] error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (testPool) {
      try { await testPool.close(); } catch {}
    }
  }
}
