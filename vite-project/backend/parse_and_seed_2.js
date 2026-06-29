const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = `
name:Mooz Formaggio Vegetable Tofu,price:130,weight:200 g
name:Mooz Formaggio Organic Masala Tofu,price:130,weight:200 g
name:Nutriway High Protein Paneer,price:99,originalPrice:170,weight:200
name:Milky Mist Paneer,price:199,originalPrice:280,weight:200 * 2
name:Mooz Formaggio Organic Peanut Chilly Tofu - Soy Paneer,price:130,,weight:200 g
name:Godrej Jersey 30 gm Protein - Super Soft Paneer,price:82,originalPrice:110,weight:165 g
name:Nandini Fresh Paneer,price:99,weight:200 g
name:Milky Mist High Protein Low Fat Paneer,price:230,originalPrice:320,weight:200 * 2
name:Amul Fresh Paneer,price:115,weight:200 g
name:Heritage High Protein Paneer,price:130,originalPrice:170,weight:240 g
name:Milky Mist Briyas Tofu Soya Paneer,price:79,originalPrice:110,weight:200 g
name:Milky Mist Paneer,price:270,originalPrice:355,weight:500 g
name:Akshayakalpa Organic Malai Paneer,price:145,originalPrice:155,weight:200 g
name:Amul Fresh Cream,price:77,weight:250 ml
name:Hatsun Soft Paneer,price:130,originalPrice:145,weight:200 g
name:Milking Organic Malai Paneer,price:129,originalPrice:145,weight:200 g
name:Heritage Fresh Paneer,price:220,originalPrice:250,weight:200 g * 2
name:Alepa Farm Organic High Protein Paneer,price:138,originalPrice:170,weight:200 g
name:Milking Organic High Protein Paneer,price:120,originalPrice:170,weight:200 g
name:Nestle Milkmaid Mini,price:89,weight:190 g
name:Mother Dairy Fresh Paneer,price:97,weight:200 g
name:D'lecta Dairy Cream,price:67,originalPrice:75,weight:200 ml
name:Akshayakalpa Organic High Protein Paneer,price:178,originalPrice:183,weight:200 g
name:Amul Malai Paneer,price:125,weight:250 g
name:Country Delight 40 g Protein Taaza Paneer,price:120,originalPrice:150,weight:200 g
name:Amul Fresh Cream,price:250,weight:1 Litre
name:Gowardhana Fresh Paneer,price:99,originalPrice:140,weight:200 g
name:Amul Frozen Khoa,price:99,weight:200 g
name:iD Fresh High Protein Paneer(56g Protein),price:160,weight:200 g
name:Brik Oven Sour Cream Cheese(Freshly Made),price:190,weight:200 g
name:Nestle Milkmaid Tin,price:159,weight:380 g
name:Milky Mist Unsweetened Khova,price:120,weight:200 g
name:Amul Mithai Mate Sweetened Condensed Milk,price:78,weight:200 g
name:Pride of Cows High Protein Low Fat Paneer,price:229,originalPrice:245,weight:200 g
name:Amul Mithai Mate Sweetened Condensed Milk,price:140,weight:400 g
name:Milky Mist Sweetened Condensed Milk,price:75,originalPrice:85,weight:200 g
name:Organic Mandya High protein Paneer,price:162,originalPrice:170,weight:200 g
name:Milky Mist Sweetened Condensed Milk,price:130,originalPrice:155,weight:400 g
name:Milky Mist Uht Cream,price:99,originalPrice:110,weight:250 ml
name:NOICE High Protein Paneer (50g Protein Per Pack),price:139,originalPrice:160,weight:200 g
name:Vinamis Fresh Original Tofu,price:160,weight:330 g
name:Alepa Farm Organic Malai Paneer,price:110,originalPrice:150,weight:200 g
name:Health on Plants Tandoori Tofu(Red Chilli,Methi Marinated),price:190,weight:200 g
name:Health on Plants Silken Tofu,price:240,weight:250 g
name:Health on Plants Smoked Tofu(Firm & Coal Smoaked),price:195,weight:200 g
name:D'lecta Dairy Whipping Cream,price:479,originalPrice:595,weight:1 kg
name:Amul Malai Paneer,price:450,weight:1 kg
name:Bio Nutrients Pure Diet Soy Paneer,price:67,weight:200 g
name:Harima Whipping Cream Power,price:80,weight:50 g
name:Amul Half & Half Cream,price:80,weight:250 g
name:Amul Malai Paneer Dice,price:390,weight:200 g * 4
name:Epigamia High Protein Paneer,price:199,originalPrice:269,weight:200 g
name:NOICE Khoya (Unsweetened & No Preservaties),price:110,originalPrice:140,weight:200 g
name:Heritage Paneer With Butter Combo,price:240,originalPrice:255,weight:1 combo
name:Bio Nutrients Pure Diet Tofu Gold,price:170,weight:200 g
name:Urban Platter Firm Tofu,price:195,originalPrice:200,weight:200 g
name:Sid's Farm Malai Paneer,price:150,weight:200 g
name:iD Fresh Soft & Creamy Paneer,price:295,weight:200 g * 2
name:Mooz Formaggio Organic Tofu,price:120,weight:200 g
name:Health on Plants Classic Tofu(Japanese-style tofu),price:150,weight:200 g
name:MOOZ unsalted White Butter,price:190,originalPrice:200,weight:150 g
name:MOOZ Butter Garlic & Herbes,price:171,originalPrice:180,weight:125 g
name:Amul Pasteurised Butter,price:70,weight:100 g
name:Amul Pasteurised Butter,price:133,weight:200 g
name:Grabenord plant Based Buttery Spread - Unsalted | Vegan Butter | Dairy-Free,price:245,originalPrice:270,weight:200 g
name:Granbenord Plant Butter Salted,price:245,originalPrice:270,weight:200 g
name:Akshayakalpa Organic Cooking Butter - Unsalted,price:230,weight:200 g
name:Nutralite Yummy Spread,price:30,weight:100 g
name:Grabenord Plant Based Buttery Spread-(With Avocado Oil)- |Vegan Butter,price:244,originalPrice:270,weight:200 g
name:Amul Unsalted Butter,price:73,weight:100 g
name:Nutralite Doodhshakti Probiotic and Butter Spread,price:283,originalPrice:320,weight:500 g
name:Milky Mist Cooking Unsalted Butter,price:93,originalPrice:95,weight:100 g
name:Amul Butter Unsalted Box,price:350,weight:500 g
name:Amul Delicious Margarine,price:49,weight:100 g * 2
name:Akshayakalpa Organic Table Butter Salted,price:246,weight:100 g * 2
name:Milky Mist Butter Chiplet Pack,price:99,weight:100 g
name:Akshayakalpa Organic Cooking Butter Un-salted,price:124,weight:100 g
name:Heritage Pasturised Table Butter,price:58,weight:100 g
name:Akshayakalpa Organic Table Butter Salted,price:239,weight:200 g
name:Nutralite Activ Plant Based Buttery Spread-Olive,price:89,originalPrice:117,weight:100 g
name:Nutralite Doodhshakti Probiotic Spread Tub,price:279,originalPrice:319,weight:500 g
name:Milky Mist Cooking Butter Unsalted,price:164,originalPrice:170,weight:200 g
name:Nutralite Premium Fat Spread Tub,price:121,originalPrice:135,weight:200 g
name:Milky Mist Table Salted Butter,price:93,originalPrice:95,weight:100 g
name:Nutralite Active Plant Based Buttery Spread-Garlic & Herbs,price:88,originalPrice:117,weight:100 g
name:Heritage Premium Butter,price:299,originalPrice:395,weight:500 g
name:Nutralite Yummy Spread,price:145,originalPrice:155,weight:500 g
name:Heritage Pasturised Table Butter & Maggi Atta Noodles,price:97,originalPrice:99,weight:1 Combo
name:Heritage Pasturised Table Butter & HERITAGE Cheese Blocks,price:182,originalPrice:193,weight:1 Combo
name:President Premium Cooking Butter Unsalted,price:344,originalPrice:368,weight:500 g
name:Amul Lite Milk Fat Bread Spread,price:292,weight:200 g * 3
name:Nandini Salted Butter,price:295,weight:500 g
name:Dairy Craft Unsalted White Butter,price:348,weight:500 g
`;

