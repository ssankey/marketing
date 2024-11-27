

import { getCustomerDetail } from "lib/models/customers";
import { getCustomerPurchaseAndRevenue } from "lib/models/specific-customer";
import {
  getLastTenInvoices,
  getLastTenOrders,
  getLastTenQuotations,
} from "lib/models/latestten";

export default async function handler(req, res) {
  const { id, metrics, year, quotations, orders, invoices } = req.query;

  // Validate required parameters
  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Parse the year, default to the current year if not provided
    const yearValue = year ? parseInt(year, 10) : new Date().getFullYear();

    // Handle different query parameter actions
    if (quotations === "true") {
      const data = await getLastTenQuotations(id);
      return res.status(200).json(data || []);
    }

    if (orders === "true") {
      const data = await getLastTenOrders(id);
      return res.status(200).json(data || []);
    }

    if (invoices === "true") {
      const data = await getLastTenInvoices(id);
      return res.status(200).json(data || []);
    }

    if (metrics === "true") {
      const data = await getCustomerPurchaseAndRevenue(id, yearValue);
      return res.status(200).json(data || []);
    }

    // Fallback: Fetch customer details
    const customer = await getCustomerDetail(id);
    if (customer) {
      return res.status(200).json(customer);
    }

    // If no data found
    return res.status(404).json({ message: "Customer Not Found" });
  } catch (error) {
    console.error(`API Error [ID: ${id}]:`, error);
    return res.status(500).json({
      message: "Failed to process request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
