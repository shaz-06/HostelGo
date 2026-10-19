const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = fs.readFileSync(path.resolve(__dirname, "../scratch/new_products.txt"), "utf-8");

function parseLine(line) {
  let cleanLine = line.trim();
  if (!cleanLine.toLowerCase().startsWith("name:")) {
    cleanLine = "name:" + cleanLine;
  }

  const nameIdx = cleanLine.toLowerCase().indexOf("name:");
  const priceIdx = cleanLine.toLowerCase().indexOf("price:");
  const opIdx = cleanLine.toLowerCase().indexOf("originalprice:");
  const weightIdx = cleanLine.toLowerCase().indexOf("weight:");
  const brandIdx = cleanLine.toLowerCase().indexOf("brand:");

  const parts = [
    { key: "name", index: nameIdx, match: "name:" },
    { key: "price", index: priceIdx, match: "price:" },
    { key: "originalPrice", index: opIdx, match: "originalprice:" },
    { key: "weight", index: weightIdx, match: "weight:" },
    { key: "brand", index: brandIdx, match: "brand:" }
  ].filter(p => p.index !== -1).sort((a, b) => a.index - b.index);

  const result = {};
  for (let i = 0; i < parts.length; i++) {
    const start = parts[i].index + parts[i].match.length;
    const end = (i + 1 < parts.length) ? parts[i+1].index : cleanLine.length;
    let val = cleanLine.substring(start, end).trim();
    val = val.replace(/^[,\s]+|[,\s]+$/g, "").trim();
    result[parts[i].key] = val;
  }
  return result;
}

const lines = rawList.trim().split("\n").map(l => l.trim()).filter(Boolean);
const parsedProducts = [];

let currentCategory = "Makeup & Beauty";
let counter = 15000;

for (const line of lines) {
  if (line.toLowerCase() === "hair care") {
    currentCategory = "Hair Care";
    continue;
  }
  if (line.toLowerCase() === "bathing") {
    currentCategory = "Bath and Body";
    continue;
  }
  if (line.toLowerCase() === "feminine hygine" || line.toLowerCase() === "feminine hygiene") {
    currentCategory = "Female Hygiene";
    continue;
  }
  if (line.toLowerCase() === "pharmacy") {
    currentCategory = "Health and Pharma";
    continue;
  }

  const p = parseLine(line);
  if (!p.name) continue;

  let cleanName = p.name
    .replace(/\s+/g, " ")
    .trim();

  if (cleanName.endsWith(",")) {
    cleanName = cleanName.slice(0, -1).trim();
  }
  if (cleanName.startsWith(",")) {
    cleanName = cleanName.slice(1).trim();
  }

  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36).substring(4); // ensure unique slug

  const price = Number(p.price || 0);
  const originalPrice = p.originalPrice ? Number(p.originalPrice) : Math.round(price * 1.2);
  const brand = p.brand || "Other";

  const formatted = {
    id: `new_cat_${counter++}`,
    name: cleanName,
    category: currentCategory,
    subCategory: currentCategory,
    subcategory: "",
    tags: [
      currentCategory.toLowerCase(),
      brand.toLowerCase(),
      ...cleanName.toLowerCase().split(/[\s,()_+&\-/.*/]+/).filter(w => w.length > 2)
    ],
    isTrending: false,
    price: price,
    originalPrice: originalPrice,
    weight: p.weight || "1 pcs",
    stock: 50,
    image: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=500", // placeholder
    section: currentCategory.toLowerCase().replace(/\s/g, "_"),
    brand: brand,
    description: `${cleanName} by ${brand}. High quality product.`,
    eta: "15 MINS",
    isAd: false,
    variants: [],
    slug: slug
  };

  parsedProducts.push(formatted);
}

console.log(`Parsed ${parsedProducts.length} new products.`);

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("Database connection successful. Seeding database...");
      let inserted = 0;
      let skipped = 0;
      let errors = 0;
      for (const prod of parsedProducts) {
        try {
          const exists = await Product.findOne({ name: prod.name, weight: prod.weight });
          if (!exists) {
            await Product.create(prod);
            inserted++;
          } else {
            skipped++;
          }
        } catch (e) {
          console.error("Error inserting", prod.name, e.message);
          errors++;
        }
      }
      console.log(`Done! Inserted: ${inserted}, Skipped (duplicates): ${skipped}, Errors: ${errors}`);
      
      const count = await Product.countDocuments();
      console.log(`Total products in DB: ${count}`);
      
      const newCats = await Product.distinct('category');
      console.log('Categories present:', newCats);
      
      process.exit();
    })
    .catch(err => {
      console.error("Database connection/seeding failed:", err);
      process.exit(1);
    });
} else {
  console.log("MONGODB_URI not found");
}
