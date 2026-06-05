const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = `
name:Paper Boat Zero Sugar Sparkling Coffee Dark Roast,Sugar Free Coffee Drink,price:70,weight:600 ml
name:Sprite Soft Drink Bottle,price:35,weight:750 ml
name:Star imported Mocktail,Saudi Cocktail,price:70,weight:300 ml
name:Coca-Cola Zero Soft drink Pet Bottle,price:99,originalPrice:130,weight:750 ml * 3
name:Sprite Zero,price:30,originalPrice:40,weight:750 ml
name:Coca-Cola Soft Drink Bottle,price:40,weight:750 ml
name:Thumbs Up Soft Drink Bottle,price:77,originalPrice:80,weight:750 ml * 2
name:Pepsi Zero Sugar Soft Drink,price:20,weight:400 ml
name:Coca-Cola Soft Drink Can,price:170,weight:300 ml * 4
name:Sprite Soft Drink,price:180,originalPrice:200,weight:2.25 Litre * 2
name:Pepsi Soft Drink Bottle,price:148,originalPrice:160,weight:750 ml * 4
name:Thumbs Up X Force,price:20,weight:400 ml
name:Paper Boat Zero Prebiotic Soda Lemon Lime,price:60,weight:300 ml
name:Sprite Zero Can,price:250,weight:300 ml * 6
name:Thumbs Up Soft Drink Bottle,price:180,originalPrice:200,weight:2.25 Litre * 2
name:Peping Lemon Breeze,price:329,originalPrice:480,weight:250 ml * 6
name:Sprite Soft Drink Bottle,price:70,weight:1.25 Litre
name:Sprite Soft Drink Bottle,price:80,weight:300 ml * 2
name:Pepsi Zero Sugar Soft Drink,price:199,originalPrice:250,weight:300 ml * 6
name:Fanta Soft Drink Bottle,price:40,weight:750 ml
name:7 Up Zero Sugar Soft Drink PET,price:20,weight:400 ml
name:Sprite Soft Drink 250 ml,price:170,weight:2 Litre
name:Thums Up Pet,price:155,originalPrice:170,weight:8 Pieces
name:Peping Watermelon Zing,price:120,originalPrice:170,weight:250 ml * 2
name:NOICE Fresh Lime Soda,price:240,originalPrice:376,weight:200 ml * 4
name:Shift Low Calorie Orange Soda,price:89,weight:250 ml
name:Schweppes Zero Calories Flavoured Sparkling Water-600 ml,price:190,originalPrice:240,weight:600 ml * 4
name:Appy Fizz Apple Juice(Bottle),price:120,weight:1 Litre * 2
name:Thums Up Soft Drink Bottle,price:70,weight:1.25 Litre
name:Shift Low Calorie Lemon-Lime Soda,price:89,weight:250 ml
name:Pepsi Soft Drink 300 ml,price:140,weight:300 ml * 3
name:Paper Boat Lime & Lemon Flavoured Sparkling Water,price:149,weight:600 ml * 2
name:Pepsi Soft Drink Bottle,price:200,weight:2250 ml * 2
name:Coolberg Peach Non Alcoholic Beer,price:120,weight:330 ml
name:Paper Boat Zero Sugar Mint Mojito Sparkling Water,price:140,weight:600 ml * 2
name:Coca-Cola Zero Soft Drink Can 300 ml,price:90,weight:1 Combo
name:Paper Boat Zero Sugar Yuzu Orange Sparkling waterprice:70,weight:600 ml
name:Coolberg Strawberry Non-Alcoholic Beer,price:120,weight:330 ml
name:NOICE Jeera Masala Soda,price:299,originalPrice:379,weight:200 ml * 4
name:Limca lime 'n' Lemoni Soft Drink Bottle,price:50,weight:750 ml
name:Coke Zero Pet * * MP,price:166,originalPrice:180,weight:2 Litre
name:Coolberg Cranberry Non Alcoholic Beer,price:120,weight:330 ml
name:Pepsi Zero Sugar Soft Drink(300 ml)-Pack Of 6,price:240,originalPrice:344,weight:1.8 Litre
name:MISFITS Prebiotic Soda_ Grape 250 ml,price:300,originalPrice:434,weight:250 ml * 4
name:BOMBAY BANTA Kala Khatta Soda,price:20,weight:250 ml
name:Paper Boat Zero Sugar Peach Sparkling Water,price:70,weight:600 ml
name:Sprite(Bottle),price:20,weight:250ml
name:Paper Boat Cumin Sparkling Water,price:130,weight:600 ml * 2
name:Mirinda Soft Drink ,price:400 ml,weight:20
name:BOMBAY BANTA Masala Cola Soda,price:20,weight:250 ml
name:BOMBAY BANTA Masala Soda,price:20,weight:250 ml
name:Fanta Soft Drink Can,price:45,weight:300 ml
name:Himalayan Sparkling Water 300 ml,price:254,originalPrice:290,weight:300 ml * 2
name:Paper Boat Zero Suagr Green Apple Sparkling Water,price:190,originalPrice:200,weight:600 ml * 3
name:Gunsberg Ginger Ale-Grapefruit Flavour,price:99,weight:325 ml
name:Misfits Prebiotic Soda - Mango x Chilli,price:399,originalPrice:460,weight:250 ml * 6
name:Coke Soft Drink Vanilla,price:210,weight:320 ml
name:NOICE Lime & Chilli Soda,price:99,weight:250 ml
name:Appy Fizz Apple Juice(Can),price:40,weight:250 ml
name:Nestle Perrier Water Glass Bottle,price:210,weight:330 ml
name:Fanta Grape Flavoured Drink,price:149,weight:320 ml
name:NOICE Real Soda Combo Pack,price:199,originalPrice:276,weight:1 Combo
name:Pepsi Soft Drink Bottle & Kurkure Namkeen Masala Munch,price:70,weight:1 Combo
name:7Up Soft Drink Can,price:45,weight:300 ml
name:Match Time Chilling No Sugar Combo,price:170,weight:1 Combo
name:Bloody Bubbly Berry Masala Soda,price:70,weight:250 ml
name:Fanta 250 ml pack of 8,price:180,weight:2 Litre
name:B Fizz Soft Drink Can,price:45,weight:250 ml
name:Mountain Dew Soft Drink Can,price:240,weight:1.8 Litre
name:Match Party Starter Combo,price:130,weight:1 Combo
name:Sprite Soft Drink Bottle & Kurkure Yummy Cheese Puffcorn Crisps,price:85,weight:1 Combo
name:BOMBAY BANTA Masala Soda(Pack Of 12),price:180originalPrice:270,weight:12 Pieces
name:Paper Boat Green Apple Sparkling Water(600 ml * 1) & Lime Flavoured Sparkling water(600 ml * 1),price:170,weight:1 Combo
name:Sprite pet Bottle(750 ml) & Bingo Mad Angles Achaari Masti 130 gm,price:99,weight:1 Combo
name:Fanta Soft Drinks Bottle (750 ml) & Too Yumm - Potato Chips American Sour Cram,price:99,weight:1 Combo
name:Sepoy & Co Sparkling Mineral Water,price:95,weight:200 ml
name:Cini Kum Lemon POP,price:35,weight:160 ml
name:7Up Spicelt PlaylistB Can Soft Drinks,price:180,weight:300 ml * 4
name:7Up Spicelt Playlist Can Soft Drinks & Sunfeast yippee Korean Noodles Fiery Hot,price:99,weight:1 Combo
name:VIDA Zero Calorie Sakuara Flavoured Sparkling Drink,price:110,weight:325 ml
name:Paper Boat Zero Prebiotic Soda Yuzu Orange,price:70,weight:300 ml
name:Hostar Match Combo,price:183,weight:1 Combo
name:Appy Apple Drink,price:120,weight:125 ml * 10
name:Coca-Cola & Yummiez Chicken Popcorn Combo,price:315,weight:1 Combo
name:Polka Pop Peach Water & Polka Pop Lemon Lime Water Combo,price:99,weight:1 Combo
name:7 Up Soft Drink Bottle (750 ml) & Orion Turtle Chips-Spicy Devil Corn Chip(70 gm),price:122,weight:1 Combo
name:Jimmy's Zero Sugar Cranberry Lime Sparkling Water,price:70,weight:600 ml
name:Pepsi Soft Drink Bottle,price:179,weight:1.25 Litre * 2
name:Coca-Cola Lemon,price:249,weight:330 ml
name:Jimmy's Zero Sugar Mango Passion Sparkling Water 600 ml,price:140,weight:600 ml * 2
name:Polka Pop Peach Sparkling Water,price:45,weight:300 ml
name:Pepsi Soft Drink Bottle,price:180,,weight:250 ml * 8
name:Sprite Lemon-Lime Zero Sugar Soft Drink,price:170,weight:320 ml
name:7Up Spicelt Playlist Can Soft Drink & Uncle Chips Spicy Treat,price:80,weight:1 Combo
name:Polka Pop Lemonlime Sparkling Water,price:99,weight:300 ml * 2
name:Jimmy's Zero Sugar Green Apple Sparkling Water,price:70,weight:600 ml
name:Coco-cola,price:489,weight:2.5 Litre * 4
name:7Up Spicelt Playlist Can Soft Drinks & Nissin Geki Hot & Korean Veg Noodles,price:99,weight:1 Combo
name:Polka Pop Orange Sparkling Water & Polka Pop Lemonlime Sparkling Water Combo,price:99,weight:1 Combo
name:Thums Up,price:489,weight:2.5 Litre * 4
name:7Up Zero Sugar Soft Drink(330 ml) & Orion Turtle Chips(70g),price:120,weight:1 Combo
name:Mountain Dew Soft Drink,price:110,weight:2.25 Litre
name:7Up Zero Sugar Soft Drink(330 ml) & Nongshim Shin Red Spicy Noodles(120gm),price:179,originalPrice:199,weight:1 Combo
name:BOMBAY BANTA Lemon Soda,price:20,weight:250 ml
name:Polka Pop Cranberry Sparkling Water & Polka Pop Lemonlime Sparking Water Combo,price:99,weight:1 Combo
name:Fanta Berry,price:249,weight:320 ml
name:NGL Prebiotic Sparkling With Triple Fibre Goodness,price:99,weight:250 ml
name:7Up Pink Lemonade Zero Sugar,price:220,weight:330 ml
name:Fanta Strawberry Flavoured Drink,price:220,weight:320 ml
name:7Up Zero Sugar Soft Drink,price:189,weight:330 ml • 4
name:NOICE Kokum Jeera Soda With Real Kokum Extract,price:99,weight:250 ml
name:7Up Spcielt Playlist Can Soft Drink & Nissin Cup Noodles Veggie Manchow,price:100,weight:1 Combo
name:Pepsi Black 500 ml Bottle,price:99,weight:500 ml * 4
name:Fanta Orange Flavored,price:480,weight:2.5 Litre * 4
name:Maaza Mango Drink Bottle,price:70,weight:600 ml * 2
name:Maaza Mango Drink TPK(Pack of 10),price:130,weight:1500 ml
name:Mogu Mogu Lychee Fruit Drink With Nata De Coco,price:80,weight:320 ml
name:Paper Boat Nata De Coco - Lychee,price:85,weight:250 ml * 2
name:Real Activ 100% Orange Juice,price:160,weight:1 Litre
name:Real Fruit Power Activ 100% Apple Juice,price:450,originalPrice:515,weight:1 Litre * 3
name:Minute Maid pulpy Orange Juice,price:85,weight:1 Litre
name:Paper Boat Mango Fruit Drink With Chewy Cubes,price:45,weight:250 ml
name:Real Activ 100% Juice Pomegranate,price:156,originalPrice:,weight:1 Litre
name:Real Fruit Power Activ 100% Mixed Fruit Juice,price:156,weight:1 Litre
name:Paper Boat Aamras Fruit Drink,price:125,weight:200 ml * 3
name:Tropicana Litchi Delight Juice,price:215,originalPrice:260,weight:1 Litre * 2
name:Paper Boat Mango Fruit Drink With Chewy Cubes,price:45,weight:250 ml
name:Paper Boat Swing Yummy Guava,price:67,originalPrice:120,weight:1.2 Litre
name:RAW Pressery Alphonso Mango Juice,price:60,weight:200 ml
name:RAW Pressery Alphonso Mango Juice,price:215,originalPrice:254,weight:1 Litre
name:Paper Boat Aamras Fruit Drink,price:125,weight:200 ml * 3
name:Paper Boat Swing Lively Orange,price:96,weight:1.2 Litre
name:Frooti Tetra Pack,price:10,weight:150 ml
name:Minute Maid Pulpy Orange Pet,price:25,weight:250 ml
name:RAW Pressery Refreshers Pineapple Juice,price:115,originalPrice:160,weight:750 ml
name:Paper Boat Swing Slurpy Mango,price:99,originalPrice:130,weight:1.2 Litre
name:Storia Tender Coconut Water -No Sugar,price:137,originalPrice:189,weight:1 Litre
name:Real Fruit Power Cranberry Juice,price:276,originalPrice:290,weight:1 Litre * 2
name:NOICE Natural Coconut Water,price:999,originalPrice:1776,weight:200 ml * 24
name:Paper Boat Swing Crispy Cranberry,price:99,originalPrice:140,weight:1.2 Litre
name:Raw Pressery Berry Healthy,price:143,originalPrice:170,weight:250 ml * 2
name:Paper Boat Swing Slurpy Mango Juice Enriched With VItamin D,price:40,weight:600 ml
name:RAW Pressery Refreshers Sugarcane Juice,price:130,originalPrice:160,weight:750 ml
name:COCO Charge 100% Tender Coconut Water(Pack Of 6),price:289,originalPrice:370,weight:1.2 Litre
name:B Natural Cranberry Juice,price:99,originalPrice:156,weight:1 Litre
name:Real Coconut Water,price:199,originalPrice:356,weight:1 Litre * 2
name:Paper Boat Orange Fruit Drink With Chewy Cubes,price:40,weight:250 ml
name:COCO Charge 100% Organic Tender Coconut Water(Pack Of 6),price:469,originalPrice:5024,weight:1.2 Litre
name:Paper Boat Mixed Berries Fruit Drink With Chewy Cubes,price:40,weight:250 ml
name:Real Pineapple Juice,price:135,weight:1 Litre
name:NOICE Fresh Apple Juice,price:85,originalPrice:110,weight:150 ml
name:MOI SOI Popping Boba With Lychee Fruit Drink,price:99,originalPrice:150,weight:330 ml
name:Tropicano Mixed Fruit Delight Juice,price:189,originalPrice:250,weight:1 Litre * 2
name:RAW Pressery Sugarcane Juice,price:222,originalPrice:234,weight:1 Litre
name:B Natural No Added Sugar Mixed Fruit,price:112,originalPrice:162,weight:750 ml
name:Paper Boat Coconut Water,price:100,weight:200 ml * 2
name:RAW Pressery Sugarcane Juice,price:149,weight:250 ml * 2
name:Mogu Mogu Lychee Juice 25% with Nata De Coco,price:199,weight:1 Litre
name:Dollin Papaya Coconut Milk Drink,price:125,weight:300 ml
name:Fruitoria Basil Seed Drink Orange,price:120,weight:300 ml
name:Abbie's Giggles Popping Boba With Mango,price:125,weight:320 ml
name:Maison Perrier Sparkling Beveraage Forever Lemon,price:270,weight:250 ml
name:Fruitoria Basil Seed Drink Lychee,price:125,weight:300 ml
`;

