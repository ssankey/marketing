export function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // or specify your flutter origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // signals that we should stop here
  }
  return false;
}