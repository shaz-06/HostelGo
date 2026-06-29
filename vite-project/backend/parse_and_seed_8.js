const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = `
name:Supreme Harvest Sona Masoori Raw Rice,price:178,originalPrice:210,weight:1 kg * 2
name:Supreme Harvest Idly Rice,price:666,originalPrice:800,weight:5 kg * 2
name:Sona Masoori Economy. Rice,price:1440,originalPrice:2200,weight:26 kg
name:Daawat Rozana Super Basmati Rice,price:188,originalPrice:200,weight:1 kg * 2
name:Supreme HArvest Sina Masoori Raw Rice,price:412,originalPrice:520,weight:5 kg
name:Supreme Harvest Sona Masoori Rice,price:1815,originalPrice:2100,weight:26 kg
name:India Gate Basmati Rice Feast Rozzana,price:120,originalPrice:125,weight:1 kg
name:GTS Original Bullets Kolam Raw Rice,price:589,originalPrice:625,weight:5 kg
name:Supreme Harvest Sona Masoori Raw Rice,price:779,originalPrice:900,weight:5 kg
name:Tilda Pure Original Basmati Rice,price:169,originalPrice:199,weight:1 kg
name:India Gatte Basmati Rice,price:230,originalPrice:250,weight:1 kg * 2
name:Supreme Harvest Sona Masoori Raw Rice,price:450,originalPrice:520,weight:5 kg
name:Tilda Grand Biriyani Basmati Rice,price:210,originalPrice:230,weight:1 kg
name:921 Everyday Long Grain Rice,price:499,originalPrice:600,weight:5 kg
name:India Gate Basmati Rice - Dubar,price:155,originalPrice:167,weight:1 kg
name:Fortune Sona Masoori Supreme Rice,price:489,originalPrice:550,weight:5 kg
name:921 Rozana Broken Basmati Rice,price:110,originalPrice:125,weight:1 kg
name:Supreme Harvest Dosa Rice,price:71,originalPrice:80,weight:1 kg
name:Daawat Sona Masoori Rice,price:429,originalPrice:470,weight:5 kg
name:Daawat Basmati Rice - Super,price:199,originalPrice:200,weight:1 kg
name:Rehaan 1121 Classic Extra Long Grain Biriyani Basmati Rice,price:199,originalPrice:250,weight:1 kg
name:921 mini Morga Basmati rice,price:689,originalPrice:700,weight:10 kg
name:Double Jorse Palakkadan Matta Rice,price:178,originalPrice:180,weight:2 kg
name:Supreme Harvest Ponni Boiled Rice,price:210,originalPrice:240,weight:1 kg * 2
name:Daawat Sona Masoori,price:95,weight:1 kg
name:921 Sushi Rice,price:349,originalPrice:400,weight:1 kg
name:Popular Essentials Sona Masoori Steam Rice,price:189,originalPrice:200,weight:1 kg * 2
name:Supreme Harvest Kurnool Sona Masoori Raw Rice,price:199,originalPrice:200,weight:1 kg * 2
name:Kitchen Gems Kurnool Sona Masoori Steam Rice,price:415,originalPrice:510,weight:5 kg
name:921 Rozana Basmati Rice (Broken Rice),price:525,originalPrice:625,weight:5 kg
name:India Gate Basmati Rice - Classic,price:260,weight:1 kg
name:Udhaiyam Ponni Boiled Rice,price:460,weight:5 kg
name:Daawat Basmati Rice - Rozana Super,price:499,weight:5 kg
name:921 Aged Premium Basmati Rice Jar,price:250,originalPrice:350,weight:1 kg
name:India Gate Basmati Rice - Super,price:560,weight:1.5 kg * 2
name:Daawat Basmati Rice - Pulav,price:177,weight:1 kg
name:Fortune Sona Masoori Rice,price:450,weight:5 kg
name:921 Extra Long Grain Super Basmati Rice,price:239,originalPrice:260,weight:1 kg
name:Chowringhee Lane Gobindo Bhog Rice,price:305,weight:1 kg
name:Supreme Harvest Ponni Steam Rice,price:410,originalPrice:420,weight:5 kg
name:India Gate Jeera Rice,price:310,originalPrice:320,weight:1 kg
name:921 Classic xxxl 1121 extra long grain basmati rice,price:1300,originalPrice:1400,weight:5 kg
name:Popular Essential Jeera Rice - Premium,price:290,weight:1 kg
name:Daawat Basmati Rice - Rozana Gold,price:110,weight:1 kg
name:Supreme Harvest Waada Kolam Raw Rice,price:260,weight:1 kg * 2
name:921 Extra Long Grain Super Basmati Rice,price:999,originalPrice:1280,weight:5 kg
name:Supreme Harvest Sona Masoori Raw Rice,price:1999,originalPrice:2100,weight:26 kg
name:Daawat Lachkari Vada Kolam Rice,price:550,weight:5 kg
name:Supreme Harvest Sona Masoori Raw Rice,price:899,weight:10 kg
name:Supreme Harvest Jeera Raw Rice,price:613,originalPrice:700,weight:1 kg * 2
name:GTS Original Bullet Kolam Raw Rice,price:130,weight:1 kg
name:921 Rozana Broken Basmati Rice,price:99,originalPrice:125,weight:1 kg
name:Udhaiyam Idly Rice,price:73,weight:1 kg
name:Udhaiyam Idly Rice,price:365,weight:5 kg
name:Fortune Rozana Gold Basmati Rice,price:120,weight:1 kg
name:GTS Original Bullet Kolam Rice,price:3499,originalPrice:3900,weight:30 kg
name:Supreme Harvest Govindbhog Raw Rice,price:540,weight:1 kg * 2
name:Supreme Harvest Idly Rice,price:678,originalPrice:880,weight:5 kg * 2
name:Supreme Harvest Red Matta VAdi Boiled Rice,price:90,weight:1 kg
name:Organic Tattva Sona Masoori Rice Brown,price:130,weight:1 kg
name:Rehaan Royal Classic 1121 Basmati Rice,price:3699,originalPrice:4500,weight:26 kg
name:KCP Nutri Poshan,price:2699,originalPrice:3500,weight:26 kg
name:Supreme Harvest Kurnool Sona Masoori Raw Rice,price:200,weight:1 kg * 2
name:Kitchen Gems Kurnool Sona Masoori Steam Rice,price:410,originalPrice:510,weight:5 kg
name:,Spureme Harvest Broken Riceprice:59,originalPrice:110,weight:1 kg
name:KCP Nutri Poshan,price:799,originalPrice:950,weight:5 kg
name:India Gate Rozzana Basmati Rice,price:590,weight:5 kg
name:Daawat Basmati Rice - Rozana Super,price:99,weight:1 kg
name:Superme Harvest Sona Masoori Raw Rice,price:459,originalPrice:520,weight:5 kg
name:KCP Nutri Poshan HMT Aged Raw Rice,price:789,originalPrice:900,weight:5 kg
name:India Gate Basmati Rice - Feast Rozzana,price:250,weight:1 kg * 2
name:Daawat Basmati Rice - Rozana Super,price:499,weight:5 kg
name:India Gate Basmati Rice,price:260,weight:1 kg
name:24 Mantra Gluten Free Tur Dal,price:278,originalPrice:295,weight:1 kg
name:DeHaat Honest Farms - Pesticide Free,price:265,originalPrice:252,weight:1 kg
name:Tata Sampann Unpolished Toor Dal,price:445,originalPrice:488,weight:2 kg
name:Tata Sampann Unpolished Toor Dal,price:113,weight:500 g
name:DeHaat Honest Farms Upolished Urad Dal,price:260,weight:1 kg
name:Tata Sampann Unpolished Toor,price:224,weight:1 kg
name:Tata Sampann Unpolished Urad Dal,price:119,weight:500 g
name:DeHaat Honest Farms Unpolished Green Moong,price:245,weight:1 kg
name:DeHaat Honest Farms Green Whole Moong Dal,price:125,weight:500 g
name:Supreme Harvest Toor Dal,price:123,originalPrice:132,weight:500 g
name:Supreme Harvest Green Moong Dal,price:99,weight:500 g
name:Basic Toor Dal,price:398,originalPrice:460,weight:1 kg * 2
name:Fortune Unpolished Moong Dal,price:218,weight:500 g * 2
name:Aashirvaad Organic Whole Wheat Atta,price:842,weight:5 kg * 2
name:Fortune Maida,price:132,weight:500 g * 2
name:Supreme Harvest Groundnut,price:170,weight:500 g
name:Supreme Harvest Sona Masoori Raw Rice,price:105,weight:1 kg
name:Aashirvaad Superior MP Atta,price:644,weight:10 kg
name:Supree Harvest Upma Sooji,price:99,weight:500 g * 2
name:Aashirvaad Superior MP Atta,price:74,weight:1 kg
name:Tata Sampann Thick Poha,price:115,weight:1 kg
name:Supreme Harvest Puffed Rice,price:49,weight:200 g
name:Supreme Harvest Suji Rawa,price:80,weight:1 kg
name:Tata Sampann Unpolished Kala Chana,price:70,weight:500 g
name:Fortune Sooji,price:45,weight:500 g
name:Supreme Harvest Chana Dal,price:94,weight:500 g
name:Supreme Harvest Ragi Flour,price:65,weight:500 g
name:Fortune Soya Chunk Mini,price:50,weight:200 g
name:Supreme Harvest Groundnut,price:550,originalPrice:600,weight:1 kg * 2
name:Tata Sampann Besan (Kadale Hittu),price:75,weight:500 g
name:GTS Original Bullet Kolam Rice Bag,price:1150,weight:10 kg
name:Supreme Harvest Rice Flour,price:50,weight:500 g
name:Fortune Chakki fresh Atta,price:89,originalPrice:107kg,weight:1 kg
`;

