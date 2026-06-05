const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = `
name:RAW Pressery Refreshers Cranberry,Schweppes Indian Tonic Water Can,price:210,originalPrice:256,weight:1 Combo
name:Sappe Apple With Aloe-Vear Cubes,price:85,weight:365 ml
name:Abset Popping Yogurt Boba Can Lychee,price:99,weight:320 ml
name:RAW Pressery Refreshers Cranderry,Bisleri Extra Power Club Soda,price:199,originalPrice:206,weight:1 Combo
name:RAW Pressery Party Combo Valencia Orange,Alphonso Mango,Sugarcane,Pomegranate,price:411,originalPrice:456,weight:1 Combo
name:Poko Loko Melon Nata,price:70,weight:300 ml
name:O'Cean Peach & Passion Fruit Juice,price:136,originalPrice:140,weight:2 Bottles
name:Abbie's Giggles Popping Boba With Lychee,price:125,weight:320 ml
name:RAW Pressery Party Combo Valencia Orange & Pomogranate,price:795,weight:1 Combo
name:Tu Coconut Water With Malai Chunks_Pack Of 6,price:299,originalPrice:450,weight:1.2 Litre
name:Cozzo Konnyaku Assorted Jelly,price:150,weight:300 g
name:Fruitoria Basil Seed Drink Strawberry,price:120,weight:300 ml
name:NOICE Natural Coconut Water(200 ml) & NOICE Salted Tapioca Chips(50g),price:99,originalPrice:116,weight:1 Combo
name:Paper Boat Nata De Coco - Mango pet & Paper Boat Zero Calorie Indian Tonic Water,price:99,weight:1 Combo
name:Abset Popping Yogurt Boba Can Peach,price:99,weight:320 ml
name:RAW Pressery Party Combo Valencia Orange & Sugarcane Juice,price:550,originalPrice:617,weight:1 Combo
name:Real MIxed Fruit & Real Fruit Power Litchi Vitamin Boost,price:215,originalPrice:250,weight:1 Combo
name:V SuperDrinks Pistachio Milkshake,price:40,weight:180 ml
name:Poko Loko Strawberry Nata Drink,price:70,weight:300 ml
name:Poko Loko Strawberry Nata Drink,price:70,weight:300 ml
name:Real Fruit Power Pomegranate Juice,price:122,originalPrice:144,weight:1 Litre
name:Paper Boat Swing Zesty Pomegrante Juice Enriched With Vitamin D,price:110,weight:1 Combo
name:Coco Charge 100% Tender Coconut Water,price:299,originalPrice:336,weight:1 Combo
name:B Natural Select Tender Coconut Water Bottle,price:359,weight:200 ml * 6
name:Frooti Mango Drink Bottle,price:70,weight:1.2 Litre
name:Tropicana Guava Delight Juice,price:179,weight:180 ml * 8
name:Tropicana Mango Delight Juice,price:199,weight:200 ml * 6
name:Storia Pomegranate Juice-No SUgar,price:178,originalPrice:225,weight:765 ml
name:Del Monte Peach Fruit Drink,price:299,originalPrice:356,weight:240 ml * 6
name:Rani Float Pineappple Fruit Juice,price:120,weight:240 ml
name:Raw Pressery Party Combo Sugarcane,Mix Fruit,Alphonso Mango Juice,price:615,originalPrice:702,weight:1 Combo
name:Paldo Pororo Korean Juice Drink Milk Flavor,price:120,weight:235 ml
name:Rachel's Orchard Passion Fruit Concentrate,price:428,originalPrice:450,weight:500 ml
name:NOICE Natural Coconut Water(200 ml),NOICE Kerala Nendran Banana Chips(100 g),price:143,originalPrice:174,weight:1 Combo
name:PapaNata Blueberry Drink,price:70,weight:320 ml
name:Real Masala Pomegranate Juice,price:99,originalPrice:160,weight:1 Litre
name:Real Litchi Juice,price:99,weight:1.25 Ltre
name:Real Fruit Power Mango Juice,price:199,originalPrice:220,weight:1 Litre * 2
name:Slice Mango Drink,price:64,originalPrice:70,weight:1.2 Litre
name:PapaNata Lychee Drink,price:65,originalPrice:70,weight:320 ml
name:Real Fruit Power Mosambi Juice,price:122,originalPrice:144,weight:1 Litre
name:Mogu Mogu Orange Juice 300 ml,price:299,weight:320 ml * 4
name:Maaza Refresh Mango,price:60,weight:150 ml * 6
name:Red Bull Energy Drink,price:125,,weight:250 ml
name:Red Bull Energy Drink-Sugar Free,price:125,weight:250 ml
name:Star Imported Energy Drink,price:99,weight:250 ml
name:Monster Energy Ultr Zero Sugar,price:124,weight:350 ml
name:Red Bull Energy Drink(pack of 6),price:700,weight:6 Pieces
name:Powerade Mountain Blast Pet,price:46,originalPrice:50,weight:500 ml
name:Gatorade Blue Bolt Zero Sugar Energy Drink,price:80,weight:250 ml * 4
name:Gatorade Blue Bolt Zero Sugar,price:315,originalPrice:,weight:500 ml *6
name:Owerade Fruit Punch Pet,price:20,weight:250 ml
name:Powerade Mountain Blast Pet,price:20 ,weight:250 ml
name:Gatorade Lemon Zero Sugar,price:20,weight:250 ml
name:Monster Energy Drink,price:124,originalPrice:125,weight:350 ml
name:Powerade Fruit Punch Pet,price:50,weight:500 ml
name:Adrenaline Rush Energy Drink - Black 300 ml,price:120,weight:300 ml * 2
name:Red Bull Energy, The Pink Edition,price:125,weight:250 ml
name:Red Bull Energy Drink,The Yellow Edition,price:125,weight:250 ml
name:Adrenaline Rush Energy Drink-Gold ,price:234,originalPrice:250,weight:300 ml * 4
name:Adrenaline Rush Energy Drink-Black (300 ml),Adrenaline Rush Energy Drink-300 ml,price:122,weight:1 Combo
name:Gatorade Orange Zero Sugar,price:50,weight:500 ml
name:Fast & Up Reload Zero Sugar - Instant Energy Drink-Orange Flavor,price:70,weight:500 ml
name:Gatorade Lemon Zero Sugar,price:50,weight:500 ml
name:Twitch Jamaican Energy Drink(Mixed Fruit),price:110,weight:250 ml
name:Predator Energy Drink Can 300 ml,price:120,weight:300 ml *2 
name:Gatorade Orange Zero Sugar Energy Drink,price:85,weight:250 ml * 4
name:Fast & Up Reload Energy Drink Low Sugar Electrolyte _ Orange Flavour,price:265,originalPrice:315,weight:20 Tablets
name:Fast & Up Reload Energy Drink Low Sugar Electrolyte _ Lime Lemon Flavor,price:644,originalPrice:795,weight:20 Tablets * 3
name:Thums Up X Force, Zero Sugar Body Armor,price:99,weight:1 Combo
name:Red Bull Energy Drink,The Green Edition 250 ml,price:859,weight:250 ml * 6
name:Campa Energy Gold Boost 330 ml,price:120,weight:330 ml * 2
name:XTCY Orange Zero Sugar Energy Drink,price:199,weight:250 ml * 2
name:Wild Rock Energy Drink Classic,price:60,weight:250 ml
name:XTCY Mango Zero Sugar Energy Drink,price:199,weight:250 ml * 2
name:Zyro by Karan Aujla Hydration Drink,price:60,weight:400 ml
name:Prime Hydration Ice Pop,price:412,weight:500 ml
name:HELL Energy Drink Watermelon,price:60,weight:250 ml
name:RAW Pressery Raw Power Energy Drink,price:285,originalPrice:297,weight:250 ml * 3
name:Hurricane Energy Drink & Lays Potato Chips,price:128,weight:1 Combo
name:Campa Energy Drink Gold Blast,price:30,weight:185 ml
name:HUEL Daily A-Z Cherry & Raspberry Energy Drink,price:412,weight:330 ml
name:HELL Energy Drink Classic & Bingo Original,price:134,originalPrice:,weight:1 Combo
name:Sting Energy Drink,price:20,weight:300 ml
name:Monster Mango,price:369,originalPrice:370,weight:500 ml
name:RIO Boom Energy Drink,price:99,weight:250 ml * 2
name:HELL Energy Drink Apple,price:399,weight:250 ml * 6
name:Coca-Cola Soft Drink Bottle,price:40,weight:750 ml
name:Bisleri Mineral Water,price:20,weight:1 Litre
name:Coca-cola Diet Coke Can,price:269,weight:300 ml * 6
name:Kinely Mineral Water Bottle,price:20,weight:1 Litre
name:Sprite Soft Drink Can,price:40,weight:300 ml
name:Kinley Strong Soda,price:20,weight:750 ml
name:Thums Up Soft Drink Can,price:40,weight:300 ml
name:coca-cola Soft Drink can,price:40,weight:300 ml
name:Paper Boat Zero Sugar Mint Mojito Sparkling Water,price:60,weight:600 ml
name:Coca-Cola Zero Soft Drink Can2Pieces,price:80,weight:300 ml * 2
namePaper Boat Zero Sugar Ginger Lemon Sparkling Water:,price:60,weight:600 ml
name:Thums Up X Force | Zero Sugar,price:40,weight:300 ml
name:Sprite Zero Sugar can,price:40,weight:300 ml
name:Paper Boat Zero Sugar Sparkling Coffee Dark Roast,price:60 ,weight:600 ml
name:Pepsi Zero Sugar Soft Drink,price:80,weight:300 ml * 2
name:Coke Sugar free,price:160,weight:2 Litre
name:Pepsi Zero Sugar Soft Drink(300 ml)-Pack of 6,price:240,weight:1.8 Litre
name:O'cean Fruit Water Strawberry & Lime Vitamin & Electrolyte Hydration,price:120,originalPrice:130,weight:1 Litre
name:O'cean Fruit Water Strawberry & Lime Vitamin & Electrolyte Hydration,price:70,weight:500 ml
name:Kinley Mineral Water Bottle,price:39,originalPrice:40,weight:1 Litre * 2
name:Bisleri Mineral Water,price:30,weight:2 Litre
name:De Cubes Ice Cubes,price:85,weight:1 kg
name:Bisleri Mineral Water,price:240,weight:1 Litre * 12
name:Aquafina Mineral Water Bottle,price:20,weight:1 Litre
name:Dras Ice Cubes,price:50,weight:500 g
name:Bisleri Water,price:144,weight:24 Pieces
name:Clear Premium Drinking Water,price:237,originalPrice:240,weight:12 Litre
name:Clear Premium Drinking Water,price:277,originalPrice:288,weight:48 Pieces
name:Clear Prmium Drinking Water,price:70,weight:6 Litre
name:Bisleri Water Can,price:125,weight:10 Litre
name:Fresh Ice Cubes,price:85,weight:1 kg
name:Dr Cubes Ice,price:45,weight:500 g
name:Aquafina Minaral Water bottle,price:74,weight:2 Litre * 2
name:Himalayan Natural Mineral Water,price:801,originalPrice:960,weight:1 Litre * 12
name:Burff -Sparkling Ice Cubes,price:90,weight:1 kg
name:Tata Copper Plus Water,price:20,weight:1 Litre
name:Bisleri Vedica Natural Mountain Mineral water,price:120,weight:1 Litre * 2
`;

