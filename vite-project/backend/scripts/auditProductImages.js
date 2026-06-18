const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Product = require("../models/Product");

async function runAudit() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("Error: MONGODB_URI not found in backend/.env");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    const totalProducts = await Product.countDocuments({});
    
    // Find products with images
    const productsWithImages = await Product.find({
      image: { $exists: true, $ne: null, $ne: "" }
    });
    
    const countWithImages = productsWithImages.length;
    const countWithoutImages = totalProducts - countWithImages;

    // Category breakdown
    const categories = await Product.distinct("category");
    const categoryBreakdown = {};

    for (const category of categories) {
      const catTotal = await Product.countDocuments({ category });
      const catWithImg = await Product.countDocuments({
        category,
        image: { $exists: true, $ne: null, $ne: "" }
      });
      categoryBreakdown[category || "Uncategorized"] = {
        total: catTotal,
        withImage: catWithImg,
        withoutImage: catTotal - catWithImg
      };
    }

    console.log("\n=================================");
    console.log("     PRODUCT IMAGE AUDIT REPORT  ");
    console.log("=================================");
    console.log(`Total Products:   ${totalProducts}`);
    console.log(`With Images:      ${countWithImages}`);
    console.log(`Without Images:   ${countWithoutImages}`);
    console.log("=================================");
    console.log("\nCategory Breakdown:");
    
    for (const [cat, stats] of Object.entries(categoryBreakdown)) {
      console.log(`- ${cat}:`);
      console.log(`  Total:          ${stats.total}`);
      console.log(`  With Image:     ${stats.withImage}`);
      console.log(`  Without Image:  ${stats.withoutImage}`);
    }
    console.log("=================================");
    
  } catch (err) {
    console.error("Audit failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runAudit();
