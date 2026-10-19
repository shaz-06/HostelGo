require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    let stats = await Product.find({ 
      $and: [
        {
          $or: [
            { category: "The Veggie Store" },
            { category: "The Veggie Store".replace("&", "and") },
            { category: "The Veggie Store".replace("and", "&") }
          ]
        }
      ]
    }).sort({ price: 1 }).explain("executionStats");
    
    console.log(`Winning Plan: ${JSON.stringify(stats.queryPlanner.winningPlan, null, 2)}\n`);
    console.log(`Execution Time: ${stats.executionStats.executionTimeMillis}ms`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTest();
