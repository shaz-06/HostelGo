const Razorpay = require("razorpay");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "Loaded" : "Not Loaded");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function runTest() {
  try {
    const options = {
      amount: 100, // 1 INR in paisa
      currency: "INR",
      receipt: "receipt_test_123"
    };
    const order = await razorpay.orders.create(options);
    console.log("SUCCESS: Order created on Razorpay:", order);
  } catch (error) {
    console.error("ERROR: Failed to create order on Razorpay:", error);
  }
}

runTest();
