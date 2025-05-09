// //pages/api/cron-job/cron.mjs
// import cron from "node-cron";
// import fetch from "node-fetch";

// // Schedule: Every 5 minutes
// cron.schedule("*/5 * * * *", async () => {
//   console.log("⏰ Running order confirmation job...");

//   try {
//     const res = await fetch(
//       "http://localhost:3001/api/email/sendOrderConfirmation",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           docEntry: 1686,
//           docNum: 25710672,
//           toEmail: "chandraprakashyadav1110@gmail.com",
//         }),
//       }
//     );

//     const result = await res.json();
//     if (!res.ok) {
//       throw new Error(result.message || "Failed to send order mail");
//     }

//     console.log("✅ Email sent successfully:", result.message);
//   } catch (error) {
//     console.error("❌ Cron Job Error:", error.message);
//   }
// });



import cron from "node-cron";
import fetch from "node-fetch";

cron.schedule("*/5 * * * *", async () => {
  console.log("⏰ Running order confirmation job...");

  try {
    const res = await fetch(
      "http://localhost:3001/api/email/sendOrderConfirmation",
      {
        method: "POST",
      }
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to connect to API");

    console.log("Cron-job runned succesfully", result.message);
  } catch (error) {
    console.error("❌ Cron Job Error:", error.message);
  }
});
