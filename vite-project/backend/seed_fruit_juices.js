const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Category = require("./models/Category");
const Product = require("./models/Product");

const categoryName = "Drinks, Juice & More";
const subCategoryName = "Fruit Juices";
const defaultImage = "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&auto=format&fit=crop";

const productsToAdd = [
  { name: "Maaza Mango Drink", price: 35, weight: "600 ml" },
  { name: "Mogu Mogu Lychee Fruit Drink with Nata De Coco", price: 70, weight: "320 ml" },
  { name: "7Up Nmbooz with Lemon Juice", price: 25, weight: "350 ml" },
  { name: "Minute Maid Pulpy Orange Fruit Drink", price: 90, weight: "1 litre" },
  { name: "Slice Mango Drink", price: 70, weight: "1.2 litre" },
  { name: "Paper Boat Nata De Coco Lychee Juice", price: 40, weight: "250 ml" },
  { name: "Mogu Mogu Grape Fruit Drink with Nata De Coco", price: 75, weight: "320 ml" },
  { name: "Mogu Mogu Blackcurrent Fruit Drink with Nata De Coco", price: 75, weight: "320 ml" },
  { name: "Mogu Mogu Mango Drink", price: 75, weight: "320 ml" },
  { name: "Mogu Mogu Strawberry Fruit Drink", price: 75, weight: "320 ml" },
  { name: "Real Fruit Power Cranberry Juice", price: 140, weight: "1 litre" },
  { name: "Maaza Mango Drink", price: 85, weight: "1.5 litre" },
  { name: "Paper Boat Aamras Mango Drink", price: 40, weight: "215 ml" },
  { name: "Paper Boat Swing Slurpy Mango Drink", price: 40, weight: "600 ml" },
  { name: "Real Fruit Power Alphonso Nectar Mango Drink", price: 200, weight: "1 litre" },
  { name: "Real Fruit Power Orange Juice", price: 125, weight: "1 litre" },
  { name: "Mogu Mogu Melon Fruit Drink withNata De Coco", price: 70, weight: "320 ml" },
  { name: "Poko Loko lychee Nata Juice", price: 70, weight: "300 ml" },
  { name: "Paper Boat Mixed Berries Juice", price: 40, weight: "250 ml" }
];

function getBrand(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("paper boat")) return "Paper Boat";
  if (lowerName.includes("maaza")) return "Maaza";
  if (lowerName.includes("mogu mogu")) return "Mogu Mogu";
  if (lowerName.includes("7up")) return "7Up";
  if (lowerName.includes("minute maid")) return "Minute Maid";
  if (lowerName.includes("slice")) return "Slice";
  if (lowerName.includes("real")) return "Real";
  if (lowerName.includes("poko loko")) return "Poko Loko";
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
      const id = `fruit_juices_added_${4000 + i}`;
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
          "fruit juices",
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
        description: `${pData.name}. Sourced fresh and packed under strict hygiene conditions. Sourced with high-quality standards.`,
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
