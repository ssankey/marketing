import { getLastTenQuotations } from "lib/models/latestten";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "GET") {
    const quotations = await getLastTenQuotations(id);
    res.status(200).json(quotations);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
