require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Test exact category + sort
    let stats = await Product.find({ category: "The Veggie Store" }).sort({ price: 1 }).limit(20).explain("executionStats");
    console.log(`\n=== Exact Category + Price Sort ===`);
    console.log(`Winning Plan: ${JSON.stringify(stats.queryPlanner.winningPlan, null, 2)}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTest();
