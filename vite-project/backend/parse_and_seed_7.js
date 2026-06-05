const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

// Note: Cleaned up the newline in the raw list for Crax Korean Ramen Noodle Puffs
const rawList = `
name:Bingo chips Chilli Potato & Achari Masti Combo,price:68,originalPrice:70,weight:1 Combo
name:NOICE Spicy Masala Long Banana Chips,price:47,weight:50 g
name:Bingo Salt Sprinkled Potato Chips,price:20,weight:43 g
name:Lay'S Chilli Limon & Chilli Potato Combo,price:124,weight:1 Combo
name:Bingo Original Style Chilli Sprinkled Potato Chips,price:20,weight:45.9
name:NOICE Ripe Nendran Banana Chips,price:99,originalPrice:112,weight:50 g * 2
name:KAB'S Jackpot Cheese Balls,price:57,originalPrice:65,weight:60 g
name:Troovy Healthy High Protein Mix Veggies Chips,price:65,weight:70 g
name:Troovy Healthy High Protein Mix Veggies Chips,price:65,weight:70 g
name:Let's try Flying Chilli Chips,price:44,originalPrice:60,weight:45 g
name:Let's Try Desi Masala Chips,price:44,originalPrice:60,weight:45 g
name:Lay's India's Magic Masala Chips & Pepsi Bottle,price:65,weight:1 Combo
name:NOICE Spicy Potato Hot Chips,price:99,weight:100 g
name:BALAJI Cream & Onion Potato Wafers,price:40,weight:140 g
name:Bingo Original Style Chilli Sprinkled,price:157,originalPrice:200,weight:130 g * 2
name:BALAJI Crunchez Chilli Tadka Potato Wafer,price:40,weight:140 g
name:BRB Potato Popped Chips Spicy Chipoted Flavour,price:30,originalPrice:40,weight:48 g
name:Too Yumm! Spicy Korean Banana Chips,price:129,originalPrice:140,weight:75 g * 2
name:Crax Aloo Mota Chips-Salted,price:88,originalPrice:100,weight:70 g * 2
name:Sweer Karam Coffee Nendran Banana Chips,price:186,weight:200 g
name:BALAJI Masala Masti Wafers,price:20,weight:65 g
name:The Healthy Binge Quinoa Baked Chips Smokey BBQ,price:40,weight:40 g
name:BRB Rice Popped Chips Peri Peri Flavour,price:74,originalPrice:80,weight:46 * 2
name:BRB Popped Potato Chips alt & Pepper Flavour,price:36,originalPrice:40,weight:48 g
name:Pringles Potato Chips Sour Cream & Onion,price:146,originalPrice:169,weight:141 g
name:Natch Thai Rice Chips,price:75,weight:25 g
name:Sweet Karam Coffee Tapioca Chips,price:126,originalPrice:128,weight:65 g * 2
name:Bingo Popped Chips Salt n Pepper,price:144,originalPrice:150,weight:48 g * 3
name:Pringles Potato Chips,price:294,originalPrice:338,weight:1 Combo
name:Let's Try Namkeen,price:144,originalPrice:180,weight:162 g * 2
name:WellBe Crunchy Peri Peri Chakli,price:89,weight:120 g
name:NOICE Spiced Aloo Bhujia,price:42,weight:100 g
name:Bikaji Bikaneri Bhujia,price:59,weight:200 g
name:WellBe Crunchy Onion Kodbale,price:80,weight:120 g
name:WellBe Maddur Vada,price:95,weight:110 g
name:Haldiram's Nagpur Cornflakes Mixture,price:89,weight:200 g
name:Let's Try Kerala Garlic Mix,price:99,originalPrice:120,weight:173 g
name:Haldiram's Nagpur Tasty Nuts,price:69,weight:200 g
name:Too Yumm Bikaneri Bhujia Sev Snacks,price:43,originalPrice:55,weight:140 g
name:Haldiram's Nagpur Bhujia Sev,price:195,weight:600 g
name:BALAJI Aloo Sev,price:88,weight:400 g
name:Klaw Masala Madness Sticks,price:20,weight:40 g
name:Bingo Tedhe Medhe Masala Tadka,price:50,weight:80 g * 3
name:Let's Try Masala Puff,price:59,weight:60 g
name:Kurkure Green Chutney Style Crisps,price:40,weight:78.9 g * 2
name:Bingo No Rulz Masala Curlz Corn Puffs,price:42,originalPrice:50,weight:80 g
name:Kurkure Namkeen,price:10,weight:41.5 g
name:Kurkure Namkeen,price:20,weight:84.9 g
name:Kurkure Namkeen Chilli Chatka,price:60,weight:78.9 g * 3
name:Kurkure Namkeen,price:30,weight:94 g
name:Cheetos Chrunchy Corn Snacks,price:10,weight:28 g
name:Cheetos Cheez Puffs,price:20,weight:28 * 2
name:Piknik Classic tomato Chilli,price:56,originalPrice:60,weight:50 g
name:Too Yumm! Karare Munchy Masala 70 g,price:36,originalPrice:40,weight:71 g * 2
name:Kurkure Namkeen Playz Puffcorn,price:48,weight:84 g
name:Peppy Cheeseball,price:56,originalPrice:60,weight:50 g
name:Too Yumm! Noodle Masala Karare,price:20,weight:71 g
name:Cheetos Masala Balls Crispy Chips & Snacks,price:99,weight:84 * 2
name:Modern Kitchens Wheel Chips,price:56,originalPrice:60,weight:55 g
name:Crax Korean Ramen Noodle Puffs Chips Snaks 70 g,price:99,originalPrice:120,weight:70 g * 2
name:Too Yumm Dahi Papdi Chaat Chips,price:20,weight:43 g
name:Too Yumm Chilli Chataka Veggie Stix,price:20,weight:43 g
name:Too Yumm Smoking Hot Bhoot Karare,price:20,weight:71 g
name:Crax Cheese Balls,price:50,weight:54 g * 2
name:Peppy Tomato Discs,price:56,originalPrice:60,weight:50 g
name:Cheetos Puffs Corn Snacks,price:124,originalPrice:134,weight:135 g
name:Too Yumm Multigrain Chips Dahi Papd Chaat,price:99,originalPrice:105,weight:70 g * 3
name:Crax Curls Chatpata Masala,price:99,originalPrice:120,weight:82 g * 2
name:Too Yumm Veggie Stix Chilli Chataka,price:99,originalPrice:105,weight:70 g * 3
name:Kurkure Schezwan Chutney,price:40,weight:78.9 g * 2
name:Cadbury 5 Star Chocolate Bar Litted Pack,price:53,weight:96 g
name:Cadbury 5 Star Chocolate Home Treats Bars,price:299,originalPrice:356,weight:245 g * 2
name:Hershey's Kisses Choco Truffle,price:259,originalPrice:267,weight:45 g * 3
name:Hershey's Kisses Strwaberry Creme,price:88,weight:40.5 g
name:Fabelle The Bars Treasury Giftpack of 24 as Sorted Chocolates,price:499,originalPrice:545,weight:168 g
name:Fabelle Dessert Collectiuon - Handcrafted Chocolate Truffles,price:734,originalPrice:758,weight:66 g
name:Cadbury Dairy Milk Silk Dessert Brown Chocolate Bar,price:110,weight:70 g
name:Fabelle Elements Pralines _ Handcrafted Dark Chocolates,price:777,originalPrice:795,weight:63 g
name:Fabelle Ganache Creamy Milk<Luxury Chocolated Gift Box,price:1099,originalPrice:1195,weight:124 kg
name:Fabelle Dessert Collection Minis _ Tiramisu,Cheesecake & Banoffee Pie Inspired Chocolate,price:155,originalPrice:165,weight:63 g
name:Mango Fruit Bar - Fun Pack,price:30,weight:42 g
name:Ferrero Rocher Moments,price:499,originalPrice:530,weight:92.8 g * 2
name:Ferrero Rocher Gift Pack(16 Pieces),price:499,originalPrice:540,weight:200 g
name:Nestle Munch Max Crunchies,price:40,weight:45 g
name:Noice French Chocolate Rochers,price:256,originalPrice:320,weight:90 g
`;

