// pages/api/densityapp/version.js
import { setCorsHeaders } from 'lib/cors';

export default function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    version: '1.0.0',
    apkUrl: 'https://marketing.densitypharmachem.com/downloads/density-app.apk',
    forceUpdate: false,
    releaseNotes: 'Initial release',
  });
}