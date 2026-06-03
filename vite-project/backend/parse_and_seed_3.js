const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = `
name:Licious Chicken Drumsticks _ Mini Pack,price:149,weight:2 Pieces
name:FreshtoHome Premium Chicken Boneless east Fillet,price:266,originalPrice:273,weight:400 g
name:FreshtoHome Chicken Wings,price:123,originalPrice:133,weight:250 g
name:Nandus Chicken Gizzard,price:129,weight:450 g
name:Fresh Store Premium Fresh Boneless Chicken Breast Fillet,price:199,originalPrice:269,weight:450 g
name:Licious Chicken Breast Boneless 400g and Classic Eggs 6 Pieces,price:399,originalPrice:459,weight:1 Combo
name:Fresh Store Fredsh Chicken Curry Cut With Skin,price:129,originalPrice:169,weight:450 g
name:FreshtoHome Premium Chicken Boneless Cubes,price:179,weight:230 g
name:TenderCuts Chicken Breasts Boneless,price:229,originalPrice:279,weight:400 g
name:Fresh Store Fresh Chicken - Drumstick,price:89,originalPrice:129,weight:2 Pieces
name:FOBS Catla Bengali Cut Without Head,price:220,originalPrice:299,weight:400 g
name:FOBS Basa Boneless cubes,price:189,originalPrice:270,weight:250 g
name:FreshtoHome Fresh Baasa/Pangas - Boneless Cubes,price:230,weight:200 g
name:FreshtoHome Indian Prawns/Venami/Chingdi,price:410,originalPrice:450,weight:240 g
name:FreshtoHome Rohu Bengali Cut with Head,price:230,originalPrice:279,weight:400 g
name:FreshtoHome Catla - Bengali Cut with Head,price:249,originalPrice:272,weight:400 g
name:FreshtoHome Sardine - Cleaned With Partial Head,price:299,originalPrice:320,weight:280 g
name:FOBS Anchovy / Nethili Whole Cleaned,price:269,originalPrice:329,weight:250 g
name:Meatigo Everyday Fish Fillet,price:199,originalPrice:290,weight:200 g
name:TebderCuts Roopchand/River Pomfret Steaks (Without Head)F&S,price:169,originalPrice:219,weight:400 g
name:TenderCuts Catla/Katla 1-2Kg Bengali Cut (Without Head)F&S,price:199,originalPrice:269,weight:500 g
name:Seaking Anchovy Roast(Ready To Eat),price:173,originalPrice:190,weight:75 g
name:Seaking Dry Fish-Silver Belly,price:82,originalPrice:90,weight:75 g
name:TenderCuts Anchovy/Nethili Whole Cleaned F&S,price:159,originalPrice:229,weight:250 g
name:TenderCuts Sardines/ Mathi Whole Cleaned F&S,price:159,originalPrice:219,weight:250 g
name:Seaking Dry Fish-Lizard Fish,price:79,originalPrice:89,weight:75 g
name:FreshtoHome Frsh Baasa / Pangasius - Boneless Fillet,price:269,originalPrice:299,weight:250 g
name:TenderCuts White Prawns Medium 50-60 C Headless Shell On F&S,price:199,originalPrice:299,weight:300 g
name:TenderCuts Markerel / Ayla Whole Cleaned F&S,price:199,originalPrice:299,weight:250 g
name:TenderCuts Tilapia Bonless Fillet F&S,price:159,originalPrice:229,weight:250 g
name:TenderCuts White Prawns Medium 50-60 C Peeled Deveined F&S,price:249,originalPrice:279,weight:200 g
name:FreshtoHome Pink Perch / Kilimeen/Thread Finned Bream(Large),price:320,originalPrice:430,weight:300 g
name:TenderCut Baasa Boneless Fillet F&S,price:159,originalPrice:221,weight:250 g
name:TenderCuts Rohu/Rui 1-2kg Bengali Cut(Without Head),price:199,originalPrice:329,weight:500 g
name:Licious Goat Curry Cut,price:499,weight:300 g
name:Nandus Mutton Mince,price:299,weight:200 g
name:FreshtoHome Premium Tender Goat Curry Cut,price:513,originalPrice:559,weight:400 g
name:Meatzza Mutton Curry Cut,price:599,weight:500 g
name:FreshtoHome Premium Tender Lamb Curry Cut 400g + FreshtoHome Freshwater seafood 240g,price:859,originalPrice:899,weight:1 Combo
name:FreshtoHome Mutton Trotters / Paya(Set of 4 whole legs) for soup,price:549,weight:4 Pieces
name:ITC Master Chef Chicken Seekh Kebab,price:299,originalPrice:350,weight:500 g
name:Wow! Momo Chicken Darjeeling Momos,price:324,originalPrice:398,weight:10 Pieces * 2
name:NOICE Chicken Breakfast Sausages,price:129,originalPrice:159,weight:250 g
name:NOICE Chicken Nugget,price:239,originalPrice:350,weight:400 g
name:Wow!Momo Chicken Cheese Momos,price:159,originalPrice:199,weight:10 Pieces
name:Wow!Momo Chicken Darjeeling Momos,price:279,originalPrice:267,weight:20 Pieces
name:IFB Fresh Catch Prawn Medium,price:169,originalPrice:225,weight:200 g
name:Prasuma Chicken Sauages,price:599,originalPrice:740,weight:250 g * 4
name:La Came Breakfast Chicken Sausage,price:299,originalPrice:350,weight:500 g
name:La Came Piri Piri Chicken Sausage,price:199,originalPrice:235,weight:250 g
name:Supreme Harvest Popcorn Kernels,price:95,weight:200 g
name:Prasuma Pork Breakfast Bacon,price:699,originalPrice:840,weight:300 g * 2
name:Prasuma Pork Ham(Smoked),Premium Pork,price:245,originalPrice:299,weight:200 g
name:NOICE Chicken Seekh Kebab,price:269,originalPrice:360,weight:400 g
name:ITC Master Chef Desi Style Chicken Patty,price:185,originalPrice:205,weight:330 g
name:Meatzza Chicken Nuggets,price:360,originalPrice:650,weight:1 kg
name:Godrej Yummiez Chicken Pepper & Herb Sausages,price:350,originalPrice:390,weight:250 g * 2
name:Prasuma Chicken Ham(Smoked),price:189,originalPrice:199,weight:200 g
name:Prasuma Pork Breakfast Bacon,price:189,originalPrice:220,weight:150 g
name:Prasuma Chicken Cheese & Chilli Sausage,price:158,originalPrice:199,weight:250 g
name:ITC Master Chef Medium Prawns,price:222,originalPrice:270,weight:200 g
name:Godrej Yummiez Chicken Breakfast Sausages,price:165,originalPrice:188,weight:250 g
name:Godrej Yummiez Chicken Nuggets,price:289,originalPrice:356,weight:450 g
name:Prasuma Original Chicken Momos,price:266,originalPrice:310,weight:24 Pieces
name:Godrej Yummiez Chicken Burger Patty,price:185,originalPrice:206,weight:300 g
name:Godrej Yummiez Chicken Bites Nuggets + Atomic Sauce Inside,price:154,originalPrice:195,weight:225 g
name:Prasuma Pork Breakfast Bacon,price:189,originalPrice:220,weight:150 g
name:Prasuma Spicy Chicken Momos,price:169,originalPrice:195,weight:10 Pieces
name:Prasuma Pork Ham(Smoked),price:228,originalPrice:265,weight:200 g
name:Godrej Yummiez Chicken Nuggets,price:422,originalPrice:476,weight:750 g
name:Godrej Tummiez Chicken Pepper & Herb Salami,price:350,originalPrice:399,weight:250 g * 2
name:Prasuma Chicken Seekh Kebab,price:257,originalPrice:335,weight:500 g
name:Wow! Chicken SUPER SAVER Party Pack Spicy Momo,price:399,originalPrice:589,weight:50 Pieces
name:Godrej Yummiez Chicken Burger Patty,price:185,originalPrice:220,weight:300 g
name:Prasuma Chicken Cheese & Chilli Sasuage,price:159,originalPrice:220,weight:250 g
name:Godrej Chicken Breast Boneless,price:250,originalPrice:290,weight:450 g
name:Godrej Yummiez Chilli Chicken Sausages,price:179,originalPrice:199,weight:250 g
name:Deli Chic Chicken Boneless Cubes,price:289,originalPrice:310,weight:500 g
name:Godrej Real Good Large Prawns,price:250,originalPrice:290,weight:200 g
name:Meatzza,price:299,weight:500 g
name:Godrej Yummiez Chicken Breakfast Salami,price:340,originalPrice:370,weight:250 g * 2
name:Godrej Yummiez Chicken Cheese & Onion Sausages,price:199,originalPrice:220,weight:250 g
name:Godrej Yummiez Chicken & Cheese Nuggets,price:259,originalPrice:310,weight:325 g
name:Gadre Marine Tilapia Fish Fingers,price:210,originalPrice:250,weight:200 g
name:Godrej Yummiez Chicken Lucknowi Seekh Kebab,price:299,originalPrice:330,weight:400 g
name:Meatigo Chicken Mince(keema),price:250,weight:450 g
name:Prasuma Pork Pepperoni Salami(Smoked),price:199,originalPrice:230,weight:100 g
name:Metazza Marinated Bonless Tandoori tikka 500 g,price:320,originalPrice:345,weight:500 g
name:Seaking Anchovy Roast(Ready to Eat),price:199,originalPrice:240,weight:75 g
name:Seaking Dry Fish-Silver Belly,price:83,originalPrice:99,weight:75 g
name:Aashirvaad Chakki Khapli Atta,Ancient Wheat Flour,price:178,originalPrice:250,weight:1 kg
name:Aashirvaad Select Sharbati Atta,price:347,originalPrice:435,weight:5 kg
name:Everyday Protein 17 gm Protein Atta,price:89,originalPrice:120,weight:1 kg
name:ITC Right Shift Multigrain + Atta ,price:299,originalPrice:449,weight:5 kg
name:ITC Right Shift Multigrain + Atta 1 kg,price:150,originalPrice:220,weight:1 kg * 2
name:Jus Amazin Gluten Atta,price:349,weight:1 kg
name:Aashirvaad Superior MP Atta,price:74,weight:1 kg
name:Aashirvaad Superior MP Atta,price:337,originalPrice:378,weight:5 kg
name:ITC Right Shift Multigrain + Atta 5 kg,price:299,originalPrice:469,weight:5 kg
name:Fortune Chakki Fresh Atta,price:71,originalPrice:110,weight:1 kg
name:Aashirvaad Multigrains Atta,price:359,originalPrice:413,weight:5 kg
name:Aashirvaad Multigrains Atta,price:159,originalPrice:178,weight:1 kg * 2
name:Pilsbury Chakki Fresh Atta,price:278,originalPrice:366,weight:5 kg
name:Aashirvaad Superior MP Atta,price:555,originalPrice:655,weight:10 kg
name:AAshirvaad Select Sharbati Atta,price:82,originalPrice:94,weight:1 kg
name:Pilsbury Chakki Fresh Atta,price:69,originalPrice:83,weight:1 kg
name:Pilsbury Multigrain Atta - 7 Grain Blend,price:335,originalPrice:440,weight:5 kg
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
    val = val.replace(/^[,\s]+|[,\s]+$/g, "").trim();
    result[parts[i].key] = val;
  }
  return result;
}

function getBrand(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("licious")) return "Licious";
  if (lowerName.includes("freshtohome")) return "FreshtoHome";
  if (lowerName.includes("nandus")) return "Nandus";
  if (lowerName.includes("fresh store")) return "Fresh Store";
  if (lowerName.includes("tendercuts") || lowerName.includes("tebdercuts") || lowerName.includes("tendercut")) return "TenderCuts";
  if (lowerName.includes("fobs")) return "FOBS";
  if (lowerName.includes("meatigo")) return "Meatigo";
  if (lowerName.includes("seaking")) return "Seaking";
  if (lowerName.includes("itc master chef")) return "ITC Master Chef";
  if (lowerName.includes("wow! momo") || lowerName.includes("wow!momo") || lowerName.includes("wow! chicken")) return "Wow! Momo";
  if (lowerName.includes("noice")) return "NOICE";
  if (lowerName.includes("ifb fresh catch")) return "IFB Fresh Catch";
  if (lowerName.includes("prasuma")) return "Prasuma";
  if (lowerName.includes("la came")) return "La Came";
  if (lowerName.includes("supreme harvest")) return "Supreme Harvest";
  if (lowerName.includes("godrej yummiez") || lowerName.includes("godrej tummiez") || lowerName.includes("godrej")) return "Godrej";
  if (lowerName.includes("deli chic")) return "Deli Chic";
  if (lowerName.includes("meatzza") || lowerName.includes("metazza")) return "Meatzza";
  if (lowerName.includes("gadre marine")) return "Gadre Marine";
  if (lowerName.includes("aashirvaad") || lowerName.includes("aashirvaad")) return "Aashirvaad";
  if (lowerName.includes("everyday protein")) return "Everyday Protein";
  if (lowerName.includes("itc right shift")) return "ITC Right Shift";
  if (lowerName.includes("jus amazin")) return "Jus Amazin";
  if (lowerName.includes("fortune")) return "Fortune";
  if (lowerName.includes("pilsbury") || lowerName.includes("pillsbury")) return "Pillsbury";
  return "Other";
}

function getCategory(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("atta") || lowerName.includes("flour") || lowerName.includes("khapli") || lowerName.includes("sharbati") || lowerName.includes("wheat")) {
    return "Atta, Rice and Dal";
  }
  if (lowerName.includes("popcorn")) {
    return "Snacks";
  }
  return "Meat and Seafood";
}

function getSubCategory(name, category) {
  if (category === "Atta, Rice and Dal") return "Atta";
  if (category === "Snacks") return "Snacks";
  
  const lowerName = name.toLowerCase();
  if (lowerName.includes("chicken")) {
    if (["sausage", "kebab", "momo", "nugget", "patty", "bites", "salami", "ham", "seekh"].some(k => lowerName.includes(k))) {
      return "Ready to Cook";
    }
    return "Fresh Chicken";
  }
  if (["pork", "bacon", "ham", "pepperoni", "salami"].some(k => lowerName.includes(k))) {
    return "Cold Cuts";
  }
  if (["mutton", "goat", "lamb", "paya"].some(k => lowerName.includes(k))) {
    return "Fresh Mutton";
  }
  if (["fish", "prawn", "catla", "basa", "sardine", "anchovy", "pomfret", "mackerel", "tilapia", "shrimp", "seafood"].some(k => lowerName.includes(k))) {
    return "Fresh Seafood";
  }
  return "Ready to Cook";
}

function getProductImage(name, category, subCategory) {
  if (category === "Atta, Rice and Dal") {
    return "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop";
  }
  if (category === "Snacks") {
    return "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500&auto=format&fit=crop";
  }
  
  if (subCategory === "Fresh Chicken") {
    return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Ready to Cook") {
    return "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Cold Cuts") {
    return "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Fresh Mutton") {
    return "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Fresh Seafood") {
    return "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=500&auto=format&fit=crop";
  }
  
  return "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=500&auto=format&fit=crop";
}

const lines = rawList.trim().split("\n").map(l => l.trim()).filter(Boolean);
const parsedProducts = [];

let counter = 1000;
for (const line of lines) {
  const p = parseLine(line);
  if (!p.name) continue;

  const category = getCategory(p.name);
  const subCategory = getSubCategory(p.name, category);
  
  const idPrefix = category === "Atta, Rice and Dal" 
    ? "grocery_atta_added_" 
    : category === "Snacks" 
      ? "snacks_added_" 
      : "meat_added_";

  const formatted = {
    id: `${idPrefix}${counter++}`,
    name: p.name,
    category: category,
    subCategory: subCategory,
    subcategory: "",
    tags: [
      category.toLowerCase(), 
      subCategory.toLowerCase(), 
      ...p.name.toLowerCase().split(/[\s,()_+&-\/]+/).filter(w => w.length > 2)
    ],
    isTrending: false,
    price: Number(p.price || 0),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : Math.round(Number(p.price || 0) * 1.25),
    weight: p.weight || "1 Pc",
    stock: 50,
    image: getProductImage(p.name, category, subCategory),
    section: category === "Atta, Rice and Dal" ? "grocery" : category === "Snacks" ? "snacks" : "meat",
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
      
      // Let's get the union of current DB products and our new products to insert, 
      // or we can insert all products from the updated seed.js file.
      // Inserting all products from the updated seed list is the cleanest way.
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
