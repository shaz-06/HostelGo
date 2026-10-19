require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Category = require("./models/Category");

const syncIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("Syncing Product indexes...");
    await Product.syncIndexes();
    console.log("Product indexes synced");

    console.log("Syncing Category indexes...");
    await Category.syncIndexes();
    console.log("Category indexes synced");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

syncIndexes();