function parseLine(line) {
  let cleanLine = line
    .replace(/namePaper Boat/g, "name:Paper Boat")
    .replace(/Sparkling Water:/g, "Sparkling Water")
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
  if (lowerName.includes("misfits") || lowerName.includes("misfit")) return "Misfits";
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
  if (lowerName.includes("raw pressery") || lowerName.includes("raw")) return "Raw Pressery";
  if (lowerName.includes("storia")) return "Storia";
  if (lowerName.includes("coco charge")) return "Coco Charge";
  if (lowerName.includes("b natural")) return "B Natural";
  if (lowerName.includes("moi soi")) return "Moi Soi";
  if (lowerName.includes("dollin")) return "Dollin";
  if (lowerName.includes("fruitoria")) return "Fruitoria";
  if (lowerName.includes("abbie")) return "Abbie's";
  if (lowerName.includes("sappe")) return "Sappe";
  if (lowerName.includes("abset")) return "Abset";
  if (lowerName.includes("poko loko")) return "Poko Loko";
  if (lowerName.includes("o'ocean") || lowerName.includes("ocean")) return "O'ocean";
  if (lowerName.includes("cozzo")) return "Cozzo";
  if (lowerName.includes("v superdrinks")) return "V SuperDrinks";
  if (lowerName.includes("frooti")) return "Frooti";
  if (lowerName.includes("del monte")) return "Del Monte";
  if (lowerName.includes("rani float")) return "Rani Float";
  if (lowerName.includes("paldo pororo")) return "Paldo Pororo";
  if (lowerName.includes("rachel")) return "Rachel's Orchard";
  if (lowerName.includes("papanata")) return "PapaNata";
  if (lowerName.includes("slice")) return "Slice";
  if (lowerName.includes("red bull")) return "Red Bull";
  if (lowerName.includes("monster")) return "Monster";
  if (lowerName.includes("powerade") || lowerName.includes("owerade")) return "Powerade";
  if (lowerName.includes("gatorade")) return "Gatorade";
  if (lowerName.includes("adrenaline")) return "Adrenaline Rush";
  if (lowerName.includes("fast & up")) return "Fast & Up";
  if (lowerName.includes("twitch")) return "Twitch";
  if (lowerName.includes("predator")) return "Predator";
  if (lowerName.includes("campa")) return "Campa";
  if (lowerName.includes("xtcy")) return "XTCY";
  if (lowerName.includes("wild rock")) return "Wild Rock";
  if (lowerName.includes("zyro")) return "Zyro";
  if (lowerName.includes("prime")) return "Prime";
  if (lowerName.includes("hell")) return "Hell";
  if (lowerName.includes("huel")) return "Huel";
  if (lowerName.includes("sting")) return "Sting";
  if (lowerName.includes("rio")) return "Rio";
  if (lowerName.includes("bisleri")) return "Bisleri";
  if (lowerName.includes("aquafina")) return "Aquafina";
  if (lowerName.includes("clear premium") || lowerName.includes("clear prmium")) return "Clear";
  if (lowerName.includes("burff")) return "Burff";
  if (lowerName.includes("tata copper")) return "Tata";
  return "Other";
}