function parseLine(line) {
  let cleanLine = line
    .replace(/waterprice:/g, "water,price:")
    .replace(/180originalPrice:/g, "180,originalPrice:");
  
  if (cleanLine.includes("name:Mirinda Soft Drink")) {
    cleanLine = "name:Mirinda Soft Drink,price:20,weight:400 ml";
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

function getBrand(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("paper boat")) return "Paper Boat";
  if (lowerName.includes("sprite")) return "Sprite";
  if (lowerName.includes("star imported") || lowerName.includes("star")) return "Star";
  if (lowerName.includes("coca-cola") || lowerName.includes("coke") || lowerName.includes("coco-cola")) return "Coca-Cola";
  if (lowerName.includes("thumbs up") || lowerName.includes("thums up")) return "Thums Up";
  if (lowerName.includes("pepsi")) return "Pepsi";
  if (lowerName.includes("fanta")) return "Fanta";
  if (lowerName.includes("7 up") || lowerName.includes("7up")) return "7Up";
  if (lowerName.includes("peping")) return "Peping";
  if (lowerName.includes("noice")) return "NOICE";
  if (lowerName.includes("shift")) return "Shift";
  if (lowerName.includes("schweppes")) return "Schweppes";
  if (lowerName.includes("appy fizz") || lowerName.includes("appy")) return "Appy";
  if (lowerName.includes("coolberg")) return "Coolberg";
  if (lowerName.includes("limca")) return "Limca";
  if (lowerName.includes("misfits")) return "Misfits";
  if (lowerName.includes("bombay banta")) return "Bombay Banta";
  if (lowerName.includes("mirinda")) return "Mirinda";
  if (lowerName.includes("himalayan")) return "Himalayan";
  if (lowerName.includes("gunsberg")) return "Gunsberg";
  if (lowerName.includes("nestle perrier") || lowerName.includes("perrier") || lowerName.includes("maison perrier")) return "Perrier";
  if (lowerName.includes("sepoy")) return "Sepoy & Co";
  if (lowerName.includes("cini kum")) return "Cini Kum";
  if (lowerName.includes("vida")) return "Vida";
  if (lowerName.includes("jimmy")) return "Jimmy's";
  if (lowerName.includes("polka pop")) return "Polka Pop";
  if (lowerName.includes("ngl")) return "NGL";
  if (lowerName.includes("maaza")) return "Maaza";
  if (lowerName.includes("mogu mogu")) return "Mogu Mogu";
  if (lowerName.includes("real")) return "Real";
  if (lowerName.includes("minute maid")) return "Minute Maid";
  if (lowerName.includes("tropicana") || lowerName.includes("tropicano")) return "Tropicana";
  if (lowerName.includes("raw pressery")) return "Raw Pressery";
  if (lowerName.includes("storia")) return "Storia";
  if (lowerName.includes("coco charge")) return "Coco Charge";
  if (lowerName.includes("b natural")) return "B Natural";
  if (lowerName.includes("moi soi")) return "Moi Soi";
  if (lowerName.includes("dollin")) return "Dollin";
  if (lowerName.includes("fruitoria")) return "Fruitoria";
  if (lowerName.includes("abbie")) return "Abbie's";
  return "Other";
}

function getSubCategory(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("coconut") || lowerName.includes("nariyal")) {
    return "Coconut Water";
  }
  if (lowerName.includes("juice") || lowerName.includes("aamras") || lowerName.includes("fruity") || lowerName.includes("tpk") || lowerName.includes("guava") || lowerName.includes("mango drink") || lowerName.includes("pomegranate") || lowerName.includes("litchi") || lowerName.includes("pineapple") || lowerName.includes("mixed fruit") || lowerName.includes("fruit drink") || lowerName.includes("perrier")) {
    return "Fruit Juices";
  }
  if (lowerName.includes("soda") || lowerName.includes("mixers") || lowerName.includes("tonic") || lowerName.includes("ginger ale") || lowerName.includes("banta") || lowerName.includes("cola soda") || lowerName.includes("masala soda") || lowerName.includes("lime & chilli") || lowerName.includes("kokum") || lowerName.includes("sparkling water") || lowerName.includes("mojito") || lowerName.includes("yuzu orange") || lowerName.includes("peach water") || lowerName.includes("lemonlime") || lowerName.includes("sparkling drink") || lowerName.includes("popping boba") || lowerName.includes("beer") || lowerName.includes("coolberg")) {
    return "Soda & Mixers";
  }
  if (lowerName.includes("coffee") || lowerName.includes("tea") || lowerName.includes("ice tea") || lowerName.includes("iced tea")) {
    return "Ice Tea";
  }
  if (lowerName.includes("energy") || lowerName.includes("monster") || lowerName.includes("red bull") || lowerName.includes("mountain dew") || lowerName.includes("force") || lowerName.includes("b fizz")) {
    return "Energy Drinks";
  }
  return "Soft Drinks";
}

