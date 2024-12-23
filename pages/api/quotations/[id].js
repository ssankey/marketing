// pages/api/quotation/[id].js
import  {getQuotationDetail}  from "lib/models/quotations";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "GET") {
    const order = await getQuotationDetail(id);
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ message: "Quotation Not Found" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
