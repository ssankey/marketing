// lib/models/quotation.js


  import { getQuotationsList } from "../../../lib/models/quotations";
  import { parseISO, isValid } from "date-fns";

  function isValidDate(date) {
    return date && isValid(parseISO(date));
  }

  export default async function handler(req, res) {
    if (req.method === "GET") {
      try {
        const {
          page = 1,
          search = "",
          status = "all",
          sortField = "DocNum",
          sortDir = "desc",
          fromDate,
          toDate,
        } = req.query;

        const ITEMS_PER_PAGE = 20;

        // Validate and sanitize date filters
        const isFromDateValid = isValidDate(fromDate);
        const isToDateValid = isValidDate(toDate);

        // Fetch results from the model using the refined params
        const { totalItems, quotations } = await getQuotationsList({
          page,
          search,
          status,
          sortField,
          sortDir,
          fromDate: isFromDateValid ? fromDate : undefined,
          toDate: isToDateValid ? toDate : undefined,
          itemsPerPage: ITEMS_PER_PAGE,
        });

        // Format dates if needed
        const formattedQuotations = quotations.map((quotation) => ({
          ...quotation,
          DocDate: quotation.DocDate ? quotation.DocDate.toISOString() : null,
          DeliveryDate: quotation.DeliveryDate
            ? quotation.DeliveryDate.toISOString()
            : null,
        }));

        // Send the response
        res.status(200).json({
          quotations: Array.isArray(formattedQuotations)
            ? formattedQuotations
            : [],
          totalItems,
          currentPage: parseInt(page, 10),
        });
      } catch (error) {
        console.error("Error fetching quotations:", error);
        res.status(500).json({ error: "Failed to fetch quotations" });
      }
    } else {
      res.status(405).json({ message: "Method Not Allowed" });
    }
  }
