require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Category = require("./models/Category");

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const productIndexes = await Product.collection.indexes();
    console.log("\n=== Product Indexes ===");
    console.log(JSON.stringify(productIndexes, null, 2));

    const categoryIndexes = await Category.collection.indexes();
    console.log("\n=== Category Indexes ===");
    console.log(JSON.stringify(categoryIndexes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTest();