function getSubCategory(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("coconut") || lowerName.includes("nariyal") || lowerName.includes("coco charge") || lowerName.includes("tu coconut")) {
    return "Coconut Water";
  }
  if (lowerName.includes("juice") || lowerName.includes("aamras") || lowerName.includes("fruity") || lowerName.includes("tpk") || lowerName.includes("guava") || lowerName.includes("mango drink") || lowerName.includes("pomegranate") || lowerName.includes("litchi") || lowerName.includes("lychee") || lowerName.includes("pineapple") || lowerName.includes("mixed fruit") || lowerName.includes("fruit drink") || lowerName.includes("perrier") || lowerName.includes("rachel") || lowerName.includes("papanata") || lowerName.includes("slice") || lowerName.includes("maaza") || lowerName.includes("mango") || lowerName.includes("mogu mogu") || lowerName.includes("sappe") || lowerName.includes("poko loko") || lowerName.includes("del monte") || lowerName.includes("rani float") || lowerName.includes("paldo pororo") || lowerName.includes("abset") || lowerName.includes("bobas") || lowerName.includes("boba")) {
    return "Fruit Juices";
  }
  if (lowerName.includes("soda") || lowerName.includes("mixers") || lowerName.includes("tonic") || lowerName.includes("ginger ale") || lowerName.includes("banta") || lowerName.includes("cola soda") || lowerName.includes("masala soda") || lowerName.includes("lime & chilli") || lowerName.includes("kokum") || lowerName.includes("sparkling water") || lowerName.includes("mojito") || lowerName.includes("yuzu orange") || lowerName.includes("peach water") || lowerName.includes("lemonlime") || lowerName.includes("sparkling drink") || lowerName.includes("beer") || lowerName.includes("coolberg") || lowerName.includes("water") || lowerName.includes("aquafina") || lowerName.includes("bisleri") || lowerName.includes("kinley") || lowerName.includes("kinely") || lowerName.includes("clear premium") || lowerName.includes("clear prmium") || lowerName.includes("ice cubes") || lowerName.includes("burff") || lowerName.includes("ice") || lowerName.includes("jelly") || lowerName.includes("konnyaku")) {
    return "Soda & Mixers";
  }
  if (lowerName.includes("coffee") || lowerName.includes("tea") || lowerName.includes("ice tea") || lowerName.includes("iced tea")) {
    return "Ice Tea";
  }
  if (lowerName.includes("energy") || lowerName.includes("monster") || lowerName.includes("red bull") || lowerName.includes("mountain dew") || lowerName.includes("force") || lowerName.includes("b fizz") || lowerName.includes("powerade") || lowerName.includes("gatorade") || lowerName.includes("adrenaline") || lowerName.includes("fast & up") || lowerName.includes("reload") || lowerName.includes("twitch") || lowerName.includes("predator") || lowerName.includes("xtcy") || lowerName.includes("wild rock") || lowerName.includes("zyro") || lowerName.includes("prime") || lowerName.includes("hell") || lowerName.includes("huel") || lowerName.includes("sting") || lowerName.includes("rio") || lowerName.includes("body armor") || lowerName.includes("owerade")) {
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

let counter = 3000;
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