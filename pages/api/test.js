// pages/api/test.js
// Make sure this file is at: pages/api/test.js
export default function handler(req, res) {
  console.log(`API called: ${req.method} /api/test`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  res.status(200).json({ 
    message: 'API route is working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    path: '/api/test',
    receivedHeaders: req.headers,
    receivedBody: req.body
  });
}