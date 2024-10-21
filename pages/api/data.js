// /pages/api/data.js
import { queryDatabase } from '../../lib/db'; // Adjust the import path

export default async function handler(req, res) {
  try {
    const data = await queryDatabase('SELECT * FROM ordr');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
