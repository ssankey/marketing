
// import { getCustomerBalance } from "../../../lib/models/invoices";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }
//   try {
//     const { data, totalItems } = await getCustomerBalance();
//     return res.status(200).json({
//       invoices: data,
//       totalItems,
//     });
//   } catch (error) {

//     console.error("Error fetching invoice records:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// }


import { getCustomerBalance } from "../../../lib/models/invoices";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Pass the request object to getCustomerBalance
    const { data, totalItems } = await getCustomerBalance(req);
    
    return res.status(200).json({
      invoices: data,
      totalItems,
    });
  } catch (error) {
    console.error("Error fetching invoice records:", error);
    
    // Return more specific error responses based on error type
    if (error.message === 'Missing or malformed Authorization header') {
      return res.status(401).json({ 
        message: "Unauthorized",
        details: error.message 
      });
    }
    if (error.message === 'Token verification failed') {
      return res.status(401).json({ 
        message: "Unauthorized",
        details: "Invalid or expired token" 
      });
    }
    if (error.message === 'No access: insufficient permissions') {
      return res.status(403).json({ 
        message: "Forbidden",
        details: "You don't have permission to access this resource" 
      });
    }
    
    // Default error response
    return res.status(500).json({ 
      message: "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}