function parseLine(line) {
  const nameIdx = line.indexOf("name:");
  const priceIdx = line.indexOf("price:");
  const origIdx = line.indexOf("originalPrice:");
  const weightIdx = line.indexOf("weight:");

  const parts = [
    { key: "name", index: nameIdx },
    { key: "price", index: priceIdx },
    { key: "originalPrice", index: origIdx },
    { key: "weight", index: weightIdx }
  ].filter(p => p.index !== -1).sort((a, b) => a.index - b.index);

  const result = {};
  for (let i = 0; i < parts.length; i++) {
    const start = parts[i].index + parts[i].key.length + 1;
    const end = (i + 1 < parts.length) ? parts[i+1].index : line.length;
    let val = line.substring(start, end).trim();
    // Advanced cleaning to strip double commas and trailing symbols
    val = val.replace(/^[,\s]+|[,\s]+$/g, "").trim();
    result[parts[i].key] = val;
  }
  return result;
}

const brands = [
  "Milky Mist", "Hatsun", "Epigamia", "Sid's Farm", "Heritage", "Country Delight",
  "Akshayakalpa", "Organic Mandya", "Mamie Yova", "iD Fresh", "Mother Dairy",
  "Amul", "Eggoz", "UPF FOODS", "NOICE", "Licious", "Farm Made", "dr GOOD EGGS",
  "dr.GOOD EGGS", "Abhi Eggs", "Happy Hens", "Dr.Hen", "Skm", "Delfrez",
  "Jolly Good", "Hen Fruit", "Organic Acre", "Nestle", "Godrej Jersey",
  "Pride of Cows", "Dobra", "Mooz", "MOOZ", "Nutriway", "Gowardhana",
  "Brik Oven", "Vinamis", "Health on Plants", "Bio Nutrients", "Urban Platter",
  "Nutralite", "President", "Nandini", "Dairy Craft", "D'lecta", "Harima",
  "Grabenord", "Granbenord"
];

