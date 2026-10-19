const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  const fruitJuicesBev = await Product.countDocuments({ category: "Beverages", subCategory: "Fruit Juices" });
  const softDrinksBev = await Product.countDocuments({ category: "Beverages", subCategory: "Soft Drinks" });
  
  console.log("Beverages with subCategory 'Fruit Juices':", fruitJuicesBev);
  console.log("Beverages with subCategory 'Soft Drinks':", softDrinksBev);

  const distinctSubs = await Product.distinct("subCategory", { category: "Beverages" });
  console.log("Distinct subcategories for 'Beverages':", distinctSubs);

  process.exit(0);
}

main();
