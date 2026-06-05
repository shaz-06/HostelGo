const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = `
name:Milky Mist Skyr Cup,price:131,originalPrice:160,weight:100 g * 2
name:Hatsun Yogurt Blueberry,price:39,weight:175 ml
name:Epigamia No Added Sugar Greek Yogurt-Strawberry,price:80,weight:85 g
name:Sid's Farm Curd,price:115,weight:450 g * 2
name:Sid's Farm Curd Pouch,price:25,weight:180 g
name:Heritage Cup Curd,price:50,weight:400 g
name:Milky Mist Fruit Yogurt-Blueberry,price:40,weight:100 g
name:Country Delight 10 g Protein Natural Greek Yoghurt 100 g,price:170,weight:100 g * 3
name:Epigamia Greek Yogurt-Mango,price:180,weight:85 g * 3
name:Akshayakalpa - Organic Probiotic Curd Pouch,price:115,weight:500 g * 2
name:Sid's Farm Pure Cow Curd,price:80,weight:400 g
name:Akshayakalpa - Organic Greek Yoghurt - Mango,price:60,weight:90 g
name:Milking Organic A2 Rich Curd,price:58,weight:400 g
name:Epigamia Greek Yogurt - Raspberry,price:180,weight:85 g * 3
name:Epigamia Lactose Free Curd,price:200,weight:400 g * 2
name:Epigamia Greek Yogurt - Strawberry,price:60,weight:85 g
name:Epigamia Lychee Flavoured Yogurt,price:30,weight:75 g
name:Milky Mist Mishti Doi,price:35,weight:100 g
name:Heritage Livo Strawberry Yogurt,price:30,weight:90 g
name:Milky Mist Fruit Yogurt - Strawberry,price:80,weight:100 ml * 2
name:Mother Dairy Mishti Doi,price:80,weight:400 g
name:Milky Mist Skyr Cup,price:160,weight:225 g
name:Sid's Farm High Protein Curd,price:99,weight:400 g
name:Epigamia Coconut Milk Blend Yogurt Jaggery Dairy Free,price:80,weight:90 g
name:Milky Mist Mango Shrikhand,price:45,weight:100 g
name:Amul Masti Set Curd Tub,price:125,weight:1 kg
name:Country Delight 10 g Protein Greek Yoghurt Vanilla,price:70,weight:100 g
name:Milky Mist Greek Yogurt Natural Pack of 4,price:215,weight:400 g
name:Milky Mist Elachi Shrikhand,price:45,weight:100 g
name:Heritage Pouch Curd & Heritage Cow Ghee,price:86,weight:1 Combo
name:Amul Shrikhand - Badam Pista,price:135,weight:500 g
name:Amul Shrikhand Kesar,price:135,weight:500 g
name:Milky Mist Shrikhand Mango,price:155,weight:400 g
name:Organic Mandya Desi A2 low fat curd,price:50,weight:400 g
name:Milky Mist Shrikhand Elachi,price:155,weight:400 g
name:Mamie Yova Fruit Yoghurt Strawberry,price:245,weight:90 g * 6
name:Mamie Yova Fruit Yoghurt Strawberry 90 g and Mamie Yova Fruit Yoghurt Blueberry,price:90,weight:1 Combo
name:Milky Mist Shrikhand Badam & Pista,price:155,weight:400 g
name:Mamie Yova Fruit Yoghrut Blueberry 90gm + Bagrry's granola with belgian dark chocolate,price:479,weight:1 Combo
name:Epigamia Greek Yogurt - Vanilla,price:360,weight:85 g * 6
name:Milky Mist Skyr 700 g,price:700,weight:700 g * 2
name:Hatsun Greek Yoghurt Red Cherry,price:50,weight:100 g
name:Milky Mist Skyr Pack of 4,price:285,weight:400 g
name:Epigamia Greek Yogurt - Natural,price:360,weight:85 g * 6
name:Nestle a+ Greek Yoghurt - Mahabaleshwar Strawberries 90 g,price:125,weight:90 * 2
name:Mamie Yova Fruit Yoghurt Blueberry 90gm + Sundeep Peanut Butter Creamy 300 gm,price:179,weight:1 Combo
name:Mamie Yova French Yogurt Creamy 400gm + Saffola masala oats karara crunch,price:365,weight:1 combo
name:Mamie Yova French Yogurt Creamy,price:255,weight:400 g * 2
name:Hatsun Fruit Yoghurt Mixed Berry,price:35,weight:100 g
name:Mamie Yova French Yogurt Creamy 400 gm + The whole truth nuts fruits & seeds,price:750,weight:1 Combo
name:iD Fresh Pouch Curd,price:110,weight:400 g * 2
name:Milking Organic Curd - Probiotic Rich,price:55,weight:400 g
name:Epigamia Kesar Badam Yogurt,price:155,weight:75 g * 3
name:Epigamia Greek Yogurt with Oats & Seed Mix(Chia,Amaranth & Flax Seeds),price:230,weight:85 g * 3
name:Epigamia Coconut Milk Blend Yogurt Unsweetened Dairy Free,price:70,weight:90 g
name:Hatsun Greek Yoghurt Fig and Dates,price:50,weight:100 g
name:Mother Dairy Classic Curd,price:220,weight:400 g * 4
name:Dobra Cotton Candy - Stawberry Blast,price:89,weight:13.5 g * 2
name:Mamie Yova French Yogurt Creamy 400 gm + Kellogg's Muesli Nuts Delight 240 gm,price:320,weight:1 Combo
name:Godrej Jersy Thick & Tasty Curd 1 kg Tub,price:110,weight:1 kg
name:Pride of Cows Greek Yogurt Mixed Berry No Added Sugar,price:95,weight:100 g
name:Mamie Yova Fruit Yoghurt Blueberry 90 gm + Happilo Essential Califormian,price:715,originalPrice:875,weight:1 combo
name:Eggoz White Farm Fresh Eggs,price:146,originalPrice:166,weight:10 Pieces
name:UPF FOODS Healthy Brown Eggs - Veg Fed & Infertile,price:110,originalPrice:124,weight:6 Pieces
name:NOICE High Protein Eggs (Nut & Bean Feed),price:70,originalPrice:199,weight:6 Pieces
name:NOICE High Protein Eggs (Nuts & Bean Feed),price:110,originalPrice:165,weight:10 Pieces
name:Eggoz Farm Fresh High Protein White Eggs Box,price:375,originalPrice:420,weight:30 Pieces
name:Fresh Eggs White eggs,price:110,originalPrice:155,weight:12 Pieces
name:Fresh Eggs - Fresh Export Eggs Pack of 30,price:230,originalPrice:320,weight:30 Pieces
name:Licious Classic Eggs,price:77,originalPrice:85,weight:6 Pieces
name:Licious Classic Eggs,price:143,originalPrice:169,weight:12 Pieces
name:Fresh Eggs White Eggs,price:64,originalPrice:85,weight:6 Pieces
name:Akshayakalpa Organic Free Range Eggs,price:160,weight:6 Pieces
name:dr GOOD EGGS Premium Fresh 6 Pc,price:64,originalPrice:75,weight:6 Pieces
name:Abhi Eggs Vitamin D3 with Immunity Boosters Eggs,price:96,originalPrice:110,weight:6 Pieces
name:Farm Made Foods Free Range Brown Eggs,price:294,originalPrice:310,weight:12 Pieces
name:Abhi Eggs Nutri+ With Immunity Boosters,price:299,originalPrice:350,weight:24 Pieces
name:Farm Made Free Range Brown Eggs-Veg Fed & Non Fertile,price:159,originalPrice:169,weight:6 Pieces
name:UPF FOODS Healthy Brown Eggs-Veg Fed & Infertile,price:110,originalPrice:124,weight:6 Pieces
name:Premium Fresh Eggs 30 Pieces,price:253,originalPrice:310,weight: 1 Pack
name:Happy Hens Free Range Omega-3 Enchriched Eggs,price:137,originalPrice:160,weight:6 Pieces
name:Akshayakalpa Organic Country 12 Eggs,price:285,originalPrice:310,weight:1 Pack
name:Dr.Hen Table White Egg 30 pcs,price:265,originalPrice:360,weight:30 Pieces
name:Eggoz Protein Plus Eggs,price:144,originalPrice:170,weight:10 Pieces
name:dr.GOOD EGGS Omega-3,price:180,originalPrice:208,weight:12 Pieces
name:Dr.Hen Table White Egg 6 pcds,price:74,originalPrice:95,weight:6 Pieces
name:Abhi Eggs VIT D3,price:145,originalPrice:169,weight:10 Pieces
name:Abhi Eggs Gold+ with Immunity Boosters Eggs,price:112,originalPrice:125,weight:6 Pieces
name:Happy Hens Free Range Folate VitB9 Enriched Eggs,price:137,originalPrice:160,weight:6 Pieces
name:Skm Best Plug Eggs,price:360,weight:12 Pieces * 2
name:Delfrez Suguna Nourish -Vitamins & Minerals Eggs,price:290,originalPrice:350,weight:12 Pieces * 2
name:NOICE Country Eggs From Desi Hens(Zero Antibiotics),price:89,originalPrice:100,weight:6 Pieces
name:Skm Best Fresh Eggs,price:166,weight:6 Pieces * 2
name:Abhi Eggs Nutri+ with Immunity Boosters Eggs,price:94,originalPrice:99,weight:6 Pieces
name:Fresh Eggs Brown Eggs,price:75,weight:6 Pieces
name:Akshayakalpa Organic Free Range Eggs,price:60,weight:2 Pieces
name:NOICE Free Range Eggs From Happy Hens (Brown Eggs),price:110,originalPrice:150,weight:6 Pieces
name:NOICE High Protein Eggs (Nut & Bean Feed),price:35,weight:2 Pieces
name:Jolly Good Eggs White Eggs(Freshly Picked),price:150,weight:6 Pieces * 2
name:Eggoz Free Range Herbal Fed Eggs,price:135,originalPrice:149,weight:6 Pieces
name:Delfrez Suguna Nourish - Vitamins & Minerals Egg,price:84,originalPrice:100,weight:6 Pieces
name:UPF FOODS Cage Free Eggs - Veg Feed & Infertile,price:138,originalPrice:145,weight:6 Pieces
name:Hen Fruit Protein Max Eggs,price:91,originalPrice:109,weight:6 Pieces
name:Organic Acre Desi Kadaknath Eggs,price:438,weight:6 Pieces * 2
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
    if (val.endsWith(",")) {
      val = val.substring(0, val.length - 1).trim();
    }
    result[parts[i].key] = val;
  }
  return result;
}

const brands = [
  "Milky Mist", "Hatsun", "Epigamia", "Sid's Farm", "Heritage", "Country Delight",
  "Akshayakalpa", "Organic Mandya", "Mamie Yova", "iD Fresh", "Mother Dairy",
  "Amul", "Eggoz", "UPF FOODS", "NOICE", "Licious", "Farm Made", "dr GOOD EGGS",
  "dr.GOOD EGGS", "Abhi Eggs", "Happy Hens", "Dr.Hen", "Skm", "Delfrez",
  "Jolly Good", "Hen Fruit", "Organic Acre", "Nestle", "Godrej Jersy",
  "Pride of Cows", "Dobra"
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

let counter = 300;
for (const line of lines) {
  const p = parseLine(line);
  if (!p.name) continue;

  const isEgg = p.name.toLowerCase().includes("egg");
  const idPrefix = isEgg ? "new_eggs_" : "new_curd_";
  
  const formatted = {
    id: `${idPrefix}${counter++}`,
    name: p.name,
    category: "Dairy, Bread & Eggs",
    subCategory: isEgg ? "Eggs" : "Curd and Yogurts",
    subcategory: "",
    tags: isEgg ? ["dairy", "eggs"] : ["dairy", "curd", "yogurt"],
    isTrending: false,
    price: Number(p.price || 0),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : Math.round(Number(p.price || 0) * 1.25),
    weight: p.weight || "1 Pc",
    stock: 50,
    image: isEgg 
      ? "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500"
      : (p.name.toLowerCase().includes("fruit") || p.name.toLowerCase().includes("berry") || p.name.toLowerCase().includes("strawberry") || p.name.toLowerCase().includes("blueberry") || p.name.toLowerCase().includes("mango"))
        ? "https://images.unsplash.com/photo-1571244856003-8d62635398f1?w=500"
        : "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500",
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

// Now let's modify seed.js to append these products!
const seedFilePath = path.resolve(__dirname, "seed.js");
let seedContent = fs.readFileSync(seedFilePath, "utf8");

// We need to insert these parsedProducts into the products array in seed.js.
// We can locate the last element in seed.js or we can rewrite seed.js by parsing the existing products and concatenating.
// Since seed.js is a valid Node module, we can require it, get the existing products array, concat, and write out seed.js!
const existingProducts = require("./seed");
console.log(`Loaded ${existingProducts.length} existing products.`);

const allProducts = [...existingProducts, ...parsedProducts];
console.log(`Total products will be ${allProducts.length}.`);

// Let's format the new seed.js content cleanly
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
console.log("seed.js updated successfully!");

// Now run mongoose seeding directly
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
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
  console.log("MONGO_URI not found in environment variables. Database was not seeded automatically.");
}