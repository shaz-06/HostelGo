const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  const bevCount = await Product.countDocuments({ category: "Beverages" });
  const coldCount = await Product.countDocuments({ category: "Cold Drinks & Juices" });
  const newCount = await Product.countDocuments({ category: "Drinks, Juice & More" });

  console.log("Beverages count:", bevCount);
  console.log("Cold Drinks & Juices count:", coldCount);
  console.log("Drinks, Juice & More count:", newCount);

  process.exit(0);
}

main();
