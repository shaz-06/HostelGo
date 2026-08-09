const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = `
name:Amul Taaza Toned Milk,price:30,weight:500 ml
name:Amul Gold Full Cream Milk,price:36,weight:500 ml
name:Amul Cow milk,price:31,weight:500 ml
name:Mother Dairy tonned Milk,price:30,weight:500 ml
name:Mother Dairy Cow Milk,price:31,weight:500 ml
name:Amul Taaza Homogenised Toned Milk,price:77,weight:1 liter
name:Amul Moti Tone Milk (90 Days Shelf Life),price:33,weight:450 ml
name:Amul Taaza Toned Milk - Pack of 2,price:34,weight:2 * 200 ml
name:Harvest Gold Atta WHole Wheat Bread,price:65,weight:450 g
name:English Oven Zero Maida Atta / Wheat Bread,price:60,weight:400 g
name:HAarvest Gold White Bread,price:65,weight:700 g
name:Harvest Gold Heartly Brown Bread,price:60,weight:400 g
name:English Oven Brown Bread,price:60,weight:400 g
name:The Health Factor Zero Maida Whole Wheat Bread,price:55,weight:250 g
name:English Oven Zero Maida Multigrain,price:70,weight:400 g
name:English Oven Premium White Bread,price:33,weight:350 g
name:English Oven Milk Bread,price:50,weight:400 g
name:Suchali's Artisan Bakehouse country Sourdough,price:150,weight:350 g
name:Harvest Gold Multigrain Bread,price:70,weight:450 g
name:English Oven Regular Burger Bun,price:55,weight:300 g
name:English Oven Pav,price:40,weight:250 g
name:English Oven Sandwitch White Bread,price:45,weight:400 g
name:Britannia Breakfast SOft slice White Bread,price:35,weight:350 g
name:The Health Factory Zero MAida Pizza Base,price:45,weight:140 g
name:Bonn Sesame Burger Bun Bread,price:40,weight:225 g
name:iD Malabar Paratha,price:113,weight:5 pcs
name:iD Wheat Laccha Paratha,price:115,weight:5 pcs
name:The Baker's Dozen Choco Chip Muffin Chocolate Cup Cake,price:45,weight:45 g
name:The Baker's Dozen High Protein Peanut Butter Cookies,price:105,weight:75 g
name:Simmply Malabar Parota,price:105,weight:5 pcs
name:The Baker's Dozen Pizza Base Sourdough Bread,price:89,weight:140 g
name:Caketale Fruit & Nutty Muffin,price:133,weight:6 pcs
name:iD WHole WHeat chapati,price:49,weight:6 pcs
name:The Baker's DOzen Elaichi Rusk (High Protein),price:40,weight:80 g
name:Table White White Eggs,price:140,weight:10 pcs
name:Table White Eggs,price:85,weight:6 pcs
name:Farm Made Free Range Eggs,price:159,weight:6 pcs
name:Licious Farm Fresh Classic WHite Protien Rich Eggs,price:106,weight:6 pcs
name:Nature Good White Eggs,price:90,weight:6 pcs
name:Farm Made Free Range Eggs,price:309,weight:12 pcs
name:Abhi Vitamin D3 White Protein Rich Eggs,price:175,weight:10 pcs
name:Licious Brwon Eggs,price:123,weight:6 pcs
name:Amul Masti Pouch Curd,price:35,weight:390 g
name:Country Delight Ghar Jaisa Cup Curd,price:69,weight:400 g
name:Mother Dairy Classic Cup Curd,price:25,weight:200 g
name:Mother Dairy Classic Pouch Curd,price:35,weight:390 g
name:Amul Masti Pouch Curd,price:80,weight:1 kg
name:Amul MAsti Cup Curd,price:25,weight:200 g
name:Amul Masti Cup Curd Tub,price:115,weight:1 kg
name:Epigamia Blueberry Flavoured Yogurt,price:60,weight:85 g
name:Epigamia Alphonso Mango Flavoured Greek Yogurt,price:60,weight:85 g
name:Epigamia Turbo Protein Yogurt,price:125,weight:140 g
name:Epigamia Mixed Berries Flavoured Greek Yogurt,price:70,weight:85 g
name:Mother Dairy Blueberry Flavoured Yogurt,price:35,weight:100 g
name:Country Delight Curd,price:99,weight:400 g
name:Epigamia Lactose Free CUp Curd,price:100,weight:400 g
name:Milky Mist Blueberry Flavoured Yogurt,price:40,weight:100 g
name:Milky Mist STrawberry Flavoured Yogurt,price:40,weight:100 g
name:Mother Dairy Mango Flavoured Yogurt,price:35,weight:100 g
name:Mother Dairy Raspberry Flavoured Yogurt,price:35,weight:100 g
name:Amul Greek Yogurt (Blueberry),price:45,weight:100 g
name:Amul Salted Butter,price:63,weight:100 g
name:Amul Cheese Slices,price:82,weight:100 g
name:Amul Blend Diced Cheese,price:125,weight:200 g
name:Amul Cheese CUbes,price:135,weight:200 g
name:Amul Unsalted Butter,price:65,weight:100 g
name:D'lecta Natural Feta CHeese Block,price:115,weight:100 g
name:Amul Spicy Garlic Cheese SPread,price:115,weight:200 g
name:Amul Yummy Plain Cheese Spread,price:115,weight:200 g
name:Amul Pizza Mozzarella Diced Cheese,price:550,weight:1 kg
name:Amul Cream Cheese,price:125,weight:180 g
name:Amul Cheese Block,price:129,weight:200 g
name:Amul Sour Cream,price:90,weight:200 g
name:Amul Salted Butter (Chiplets),price:80,weight:100 g
name:Amul Garlic and Herb Butter,price:75,weight:100 g
name:iD idli & Dosa Batter,price:72,weight:500 g
name:Amma's Special Dosa Idli Batter,price:99,weight:1 kg
name:Country Delight Idli Dosa Batter,price:61,weight:450 g
name:MTR RIce Idli Breakfast Mix,price:138,weight:500 g
name:iD Multigrain Idly & Dosa Batter,price:99,weight:500 g
name:Gladful Ragi Dosa Mix,price:99,weight:200 g
name:MTR Masala Rava Idli Breakfast Mix,price:133,weight:500 g
name:Khetika Sprouted Moong Chilla Batter,price:125,weight:1 kg
name:Organic Tattva Ragi Dosa Mix,price:60,weight:200g
name:Mother Dairy Paneer,price:95,weight:200g
name:Amul Fresh Malai Paneer,price:95,weight:200 g
`;

function parseLine(line) {
  let cleanLine = line.trim();
  if (!cleanLine.startsWith("name:")) {
    cleanLine = "name:" + cleanLine;
  }

  const nameIdx = cleanLine.indexOf("name:");
  const priceIdx = cleanLine.indexOf("price:");
  const weightIdx = cleanLine.indexOf("weight:");

  const parts = [
    { key: "name", index: nameIdx },
    { key: "price", index: priceIdx },
    { key: "weight", index: weightIdx }
  ].filter(p => p.index !== -1).sort((a, b) => a.index - b.index);

  const result = {};
  for (let i = 0; i < parts.length; i++) {
    const start = parts[i].index + parts[i].key.length + 1;
    const end = (i + 1 < parts.length) ? parts[i+1].index : cleanLine.length;
    let val = cleanLine.substring(start, end).trim();
    val = val.replace(/^[,\s]+|[,\s]+$/g, "").trim();
    result[parts[i].key] = val;
  }
  return result;
}

function getSubCategory(name) {
  const lower = name.toLowerCase();
  if (lower.includes("milk") && !lower.includes("shake")) return "Milk";
  if (lower.includes("curd") || lower.includes("yogurt") || lower.includes("sour cream")) return "Curd and Yogurts";
  if (lower.includes("egg")) return "Eggs";
  if (lower.includes("paneer") || lower.includes("tofu")) return "Paneer and Tofu";
  if (lower.includes("butter") && !lower.includes("peanut butter")) return "Butter";
  if (lower.includes("cheese")) return "Cheese";
  if (lower.includes("bread") || lower.includes("bun") || lower.includes("pav") || lower.includes("pizza base") || lower.includes("sourdough")) return "Bread and Buns";
  if (lower.includes("paratha") || lower.includes("parota") || lower.includes("chapati")) return "Indian Breads";
  if (lower.includes("muffin") || lower.includes("cup cake") || lower.includes("cookies") || lower.includes("rusk") || lower.includes("peanut butter")) return "Fresh Bakery";
  if (lower.includes("batter") || lower.includes("mix") || lower.includes("chilla")) return "Batters & Chutneys";
  return "Milk";
}

function getBrand(name) {
  const lower = name.toLowerCase();
  if (lower.includes("amul")) return "Amul";
  if (lower.includes("mother dairy")) return "Mother Dairy";
  if (lower.includes("harvest gold") || lower.includes("haarvest gold")) return "Harvest Gold";
  if (lower.includes("english oven")) return "English Oven";
  if (lower.includes("the health factory") || lower.includes("the health factor")) return "The Health Factory";
  if (lower.includes("suchali")) return "Suchali's Artisan Bakehouse";
  if (lower.includes("britannia")) return "Britannia";
  if (lower.includes("bonn")) return "Bonn";
  if (lower.includes("id ")) return "iD Fresh";
  if (lower.includes("the baker's dozen")) return "The Baker's Dozen";
  if (lower.includes("caketale")) return "Caketale";
  if (lower.includes("table white")) return "Table White";
  if (lower.includes("farm made")) return "Farm Made";
  if (lower.includes("licious")) return "Licious";
  if (lower.includes("nature good")) return "Nature Good";
  if (lower.includes("abhi")) return "Abhi";
  if (lower.includes("country delight")) return "Country Delight";
  if (lower.includes("epigamia")) return "Epigamia";
  if (lower.includes("milky mist")) return "Milky Mist";
  if (lower.includes("d'lecta")) return "D'lecta";
  if (lower.includes("amma's")) return "Amma's";
  if (lower.includes("mtr")) return "MTR";
  if (lower.includes("gladful")) return "Gladful";
  if (lower.includes("khetika")) return "Khetika";
  if (lower.includes("organic tattva")) return "Organic Tattva";
  
  // Default fallback
  const firstWord = name.split(" ")[0];
  return firstWord || "Other";
}

function getProductImage(subCategory) {
  const images = {
    "Milk": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "Eggs": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500",
    "Curd and Yogurts": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500",
    "Paneer and Tofu": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500",
    "Butter": "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=500",
    "Cheese": "https://images.unsplash.com/photo-1486887396153-fa416525c108?w=500",
    "Bread and Buns": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
    "Indian Breads": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500",
    "Fresh Bakery": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
    "Batters & Chutneys": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500"
  };
  return images[subCategory] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500";
}

const lines = rawList.trim().split("\n").map(l => l.trim()).filter(Boolean);
const parsedProducts = [];

let counter = 9000;
for (const line of lines) {
  const p = parseLine(line);
  if (!p.name) continue;

  const category = "Dairy, Bread & Eggs";
  const subCategory = getSubCategory(p.name);
  const brand = getBrand(p.name);
  
  let cleanName = p.name
    .replace(/\s+/g, " ")
    .replace(/HAarvest/g, "Harvest")
    .replace(/tonned/g, "Toned")
    .replace(/tonned/g, "Toned")
    .replace(/WHole/g, "Whole")
    .replace(/WHeat/g, "Wheat")
    .replace(/Sandwitch/g, "Sandwich")
    .replace(/SOft/g, "Soft")
    .replace(/MAida/g, "Maida")
    .replace(/Brwon/g, "Brown")
    .replace(/CUp/g, "Cup")
    .replace(/STrawberry/g, "Strawberry")
    .replace(/CHeese/g, "Cheese")
    .replace(/SPread/g, "Spread")
    .replace(/DOzen/g, "Dozen")
    .trim();

  // If cleanName ends with a comma, remove it
  if (cleanName.endsWith(",")) {
    cleanName = cleanName.slice(0, -1).trim();
  }

  // Remove leading comma or bad chars
  if (cleanName.startsWith(",")) {
    cleanName = cleanName.slice(1).trim();
  }

  // Helper to generate a URL friendly slug
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const formatted = {
    id: `dbe_new_${counter++}`,
    name: cleanName,
    category: category,
    subCategory: subCategory,
    subcategory: "",
    tags: [
      category.toLowerCase(), 
      subCategory.toLowerCase(), 
      brand.toLowerCase(),
      ...cleanName.toLowerCase().split(/[\s,()_+&-\/.*]+/).filter(w => w.length > 2)
    ],
    isTrending: false,
    price: Number(p.price || 0),
    originalPrice: Math.round(Number(p.price || 0) * 1.2), // 20% markup default
    weight: p.weight || "500 ml",
    stock: 50,
    image: getProductImage(subCategory),
    section: "dairy",
    brand: brand,
    description: `${cleanName}. Sourced fresh and handled with strict quality and hygiene standards.`,
    eta: "15 MINS",
    isAd: false,
    variants: [],
    slug: slug
  };

  parsedProducts.push(formatted);
}

console.log(`Parsed ${parsedProducts.length} new products.`);

const seedFilePath = path.resolve(__dirname, "seed.js");
const existingProducts = require("./seed");
console.log(`Loaded ${existingProducts.length} existing products from seed.js.`);

// To avoid duplicate adding if run multiple times, filter out if same name + weight already exists
const existingKeys = new Set(existingProducts.map(p => `${(p.name || "").toLowerCase().trim()}_${(p.weight || "").toLowerCase().trim()}`));
const newProductsToSeed = parsedProducts.filter(p => !existingKeys.has(`${(p.name || "").toLowerCase().trim()}_${(p.weight || "").toLowerCase().trim()}`));

console.log(`Of the parsed products, ${newProductsToSeed.length} are new.`);

if (newProductsToSeed.length > 0) {
  const allProducts = [...existingProducts, ...newProductsToSeed];
  console.log(`Total products will be ${allProducts.length} in seed.js.`);

  const newSeedContent = `const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const products = ${JSON.stringify(allProducts, null, 2)};

module.exports = products;

if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("MongoDB Connected");
      await Product.deleteMany();
      await Product.insertMany(products);
      console.log("Products Added Successfully");
      process.exit();
    })
    .catch((err) => console.log(err));
}
`;

  fs.writeFileSync(seedFilePath, newSeedContent, "utf8");
  console.log("seed.js updated successfully with the new products.");
} else {
  console.log("No new products to add to seed.js.");
}

// Now upload directly to MongoDB to ensure database is in sync!
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("Database connection successful. Seeding database...");
      
      // Re-require seed to get the updated set
      decache("./seed");
      const updatedSeed = require("./seed");
      await Product.deleteMany();
      await Product.insertMany(updatedSeed);
      console.log(`Database Seeding Successful! Total ${updatedSeed.length} products uploaded to MongoDB.`);
      process.exit();
    })
    .catch(err => {
      console.error("Database connection/seeding failed:", err);
      process.exit(1);
    });
} else {
  console.log("MONGODB_URI not found in environment variables. Database was not seeded automatically.");
}

function decache(moduleName) {
  const resolved = require.resolve(moduleName);
  delete require.cache[resolved];
}
