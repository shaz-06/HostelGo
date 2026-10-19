const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Category = require("./models/Category");
const Product = require("./models/Product");

const categoryName = "Drinks, Juice & More";
const subCategoryName = "Soft Drinks";
const defaultImage = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop";

const productsToAdd = [
  { name: "Diet Coke Diets & Lights", price: 50, weight: "330 ml" },
  { name: "Coco-cola Soft Drink", price: 40, weight: "750 ml" },
  { name: "Sprite Lime Flavoured Soft Drink", price: 40, weight: "750 ml" },
  { name: "Thums Up Soft Drink", price: 40, weight: "750 ml" },
  { name: "Thums Up Soft Drink - Pack of 8", price: 160, weight: "250 ml * 8" },
  { name: "Sprite Zero Lime Soft Drink", price: 40, weight: "750 ml" },
  { name: "Pepsi Soft Drink", price: 40, weight: "750 ml" },
  { name: "Coca-Cola Sift Drink Can", price: 40, weight: "300 ml" },
  { name: "Coca-Cola Zero Sugar Soft Drink", price: 40, weight: "750 ml" },
  { name: "7UP Nimbooz with Lemon Juice", price: 25, weight: "350 ml" },
  { name: "Coca-Cola Zero Sugar Soft Drink", price: 40, weight: "300 ml" },
  { name: "Pepsi Zero Sugar Soft Drink", price: 40, weight: "300 ml" },
  { name: "Sprite Lime Soft Drink", price: 90, weight: "2.25 litre" },
  { name: "Mountain Dew Grip Soft Drink", price: 40, weight: "750 ml" },
  { name: "Thums Up Soft Drink", price: 40, weight: "300 ml" },
  { name: "Appy Fizz Sparkling Drink (Apple Flavoured)", price: 40, weight: "600 ml" },
  { name: "Appy Fizz Sparkling Drnk (Apple Flavoured)", price: 60, weight: "1 litre" },
  { name: "Limca Lemon 'N' Lime Soft Drink", price: 40, weight: "750 ml" },
  { name: "Coca-Cola Soft Drink", price: 90, weight: "2.25 litre" },
  { name: "Fanta Orange Soft Drink", price: 40, weight: "750 ml" },
  { name: "Coca-Cola Original Taste Soft Drink - Pack of 8", price: 160, weight: "250 ml" },
  { name: "Coca-Cola Soft Drink", price: 70, weight: "1.25 litre" },
  { name: "Sprite Lime Soft Drink", price: 70, weight: "1.25 litre" },
  { name: "Bindu Fizz Jeera Carbonated Masala Soda", price: 20, weight: "300 ml" },
  { name: "Bindu Fizz Jeera Carbonated Masala Soda", price: 40, weight: "600 ml" },
  { name: "Sprite Lime Softe Drink Can", price: 40, weight: "300 ml" },
  { name: "Paper Boat Zero Sugar Sparkling Coffee (Dark Roast)", price: 40, weight: "300 ml" },
  { name: "Fanta Orange SOft Drink", price: 90, weight: "2.25 litre" },
  { name: "Coca-Cola Light Soft Drink", price: 220, weight: "320 ml" },
  { name: "Mirinda Orange Soft Drink", price: 100, weight: "1.25 litre" },
  { name: "Mirinda Orange Soft Drink", price: 50, weight: "1.25 litre" },
  { name: "Bindu Jeera Masala Soda", price: 100, weight: "Pack of 10" },
  { name: "Mirinda Soft Drink Can", price: 40, weight: "300 ml" },
  { name: "Dobra Blueberry Goli Soda", price: 75, weight: "225 ml" },
  { name: "Bindu Salt Soda", price: 100, weight: "200ml * 10" },
  { name: "Coca-Cola Diet Coke Soft Drink No Caffeine", price: 220, weight: "330 ml" },
  { name: "Coca-Cola Vanilla Soft Drink", price: 199, weight: "320 ml" }
];

function getBrand(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("paper boat")) return "Paper Boat";
  if (lowerName.includes("sprite")) return "Sprite";
  if (lowerName.includes("coca-cola") || lowerName.includes("coke") || lowerName.includes("coco-cola")) return "Coca-Cola";
  if (lowerName.includes("thumbs up") || lowerName.includes("thums up")) return "Thums Up";
  if (lowerName.includes("pepsi")) return "Pepsi";
  if (lowerName.includes("fanta")) return "Fanta";
  if (lowerName.includes("7up")) return "7Up";
  if (lowerName.includes("appy fizz") || lowerName.includes("appy")) return "Appy";
  if (lowerName.includes("limca")) return "Limca";
  if (lowerName.includes("mirinda")) return "Mirinda";
  if (lowerName.includes("bindu")) return "Bindu";
  if (lowerName.includes("dobra")) return "Dobra";
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

    // 1. Ensure Category "Drinks, Juice & More" exists exactly once
    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      console.log(`Category "${categoryName}" does not exist. Creating it...`);
      category = new Category({
        name: categoryName,
        icon: "🥤",
        image: "https://img.icons8.com/?size=100&id=_fo_sHSTUNz-&format=png&color=000000",
        priority: 4,
        showInHeader: true
      });
      await category.save();
      console.log(`Category created successfully. ID: ${category._id}`);
    } else {
      console.log(`Category "${categoryName}" already exists. ID: ${category._id}`);
    }

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
      const id = `soft_drinks_added_${3000 + i}`;
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
          "soft drinks",
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