function getBrand(name) {
  for (const b of brands) {
    if (name.toLowerCase().includes(b.toLowerCase())) {
      return b;
    }
  }
  return "Other";
}

const lines = rawList.trim().split("\n").map(l => l.trim()).filter(Boolean);
const parsedProducts = [];

let counter = 500;
for (const line of lines) {
  const p = parseLine(line);
  if (!p.name) continue;

  const isPaneer = p.name.toLowerCase().includes("paneer") || p.name.toLowerCase().includes("tofu");
  const isButter = p.name.toLowerCase().includes("butter") || p.name.toLowerCase().includes("spread") || p.name.toLowerCase().includes("margarine");
  
  let subCategory = "Milk";
  let tags = ["dairy"];
  let image = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500";

  if (isPaneer) {
    subCategory = "Paneer and Tofu";
    tags.push("paneer");
    tags.push("tofu");
    image = "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500";
  } else if (isButter) {
    subCategory = "Butter";
    tags.push("butter");
    tags.push("spread");
    image = "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=500";
  } else {
    tags.push("cream");
    tags.push("milk");
    image = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500";
  }

  const idPrefix = isPaneer ? "new_paneer_" : isButter ? "new_butter_" : "new_cream_";
  
  const formatted = {
    id: `${idPrefix}${counter++}`,
    name: p.name,
    category: "Dairy, Bread & Eggs",
    subCategory: subCategory,
    subcategory: "",
    tags: tags,
    isTrending: false,
    price: Number(p.price || 0),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : Math.round(Number(p.price || 0) * 1.25),
    weight: p.weight || "200 g",
    stock: 50,
    image: image,
    section: "",
    brand: getBrand(p.name),
    description: `${p.name}. Sourced fresh and packed under strict hygiene conditions. Sourced with high-quality standards.`,
    eta: "30 MINS",
    isAd: false,
    variants: []
  };

  parsedProducts.push(formatted);
}

console.log(`Parsed ${parsedProducts.length} new products.`);

const seedFilePath = path.resolve(__dirname, "seed.js");
const existingProducts = require("./seed");
console.log(`Loaded ${existingProducts.length} existing products.`);

const allProducts = [...existingProducts, ...parsedProducts];
console.log(`Total products will be ${allProducts.length}.`);

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
console.log("seed.js updated successfully!");

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("Database connection successful. Seeding database...");
      await Product.deleteMany();
      await Product.insertMany(allProducts);
      console.log("Database Seeding Successful! All products uploaded to MongoDB.");
      process.exit();
    })
    .catch(err => {
      console.error("Database connection/seeding failed:", err);
      process.exit(1);
    });
} else {
  console.log("MONGODB_URI not found in environment variables. Database was not seeded automatically.");
}