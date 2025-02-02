import { getCustomersForDropdown } from "../../../lib/models/customers";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const customers = await getCustomersForDropdown();
      return res.status(200).json({ customers });
    } catch (error) {
      console.error('Error fetching customers for dropdown:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }