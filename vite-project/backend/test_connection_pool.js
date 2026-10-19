require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const Product = require("./models/Product");
const Category = require("./models/Category");
const { aggregateHomepageSections } = require("./controllers/aggregationController");

const runLatencyTest = async () => {
  // 1. Initial Connection
  const startConnect = performance.now();
  await mongoose.connect(process.env.MONGODB_URI);
  const connectMs = performance.now() - startConnect;
  console.log(`Initial MongoDB Connection: ${connectMs.toFixed(2)}ms`);

  // Mock Request/Response for aggregationController
  const mockReq = { query: {} };
  let responseData;
  const mockRes = {
    json: (data) => { responseData = data; }
  };

  // 2. First Query (Cold connection pool / Cache MISS simulation)
  // Let's do a raw Product query first to test pool checkout
  const startFirstQuery = performance.now();
  await Product.findOne({}).lean();
  const firstQueryMs = performance.now() - startFirstQuery;
  console.log(`First Query (Cold): ${firstQueryMs.toFixed(2)}ms`);

  // 3. Second Query (Warm connection pool)
  const startSecondQuery = performance.now();
  await Product.findOne({}).lean();
  const secondQueryMs = performance.now() - startSecondQuery;
  console.log(`Second Query (Warm): ${secondQueryMs.toFixed(2)}ms`);

  // 4. Test actual /api/home aggregation method (which has caching inside it)
  // We'll bypass the redis/memory cache by passing a random bypass flag if possible, 
  // or we can just measure the aggregateHomepageSections function directly.
  
  // aggregateHomepageSections caches internally. We'll measure the first time (miss).
  const startHomeMiss = performance.now();
  await aggregateHomepageSections(mockReq, mockRes);
  const homeMissMs = performance.now() - startHomeMiss;
  console.log(`/api/home Internal Call (MISS): ${homeMissMs.toFixed(2)}ms`);

  // Measure the second time (hit)
  const startHomeHit = performance.now();
  await aggregateHomepageSections(mockReq, mockRes);
  const homeHitMs = performance.now() - startHomeHit;
  console.log(`/api/home Internal Call (HIT): ${homeHitMs.toFixed(2)}ms`);

  process.exit(0);
};

runLatencyTest();