function parseLine(line) {
  let cleanLine = line
    .replace(/,,/g, ",")
    .replace(/originalPrice:,/g, ",")
    .replace(/originalPrice:\s*$/g, "");

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

function getCategory(name) {
  const lowerName = name.toLowerCase();
  
  // If brand is Hershey, Fabelle, Cadbury, Ferrero, Munch, Rocher etc or name contains chocolate/choc/creme
  if (lowerName.includes("chocolate") || lowerName.includes("choco") || lowerName.includes("creme") || lowerName.includes("cadbury") || lowerName.includes("hershey") || lowerName.includes("fabelle") || lowerName.includes("ferrero") || lowerName.includes("munch") || lowerName.includes("rocher") || lowerName.includes("rochers") || lowerName.includes("mango fruit bar")) {
    return "Chocolates";
  }
  return "Chips and Namkeens";
}

function getSubCategory(name, category) {
  const lowerName = name.toLowerCase();
  
  if (category === "Chocolates") {
    if (lowerName.includes("dark") || lowerName.includes("cocoa")) {
      return "Dark Chocolates";
    }
    if (lowerName.includes("gift") || lowerName.includes("giftpack") || lowerName.includes("truffle") || lowerName.includes("truffles") || lowerName.includes("moments") || lowerName.includes("rocher") || lowerName.includes("rochers") || lowerName.includes("kisses") || lowerName.includes("box") || lowerName.includes("fabelle")) {
      return "Gift Packs";
    }
    if (lowerName.includes("wafer") || lowerName.includes("munch") || lowerName.includes("kitkat") || lowerName.includes("perk")) {
      return "Wafer Chocolates";
    }
    if (lowerName.includes("munch") || lowerName.includes("bar") || lowerName.includes("treat") || lowerName.includes("5 star") || lowerName.includes("star") || lowerName.includes("mango fruit bar")) {
      return "Bars & Bites";
    }
    return "Milk Chocolates";
  }
  
  // Chips and Namkeens subcategories
  if (lowerName.includes("bhujia") || lowerName.includes("sev") || lowerName.includes("mixture") || lowerName.includes("nuts") || lowerName.includes("namkeen") || lowerName.includes("chakli") || lowerName.includes("kodbale") || lowerName.includes("vada") || lowerName.includes("tasty nuts")) {
    return "Namkeen & Bhujia";
  }
  if (lowerName.includes("cheetos") || lowerName.includes("cheese ball") || lowerName.includes("cheeseball") || lowerName.includes("peppy") || lowerName.includes("piknik") || lowerName.includes("puffs") || lowerName.includes("puff") || lowerName.includes("karare") || lowerName.includes("curls") || lowerName.includes("wheel chips") || lowerName.includes("ramen noodle") || lowerName.includes("puffcorn") || lowerName.includes("sticks") || lowerName.includes("stix")) {
    return "Puffs & Popcorn";
  }
  return "Potato Chips";
}

function getBrand(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("bingo")) return "Bingo";
  if (lowerName.includes("noice")) return "NOICE";
  if (lowerName.includes("lay")) return "Lay's";
  if (lowerName.includes("kab's")) return "KAB'S";
  if (lowerName.includes("troovy")) return "Troovy";
  if (lowerName.includes("let's try") || lowerName.includes("let’s try")) return "Let's Try";
  if (lowerName.includes("balaji")) return "BALAJI";
  if (lowerName.includes("brb")) return "BRB";
  if (lowerName.includes("too yumm")) return "Too Yumm!";
  if (lowerName.includes("crax")) return "Crax";
  if (lowerName.includes("sweer karam") || lowerName.includes("sweet karam")) return "Sweet Karam Coffee";
  if (lowerName.includes("the healthy binge")) return "The Healthy Binge";
  if (lowerName.includes("pringles")) return "Pringles";
  if (lowerName.includes("natch")) return "Natch";
  if (lowerName.includes("wellbe")) return "WellBe";
  if (lowerName.includes("bikaji")) return "Bikaji";
  if (lowerName.includes("haldiram")) return "Haldiram's";
  if (lowerName.includes("klaw")) return "Klaw";
  if (lowerName.includes("kurkure")) return "Kurkure";
  if (lowerName.includes("cheetos")) return "Cheetos";
  if (lowerName.includes("peppy")) return "Peppy";
  if (lowerName.includes("piknik")) return "Piknik";
  if (lowerName.includes("modern kitchen")) return "Modern Kitchens";
  if (lowerName.includes("cadbury")) return "Cadbury";
  if (lowerName.includes("hershey")) return "Hershey's";
  if (lowerName.includes("fabelle")) return "Fabelle";
  if (lowerName.includes("ferrero")) return "Ferrero Rocher";
  if (lowerName.includes("nestle") || lowerName.includes("nestlé")) return "Nestle";
  return "Other";
}

