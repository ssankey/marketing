
import { getLastTenInvoices} from 'lib/models/latestten';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "GET") {
    const invoices = await getLastTenInvoices(id);
    res.status(200).json(invoices);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
