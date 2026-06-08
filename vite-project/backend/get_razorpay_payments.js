const Razorpay = require("razorpay");
require("dotenv").config({ path: "../backend/.env" });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function run() {
  try {
    console.log("Fetching payments from Razorpay...");
    const response = await razorpay.payments.all({
      count: 10
    });
    console.log("=== LATEST PAYMENTS FROM RAZORPAY ===");
    if (response.items && response.items.length > 0) {
      for (const item of response.items) {
        console.log(`Payment ID: ${item.id}`);
        console.log(`  Amount: ${item.amount / 100} ${item.currency}`);
        console.log(`  Status: ${item.status}`);
        console.log(`  Method: ${item.method}`);
        console.log(`  Error Code: ${item.error_code}`);
        console.log(`  Error Description: ${item.error_description}`);
        console.log(`  Error Source: ${item.error_source}`);
        console.log(`  Error Step: ${item.error_step}`);
        console.log(`  Error Reason: ${item.error_reason}`);
        console.log(`  Created At: ${new Date(item.created_at * 1000).toISOString()}`);
        console.log("--------------------------------------");
      }
    } else {
      print("No payments found.");
    }
  } catch (error) {
    console.error("Error fetching payments:", error);
  }
}

run();