function getProductImage(subCategory, name) {
  if (subCategory === "Potato Chips") {
    return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Namkeen & Bhujia") {
    return "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Puffs & Popcorn") {
    return "https://images.unsplash.com/photo-1536680465769-2365207b035e?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Milk Chocolates") {
    return "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Dark Chocolates") {
    return "https://images.unsplash.com/photo-1548907040-4d42b5212c10?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Gift Packs") {
    return "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Bars & Bites") {
    return "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Wafer Chocolates") {
    return "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop";
}

function getSectionName(category) {
  if (category === "Chocolates") return "chocolates";
  return "chips-namkeens";
}

const lines = rawList.trim().split("\n").map(l => l.trim()).filter(Boolean);
const parsedProducts = [];

let counter = 5000;
for (const line of lines) {
  const p = parseLine(line);
  if (!p.name) continue;

  const category = getCategory(p.name);
  const subCategory = getSubCategory(p.name, category);
  const brand = getBrand(p.name);
  
  // Clean up product name slightly if needed (e.g. typos, leading/trailing space)
  let cleanName = p.name
    .replace(/\s+/g, " ")
    .replace(/Lay'S/g, "Lay's")
    .replace(/alt & Pepper/g, "Salt & Pepper")
    .replace(/Sweer Karam/g, "Sweet Karam")
    .replace(/Chrunchy/g, "Crunchy")
    .replace(/tomato/g, "Tomato")
    .replace(/Snaks/g, "Snacks")
    .replace(/Dahi Papd Chaat/g, "Dahi Papdi Chaat")
    .replace(/Litted/g, "Limited")
    .replace(/Strwaberry/g, "Strawberry")
    .replace(/Collectiuon/g, "Collection")
    .replace(/as Sorted/g, "Assorted")
    .replace(/Chocolated/g, "Chocolate")
    .replace(/<Luxury/g, " Luxury")
    .trim();

  // If cleanName ends with a comma, remove it
  if (cleanName.endsWith(",")) {
    cleanName = cleanName.slice(0, -1).trim();
  }

  const formatted = {
    id: `added_prod_${counter++}`,
    name: cleanName,
    category: category,
    subCategory: subCategory,
    subcategory: "",
    tags: [
      category.toLowerCase(), 
      subCategory.toLowerCase(), 
      brand.toLowerCase(),
      ...cleanName.toLowerCase().split(/[\s,()_+&-\/.*<>]+/).filter(w => w.length > 2)
    ],
    isTrending: false,
    price: Number(p.price || 0),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : Math.round(Number(p.price || 0) * 1.25),
    weight: p.weight || "1 Pc",
    stock: 50,
    image: getProductImage(subCategory, cleanName),
    section: getSectionName(category),
    brand: brand,
    description: `${cleanName}. Sourced fresh and packed under strict hygiene conditions. Sourced with high-quality standards.`,
    eta: "30 MINS",
    isAd: false,
    variants: []
  };

  parsedProducts.push(formatted);
}

console.log(`Parsed ${parsedProducts.length} new products.`);

const seedFilePath = path.resolve(__dirname, "seed.js");
const existingProducts = require("./seed");
console.log(`Loaded ${existingProducts.length} existing products from seed.js.`);

// To avoid duplicate adding if run multiple times, filter out if same name already exists
const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase().trim()));
const newProductsToSeed = parsedProducts.filter(p => !existingNames.has(p.name.toLowerCase().trim()));

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
    .connect(process.env.MONGO_URI)
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
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
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
  console.log("MONGO_URI not found in environment variables. Database was not seeded automatically.");
}

function decache(moduleName) {
  const resolved = require.resolve(moduleName);
  delete require.cache[resolved];
}
