const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Category = require("./models/Category");
const Product = require("./models/Product");

const categoryName = "Drinks, Juice & More";
const subCategoryName = "Zero Sugar";
const defaultImage = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop";

const productsToAdd = [
  { name: "Monster Zero Sugar Ultra Energy Drink", price: 749, weight: "350 ml * 6" },
  { name: "Diet Coke Diets & Lights", price: 50, weight: "330 ml" },
  { name: "Sprite Zero Lime Soft Drink", price: 40, weight: "750 ml" },
  { name: "Coca-Cola Zero Sugar Soft Drink", price: 40, weight: "750 ml" },
  { name: "Pepsi Zero Sugar Soft Drinks", price: 40, weight: "300 ml" },
  { name: "Red Bull Energy Drink (Sugar Free)", price: 125, weight: "250 ml" },
  { name: "Thums Up Xforce Soft Drink", price: 40, weight: "750 ml" },
  { name: "7Up Zero Lime Soft Drink", price: 40, weight: "750 ml" },
  { name: "Paper Boat Zero Sugar Peach Sparkling Drink", price: 60, weight: "600 ml" },
  { name: "Paper Boat Zero Dark Roast Coffee Sparkling Drink (Sugar Free)", price: 60, weight: "600 ml" },
  { name: "Coca-Cola Light Soft Drink", price: 220, weight: "320 ml" },
  { name: "7Up Zero Lime Soft Drink", price: 100, weight: "2.25 litre" },
  { name: "Bindu Salt Soda", price: 100, weight: "200 ml * 10" },
  { name: "Coca-Cola Diet Coke Soft Drink No Caffeine", price: 220, weight: "330 ml" },
  { name: "Coca-Cola Plus Soft Drink", price: 220, weight: "320 ml" }
];

function getBrand(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("monster")) return "Monster";
  if (lowerName.includes("coke") || lowerName.includes("coca-cola") || lowerName.includes("diet coke")) return "Coca-Cola";
  if (lowerName.includes("sprite")) return "Sprite";
  if (lowerName.includes("pepsi")) return "Pepsi";
  if (lowerName.includes("red bull")) return "Red Bull";
  if (lowerName.includes("thums up")) return "Thums Up";
  if (lowerName.includes("7up")) return "7Up";
  if (lowerName.includes("paper boat")) return "Paper Boat";
  if (lowerName.includes("bindu")) return "Bindu";
  return "Other";
}

function generateSlug(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // 1. Locate the existing "Drinks, Juice & More" category
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      console.error(`❌ Category "${categoryName}" does not exist in MongoDB! Stopping execution.`);
      process.exit(1);
    }
    console.log(`Located existing Category: "${categoryName}", ID: ${category._id}`);

    // 2. Iterate and insert products idempotently
    let insertedCount = 0;
    let verifiedCount = 0;

    for (let i = 0; i < productsToAdd.length; i++) {
      const pData = productsToAdd[i];
      
      // Match key: name, category, subCategory, weight, and price
      const existingProduct = await Product.findOne({
        name: pData.name,
        category: categoryName,
        subCategory: subCategoryName,
        weight: pData.weight,
        price: pData.price
      });

      if (existingProduct) {
        verifiedCount++;
        continue;
      }

      // Generate a unique ID using sequence
      const id = `zero_sugar_added_${5000 + i}`;
      const brand = getBrand(pData.name);
      
      // Follow conventions for originalPrice (give a ~10-15% discount representation)
      const originalPrice = pData.price <= 50 ? pData.price + 5 : Math.round(pData.price * 1.15);

      const newProduct = new Product({
        id,
        name: pData.name,
        category: categoryName,
        subCategory: subCategoryName,
        subcategory: "",
        tags: [
          "beverages",
          "zero sugar",
          "sugar free",
          "drinks, juice & more",
          ...pData.name.toLowerCase().split(/[\s,()_+&-\/]+/).filter(w => w.length > 2)
        ],
        isTrending: false,
        price: pData.price,
        originalPrice: originalPrice,
        weight: pData.weight,
        stock: 50,
        image: defaultImage,
        section: "cold-drinks",
        brand: brand,
        description: `${pData.name}. Zero sugar formulation, sourced fresh and packed under strict hygiene conditions.`,
        eta: "30 MINS",
        isAd: false,
        slug: generateSlug(pData.name),
        variants: []
      });

      await newProduct.save();
      insertedCount++;
    }

    console.log("Seeding process finished.");
    console.log(`Total Products Inserted: ${insertedCount}`);
    console.log(`Total Products Already Existing / Verified: ${verifiedCount}`);
    console.log(`Final Database State - Category ID: ${category._id}`);

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

main();