function parseLine(line) {
  let cleanLine = line
    .replace(/^,/, "") // clean leading comma
    .replace(/originalPrice:,/g, ",")
    .replace(/originalPrice:\s*$/g, "")
    .trim();

  // If starts with "name:", keep it
  if (!cleanLine.startsWith("name:")) {
    cleanLine = "name:" + cleanLine;
  }

  const nameIdx = cleanLine.indexOf("name:");
  const priceIdx = cleanLine.indexOf("price:");
  const origIdx = cleanLine.indexOf("originalPrice:");
  const weightIdx = cleanLine.indexOf("weight:");

  const parts = [
    { key: "name", index: nameIdx },
    { key: "price", index: priceIdx },
    { key: "originalPrice", index: origIdx },
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
  if (lower.includes("rice")) return "Rice";
  if (lower.includes("dal") || lower.includes("chana") || lower.includes("toor") || lower.includes("urad") || lower.includes("moong")) return "Dals";
  return "Atta & Flours";
}

function getBrand(name) {
  const lower = name.toLowerCase();
  if (lower.includes("supreme harvest") || lower.includes("spureme harvest") || lower.includes("superme harvest") || lower.includes("supree harvest")) return "Supreme Harvest";
  if (lower.includes("india gate") || lower.includes("india gatte")) return "India Gate";
  if (lower.includes("tata sampann")) return "Tata Sampann";
  if (lower.includes("fortune")) return "Fortune";
  if (lower.includes("dehaat honest")) return "DeHaat Honest Farms";
  if (lower.includes("daawat")) return "Daawat";
  if (lower.includes("organic tattva")) return "Organic Tattva";
  if (lower.includes("rehaan")) return "Rehaan";
  if (lower.includes("kitchen gems")) return "Kitchen Gems";
  if (lower.includes("udhaiyam")) return "Udhaiyam";
  if (lower.includes("double jorse")) return "Double Jorse";
  if (lower.includes("popular essentials") || lower.includes("popular essential")) return "Popular Essentials";
  if (lower.includes("chowringhee lane")) return "Chowringhee Lane";
  if (lower.includes("gts")) return "GTS";
  if (lower.includes("tilda")) return "Tilda";
  if (lower.includes("kcp")) return "KCP";
  if (lower.includes("24 mantra")) return "24 Mantra";
  if (lower.includes("aashirvaad")) return "Aashirvaad";
  return "Other";
}

function getProductImage(subCategory) {
  if (subCategory === "Rice") {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Dals") {
    return "https://images.unsplash.com/photo-1596790011460-9d89e51d0342?w=500&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop";
}

const lines = rawList.trim().split("\n").map(l => l.trim()).filter(Boolean);
const parsedProducts = [];

let counter = 8000;
for (const line of lines) {
  const p = parseLine(line);
  if (!p.name) continue;

  const category = "Atta, Rice and Dal";
  const subCategory = getSubCategory(p.name);
  const brand = getBrand(p.name);
  
  let cleanName = p.name
    .replace(/\s+/g, " ")
    .replace(/Spureme/g, "Supreme")
    .replace(/Superme/g, "Supreme")
    .replace(/Supree/g, "Supreme")
    .replace(/HArvest/g, "Harvest")
    .replace(/Sina/g, "Sona")
    .replace(/India Gatte/g, "India Gate")
    .replace(/Biriyani/g, "Biryani")
    .replace(/basmati rice/g, "Basmati Rice")
    .replace(/Morga/g, "Mogra")
    .replace(/Broken Riceprice/g, "Broken Rice")
    .replace(/Upolished/g, "Unpolished")
    .trim();

  // If cleanName ends with a comma, remove it
  if (cleanName.endsWith(",")) {
    cleanName = cleanName.slice(0, -1).trim();
  }

  // Remove leading comma or bad chars
  if (cleanName.startsWith(",")) {
    cleanName = cleanName.slice(1).trim();
  }

  const formatted = {
    id: `grocery_rice_dal_${counter++}`,
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
    originalPrice: p.originalPrice ? Number(p.originalPrice) : Math.round(Number(p.price || 0) * 1.25),
    weight: p.weight || "1 kg",
    stock: 50,
    image: getProductImage(subCategory),
    section: "grocery",
    brand: brand,
    description: `${cleanName}. Delicious and high quality staple, sourced fresh and handled with strict hygiene standards.`,
    eta: "15 MINS",
    isAd: false,
    variants: []
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
