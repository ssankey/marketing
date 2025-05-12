
import cron from "node-cron";
import fetch from "node-fetch";

cron.schedule("*/5 * * * *", async () => {
  console.log("⏰ Running order confirmation job...");

  try {
    // Call the order confirmation API
    const orderConfRes = await fetch(
      "http://localhost:3001/api/email/sendOrderConfirmation",
      {
        method: "POST",
      }
    );

    const orderConfResult = await orderConfRes.json();
    if (!orderConfRes.ok)
      throw new Error(
        orderConfResult.message || "Failed to connect to order confirmation API"
      );

    console.log(
      "Order confirmation cron job ran successfully",
      orderConfResult.message
    );

    // Now also call the dispatched notification API
    const dispatchRes = await fetch(
      "http://localhost:3001/api/email/dispatched",
      {
        method: "POST",
      }
    );

    const dispatchResult = await dispatchRes.json();
    if (!dispatchRes.ok)
      throw new Error(
        dispatchResult.message || "Failed to connect to dispatch API"
      );

    console.log(
      "Dispatch notification cron job ran successfully",
      dispatchResult.message
    );
  } catch (error) {
    console.error("❌ Cron Job Error:", error.message);
  }
});