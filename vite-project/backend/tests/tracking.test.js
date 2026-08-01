const mongoose = require("mongoose");
const assert = require("assert");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const Order = require("../models/Order");
const { generateRoute, getDistance } = require("../services/routeGenerator");
const { calculateBearing, getStage, calculateTrackingState, getProgressFraction } = require("../services/movementEngine");
const trackingService = require("../services/trackingService");

async function runTests() {
  console.log("🚀 Starting Live Order Tracking Test Suite...");

  try {
    // 1. Test Distance & Route Generation
    console.log("\n🧪 Test 1: Route Generation and Distance...");
    const storeLat = 13.0835363;
    const storeLng = 77.6403678;
    const customerLat = 13.0900;
    const customerLng = 77.6500;

    const dist = getDistance(storeLat, storeLng, customerLat, customerLng);
    assert.ok(dist > 0, "Distance should be positive");
    console.log(`Calculated Distance: ${dist.toFixed(2)} km`);

    const route = generateRoute(storeLat, storeLng, customerLat, customerLng);
    assert.ok(route.length >= 40 && route.length <= 80, `Route should have 40-80 waypoints, got ${route.length}`);
    assert.strictEqual(route[0].lat, storeLat, "Route should start at store latitude");
    assert.strictEqual(route[0].lng, storeLng, "Route should start at store longitude");
    assert.strictEqual(route[route.length - 1].lat, customerLat, "Route should end at customer latitude");
    assert.strictEqual(route[route.length - 1].lng, customerLng, "Route should end at customer longitude");
    console.log("✅ Route generation and distance tests passed.");

    // 2. Test Movement Curve and Bearing
    console.log("\n🧪 Test 2: Movement Profile & Bearing Angle...");
    const bearing = calculateBearing(13.0, 77.0, 14.0, 78.0);
    assert.ok(bearing >= 0 && bearing <= 360, "Bearing should be between 0 and 360 degrees");
    console.log(`Calculated Bearing: ${bearing} degrees`);

    // Verify speed profile fractions
    assert.strictEqual(getProgressFraction(0), 0, "Progress at f=0 must be 0");
    assert.strictEqual(getProgressFraction(1), 1, "Progress at f=1 must be 1");
    
    // Check speed profile curve points
    const accVal = getProgressFraction(0.1);
    const cruiseVal = getProgressFraction(0.5);
    const slowVal = getProgressFraction(0.8);
    const easeVal = getProgressFraction(0.95);

    assert.ok(accVal < cruiseVal, "Progress at 10% must be less than 50%");
    assert.ok(cruiseVal < slowVal, "Progress at 50% must be less than 80%");
    assert.ok(slowVal < easeVal, "Progress at 80% must be less than 95%");
    console.log("✅ Movement profile and bearing tests passed.");

    // 3. Test Tracking State Engine
    console.log("\n🧪 Test 3: Tracking State Calculations...");
    const assignedAt = Date.now() - 5 * 60 * 1000; // 5 mins ago
    const estimatedDeliveryTime = Date.now() + 5 * 60 * 1000; // 5 mins from now

    const state = calculateTrackingState(assignedAt, estimatedDeliveryTime, route, Date.now());
    assert.ok(state.progress > 0 && state.progress < 100, `Progress should be in between 0 and 100, got ${state.progress}%`);
    assert.ok(state.etaMinutes > 0, `ETA minutes should be greater than 0, got ${state.etaMinutes}`);
    assert.ok(state.currentLocation.lat !== 0, "Current lat should not be 0");
    assert.ok(state.currentLocation.lng !== 0, "Current lng should not be 0");
    console.log(`Calculated Progress: ${state.progress}%, Stage: ${state.stage}, Location: (${state.currentLocation.lat.toFixed(5)}, ${state.currentLocation.lng.toFixed(5)})`);
    console.log("✅ Tracking state calculation tests passed.");

    // 4. Test Mongoose Session Initialization
    console.log("\n🧪 Test 4: Mongoose Session Initialization...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database for session persistence tests.");

    const testOrder = new Order({
      orderId: "BUY260726000000",
      user: {
        name: "Test Tracking User",
        phone: "9876543222",
        location: "Test Hostel"
      },
      products: [],
      totalAmount: 100,
      paymentMethod: "cod",
      paymentStatus: "Pending",
      deliveryAddress: "Test Customer Address",
      deliveryLatitude: customerLat,
      deliveryLongitude: customerLng
    });
    await testOrder.save();

    // Start tracking session
    await trackingService.startSession(testOrder.orderId);
    
    const reloadedOrder = await Order.findOne({ orderId: testOrder.orderId });
    assert.strictEqual(reloadedOrder.trackingSessionActive, true, "trackingSessionActive should be true");
    assert.strictEqual(reloadedOrder.orderStatus, "Rider Assigned", "Status should be Rider Assigned");
    assert.ok(reloadedOrder.simulatedRoute.length > 0, "Stored simulated route should not be empty");
    
    // Stop session for cleanup
    trackingService.stopSession(testOrder.orderId);
    console.log("✅ Mongoose tracking session start and persistence passed.");

    // Cleanup
    await Order.deleteOne({ orderId: testOrder.orderId });
    await mongoose.disconnect();
    console.log("\n🎉 All Live Order Tracking tests passed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Test Suite Failed:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

runTests();
