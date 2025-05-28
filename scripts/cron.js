import dotenv from "dotenv";
import path from "path";

import { fileURLToPath } from "url";

// ES Module workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root of project
dotenv.config({ path: path.join(__dirname, "..", ".env") });

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

    const dispatchRes = await fetch(`${API_BASE_URL}/api/email/dispatched`, {
      method: "POST",
    });
    const dispatchResult = await dispatchRes.json();
    if (!dispatchRes.ok)
      throw new Error(dispatchResult.message || "Dispatch API error");
    console.log("✅ Dispatch Notification:", dispatchResult.message);
  } catch (error) {
    console.error("❌ Cron Job Error:", error.message);
  }
});


// import dotenv from "dotenv";
// import path from "path";
// import cron from "node-cron";
// import fetch from "node-fetch";

// // Load environment variables first
// const envPath = path.resolve(process.cwd(), ".env");
// console.log(`Loading .env from: ${envPath}`);
// console.log(`Using API_BASE_URL: ${API_BASE_URL}`);


// const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
// console.log(Using API_BASE_URL: ${API_BASE_URL});

// cron.schedule("*/5 * * * *", async () => {
//   console.log("⏰ Running cron job...");

//   try {
//     // Add headers to the request
//     const options = {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Accept": "application/json"
//       }
//     };

//  const orderConfRes = await fetch(
//   `${API_BASE_URL}/api/email/sendOrderConfirmation`,
//   options
// );

    
//     if (!orderConfRes.ok) {
//       const errorText = await orderConfRes.text();
//       throw new Error(`Order API error: ${orderConfRes.status} - ${errorText}`);
//     }
    
//     const orderConfResult = await orderConfRes.json();
//     console.log("✅ Order Confirmation:", orderConfResult.message);

//     // Similar updates for the dispatch endpoint
//     const dispatchRes = await fetch(
//   `${API_BASE_URL}/api/email/dispatched`,
//   options
// );
    
//     if (!dispatchRes.ok) {
//       const errorText = await dispatchRes.text();
//       throw new Error(`Dispatch API error: ${dispatchRes.status} - ${errorText}`);
//     }
    
//     const dispatchResult = await dispatchRes.json();
//     console.log("✅ Dispatch Notification:", dispatchResult.message);
//   } catch (error) {
//     console.error("❌ Cron Job Error:", error.message);
//     // Log the full error stack for debugging
//     console.error(error.stack);
//   }
// });