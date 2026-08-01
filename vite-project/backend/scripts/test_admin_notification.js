require("dotenv").config();
const mongoose = require("mongoose");
const { sendNewOrderNotification } = require("../services/adminNotificationService");
const AdminDeviceToken = require("../models/AdminDeviceToken");

async function runTest() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI is not defined in backend/.env");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected.");

    // Seed test admin device token if not present
    let adminToken = await AdminDeviceToken.findOne({ phone: "**" });
    if (!adminToken) {
      console.log("Seeding test admin device token...");
      adminToken = await AdminDeviceToken.create({
        phone: "**",
        fcmTokens: ["mock_fcm_token_123"]
      });
    } else {
      console.log("Existing admin tokens:", adminToken.fcmTokens);
    }

    // Mock order object
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      user: {
        name: "Test Customer",
        phone: "9999999999",
        location: "Hostel A",
      },
      totalAmount: 499
    };

    console.log("Triggering sendNewOrderNotification...");
    await sendNewOrderNotification(mockOrder);
    console.log("Execution finished successfully.");

  } catch (err) {
    console.error("Error running diagnostic test:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTest();