function getProductImage(subCategory) {
  if (subCategory === "Fruit Juices") {
    return "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Energy Drinks") {
    return "https://images.unsplash.com/photo-1622543956221-15b5c6d6e5e7?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Coconut Water") {
    return "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Soda & Mixers") {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Ice Tea") {
    return "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop";
}

const lines = rawList.trim().split("\n").map(l => l.trim()).filter(Boolean);
const parsedProducts = [];

let counter = 2000;
for (const line of lines) {
  const p = parseLine(line);
  if (!p.name) continue;

  const subCategory = getSubCategory(p.name);
  const formatted = {
    id: `beverages_added_${counter++}`,
    name: p.name,
    category: "Beverages",
    subCategory: subCategory,
    subcategory: "",
    tags: [
      "beverages", 
      subCategory.toLowerCase(), 
      ...p.name.toLowerCase().split(/[\s,()_+&-\/]+/).filter(w => w.length > 2)
    ],
    isTrending: false,
    price: Number(p.price || 0),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : Math.round(Number(p.price || 0) * 1.25),
    weight: p.weight || "1 Pc",
    stock: 50,
    image: getProductImage(subCategory),
    section: "cold-drinks",
    brand: getBrand(p.name),
    description: `${p.name}. Sourced fresh and packed under strict hygiene conditions. Sourced with high-quality standards.`,
    eta: "30 MINS",
    isAd: false,
    variants: []
  };

  parsedProducts.push(formatted);
}

console.log(`Parsed ${parsedProducts.length} new beverage products.`);

const seedFilePath = path.resolve(__dirname, "seed.js");
const existingProducts = require("./seed");
console.log(`Loaded ${existingProducts.length} existing products from seed.js.`);

// To avoid duplicate adding if run multiple times, filter out if same name already exists
const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase().trim()));
const newProductsToSeed = parsedProducts.filter(p => !existingNames.has(p.name.toLowerCase().trim()));

console.log(`Of the parsed beverage products, ${newProductsToSeed.length} are new.`);

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