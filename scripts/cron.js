import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") }); // Load from root

import cron from "node-cron";
import fetch from "node-fetch";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

cron.schedule("*/5 * * * *", async () => {
  console.log("⏰ Running cron job...");

  try {
    const orderConfRes = await fetch(
      `${API_BASE_URL}/api/email/sendOrderConfirmation`,
      { method: "POST" }
    );
    const orderConfResult = await orderConfRes.json();
    if (!orderConfRes.ok)
      throw new Error(orderConfResult.message || "Order API error");
    console.log("✅ Order Confirmation:", orderConfResult.message);

    // const dispatchRes = await fetch(`${API_BASE_URL}/api/email/dispatched`, {
    //   method: "POST",
    // });
    // const dispatchResult = await dispatchRes.json();
    // if (!dispatchRes.ok)
    //   throw new Error(dispatchResult.message || "Dispatch API error");
    // console.log("✅ Dispatch Notification:", dispatchResult.message);
  } catch (error) {
    console.error("❌ Cron Job Error:", error.message);
  }
});
