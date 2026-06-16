const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const DeliveryServiceZone = require("./models/DeliveryServiceZone");
const UnserviceableRequest = require("./models/UnserviceableRequest");

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function runTests() {
  console.log("=== RUNNING DELIVERY ZONES INTEGRATION TESTS (CJS) ===");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Clean up
    await DeliveryServiceZone.deleteMany({ name: /Test Zone/ });
    await UnserviceableRequest.deleteMany({ name: /Test User/ });

    // Test 1: Create Zone
    const testZone = new DeliveryServiceZone({
      name: "Test Zone Yelahanka",
      address: "Yelahanka, Bengaluru",
      latitude: 13.1007,
      longitude: 77.5963,
      radiusKm: 3,
      active: true
    });
    await testZone.save();
    console.log("✅ Test 1 Passed: DeliveryServiceZone created.");

    // Test 2: Calculate Distance
    const serviceableLat = 13.1100; // ~1.05 KM away
    const serviceableLng = 77.5960;
    const distance1 = haversineDistance(testZone.latitude, testZone.longitude, serviceableLat, serviceableLng);
    console.log(`Distance for serviceable point: ${distance1.toFixed(2)} KM`);
    if (distance1 <= testZone.radiusKm) {
      console.log("✅ Test 2 Passed: Point is correctly recognized as serviceable.");
    } else {
      throw new Error("Serviceable point calculation failed.");
    }

    // Test 3: Unserviceable Distance
    const unserviceableLat = 13.1500; // ~5.5 KM away
    const unserviceableLng = 77.5960;
    const distance2 = haversineDistance(testZone.latitude, testZone.longitude, unserviceableLat, unserviceableLng);
    console.log(`Distance for unserviceable point: ${distance2.toFixed(2)} KM`);
    if (distance2 > testZone.radiusKm) {
      console.log("✅ Test 3 Passed: Point is correctly recognized as unserviceable.");
    } else {
      throw new Error("Unserviceable point calculation failed.");
    }

    // Test 4: Create Unserviceable Waitlist Request
    const waitlistReq = new UnserviceableRequest({
      name: "Test User John",
      email: "john@example.com",
      phone: "9876543210",
      address: "Outside range address",
      latitude: unserviceableLat,
      longitude: unserviceableLng
    });
    await waitlistReq.save();
    console.log("✅ Test 4 Passed: UnserviceableRequest created successfully.");

    // Test 5: Fetch waitlist requests
    const requests = await UnserviceableRequest.find({ name: "Test User John" });
    if (requests.length > 0) {
      console.log("✅ Test 5 Passed: Successfully retrieved waitlist request from DB.");
    } else {
      throw new Error("Failed to retrieve waitlist request.");
    }

    // Cleanup again
    await DeliveryServiceZone.deleteMany({ name: /Test Zone/ });
    await UnserviceableRequest.deleteMany({ name: /Test User/ });
    console.log("Database cleaned up.");

    console.log("=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===");
  } catch (err) {
    console.error("❌ TEST RUN FAILED:", err);
  } finally {
    await mongoose.connection.close();
  }
}

runTests();
