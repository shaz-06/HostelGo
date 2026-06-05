const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const rawList = `
name:Kwality Wall's Butterscotch Ice Cream Tub,price:170,weight:700 ml
name:Kwality Wall's Alphonso Mango Ice Cream Tub,price:170,weight:700 ml
name:Kwality Wall's Vanilla Ice Cream Tub,price:155,weight:700 ml
name:Go Zero Alphonso Mango Guilt Free Ice Cream Tub,price:280,originalPrice:299,weight:1 Litre
name:Arun Jackfruit Ice Cream Tub,price:99,weight:250 ml
name:HANGYO Mango Ice Cream Tub,price:110,originalPrice:160,weight:500 ml
name:Amul Choco Chips Ice Cream Tub,price:230,weight:1 Litre
name:HANGYO Sitaphal,price:50,weight:125 ml
name:Amul Tru Tender Coconut Ice Cream Tub,price:267,originalPrice:275,weight:1 Litre
name:Milky Mist Mango Ice Cream Tub,price:312,originalPrice:350,weight:1 Litre
name:Milky Mist Sugar Free French. Vanilla Ice Cream Tub,price:168,originalPrice:190,weight:500 ml
name:Amul Chocolate Brownie. Ice Cream Tub,price:210,weight:1 Litre
name:HANGYO Rich Dry Fruits Ice Cream Tub,price:154,originalPrice:160,weight:500 ml
name:Kwality Wall's Oero and Cream Frozen Dessert Tub,price:299,weight:700 ml
name:Kwality Wall's Choco Brownie Fudge Ice Cream Tub,price:299,weight:700 ml
name:Amul Vanilla Gold Ice Cream Tub,price:217,originalPrice:230,weight:1 Litre
name:Arun Vanilla Ice Creram Tub,price:157,weight:500 ml
name:Huber & Holly Belgian Chocolate & Brownie Ice Cream Tub,price:214,originalPrice:320,weight:500 ml
name:Kwality Wall's Cadbury Crackle Frozen Dessert Tub,price:344,weight:700 ml
name:Amul King Alphonso Gold Ice Cream Tub,price:248,originalPrice:260,weight:1 Litre
name:Amul Tub Fruit N Nut Fantasy Box,price:457,originalPrice:460,weight:1 Litre * 2
name:Amul Butterscotch Gold Cream Tub,price:248,originalPrice:260,weight:1 Litre
name:Kwality Wall's Hawaiian Nuts Sundae Ice Creasm Tub,price:289,weight:700 ml
name:Hocco Choco Brownie Ice Cream Tub,price:267,originalPrice:280,weight:750 ml
name:Go Zero Only Vanilla Guilt Free Ice Cream Tub,price:238,originalPrice:249,weight:1 Litre
name:Amul Chocolate Magic Ice Vream Sundae Tub,price:215,weight:1 Litre
name:Hocco Ratnagiri Mango Ice Cream Tub,price:314,originalPrice:320,weight:750 ml
name:NOICE Dark Chocolate Gelato,price:228,originalPrice:269,weight:350 ml
name:Dairy Day Blackcurrent Premium Ice Cream Tub,price:174,originalPrice:180,weight:500 ml
name:Amul Coockies N Cream Gold Ice Cream Tub,price:254,originalPrice:260,weight:1 Litre
name:Hocco Choco Brownie Ice Cream Tub,price:274,originalPrice:280,weight:750 ml
name:Go Zero Butterscotch Gold Guilt Free Ice Cream Tub,price:289,originalPrice:299,weight:1 Litre
name:HANGYO Strawberry Ice Cream Tub,price:124,originalPrice:130,weight:500 ml
name:Amul Choco Crackle Ice Cream Tub,price:244,originalPrice:250,weight:1 Litre
name:Hocco Blueberry cheesecake Ice Cream Tub,price:314,originalPrice:320,weight:750 ml
name:NIC Ice Cream Mango Ice Cream Tub,price:329,originalPrice:350,weight:500 ml
name:Amul Rajbhog Ice Cream Tub,price:300,weight:1 Litre
name:Amul Tru Berry Dazzle Ice Cream Tub,price:300,weight:1 Litre
name:Go Zero Only Vanilla Guilt Free Ice Cream Tub,price:234,originalPrice:249,weight:1 Litre
name:Go Zero Choco Delight Guiilt Free Ice cCrfeam Tub,price:289,originalPrice:299,weight:1 Litre
name:Dairy Day Pistachio Premium Ice Cream Tub,price:199,weight:500 ml
name:NOICE Pistachio Gelato,price:133,originalPrice:135,weight:100 ml
name:Arun Vanilla Ice Cream,price:150,weight:500 ml
name:Milky Mist Creamy Butter Scotch,price:299,originalPrice:340,weight:1 Litre
name:Arun Chocolate Ice Cream Tub,price:200,weight:500 ml
name:Go Zero Simply Sitaphal Guilt Free Ice Cream Tub,price:244,originalPrice:380,weight:500 ml
name:Go Zero Butterscotch Gold Guilt Free Ice Cream Tub,price:289,originalPrice:299,weight:1 Litre
name:NOICE Coconut Slow Churned Ice Cream,price:95,weight:100 ml
name:Havmor Kesar Zero Sugar Added Ice Cream Tub,price:158,originalPrice:200,weight:500 ml
name:Arun Pista Ice Cream Tub,price:200,weight:500 ml
name:Go Zero Choco Delight Guilt Free Ice Cream Tub,price:289,originalPrice:299,weight:1 Litre
name:Milky Mist French Vanilla,price:244,originalPrice:320,weight:1 Litre
name:Amul Falooda Ice Cream Sundae Tub,price:300,weight:1 Litre
name:Amul Paan Nawaabi Ice Cream Tub,price:215,weight:1 Litre
name:Milky Mist Creamy Butter Scotch,price:289,originalPrice:340,weight:1 Litre
name:Huber & Holly Butterscotch and Prakine Ice Cream Tub,price:264,originalPrice:270,weight:500 ml
name:Uncle John Chocolate Fudge & Malted Cookie Dough,price:399,originalPrice:400,weight:450 ml
name:Go Zero Mad Over Mango Guilt Free Ice Cream Tub,price:259,originalPrice:380,weight:500 ml
name:Arun Chocolate Ice Cream Tub,price:200,originalPrice:500 ml,weight:500 ml
name:Huber & Holly Sicillian Pistachio Ice Cream Tub,price:254,originalPrice:360,weight:500ml
name:Go Zero French Vanilla Guilt Free Ice Cream Tub,price:259,originalPrice:380,weight:500 ml
name:Milky Mist Italian Chocolate,price:289,originalPrice:380,weight:1 Litre
name:Arun Pista Ice Cream Tub,price:200 ,weight:500 ml
name:Amul Gold Tiramisu Ice Cream Tub,price:324,originalPrice:350,weight:1 Litre
name:Baskin Robbins Three Cheers Chocolate Ice Cream Tub,price:295,weight:450 ml
name:Baskin Robbins Mississippi Mud Chocolate,price:790,weight:450 ml * 2
name:Uncle John Chocolate Fudge & Malted Cookies Dough,price:399,originalPrice:400,weight:450 ml
name:Uncle John Mango Raspberry Fusion,price:344,originalPrice:350,weight:450 ml
name:Dairy Day Tutti Fruity Premium Ice Cream,price:154,originalPrice:160,weight:500 ml
name:NOICE Filter Coffe Slow Churned Ice Cream,price:299,originalPrice:339,weight:350 ml
name:Uncle John Blueberry Cheesecake,price:399,weight:450 ml
name:Get-A-Way Chocolate Browine Fudge Ice Cream Tub,price:358,originalPrice:445,weight:500 ml
name:Baskin Robbins Classic Vanilla Ice Cream Tub,price:300,weight:450 ml
name:NOiCE Rose Gulkand Slow Churned Ice Cream,price:254,originalPrice:269,weight:350 ml
name:Uncle John Mango Raspberry Fusion,price:344,originalPrice:350,weight:450 ml
name:Amul Cheese and Cherry Sundae Ice CReam Tub,price:300,weight:1 Litre
name:Amul Tutti Frutti Gold Ice Cream Tub,price:244,originalPrice:260,weight:1 Litre
name:NOICE Kesar Pista Slow Churned Ice Cream,price:111,originalPrice:129,weight:100 ml
name:Uncle John Birthday Cake,price:344,originalPrice:350,weight:450 ml
name:NOICE Alphonso Mango Slow Churned Ice Cream,price:99,weight:100 ml
name:Natural Ice Cream Tender Coconut Ice Cream Tub,price:534,originalPrice:578,weight:500 g
name:Baskin Robbins Premium Black Currant Ice Cream,price:780,weight:450 ml * 2
name:Uncle John Lemon Pie,price:444,originalPrice:450,weight:450 ml
name:Natural Ice Cream Mango Ice Cream Tub,price:534,originalPrice:578,weight:500 g
name:Baskin Robbins Fresh Fruit Alphonso Mango Ice CReam Tub,price:480,weight:700 ml
name:Havmor Mahabaleshwar Strawberry Ice Cream Tub,price:222,originalPrice:230,weight:500 ml
name:Uncle John Millionarie's Shortbread,price:400,weight:450 ml
name:Dairy Day Cookie and Cream Premium Ice Cream Tub,price:199,weight:500 ml
name:Huber & Holly Baked Strawberry Cheesecake Ice Cream Tub,price:364,originalPrice:370,weight:500 ml
name:Uncle John Peanut Butter & Jelly Ice Cream Tub,price:400,weight:450 ml
name:Havmor American Mud Cake Ice Cream tub,price:300,weight:750 ml
name:Minus Thirsty French Vanilla Low Calorie Ice Cream,price:699,originalPrice:700,weight:500 ml
name:Amul Moroccan Dry Fruit Ice CReam tub,price:300,weight:540 ml
name:HANGYO Belgian Chocolate Tub,price:350,weight:1 Litre
name:Milky Mist Sugar Free Italian Chocolate Ice Cream Tub,price:220,weight:500 ml
name:Amul Butterscotch Gold Ice Cream Tub,price:399,weight:2 Litre
name:Amul Ice Malai Zero Sugar Added Ice Cream Tub ,price:174,originalPrice:180,weight:500 ml
name:Dairy Day Ice Creams & Frozen Dessert Mango Fruit Chunks Ice Cream Tub,price:220,weight:500 ml
name:Dairy Day Vanilla Ice Cream Tub,price:269,weight:500 ml * 2
name:Arun Vanilla & Rasperry Slice Ice Cream Tub,price:320,weight:800 ml
name:Cream Stone Tubz OH Mango Jamun,price:250,weight:100 ml * 2
name:Hocco Hazelnut Mudslide Cone Ice Cream,price:200,weight:135 ml * 2
name:Kwality Wall's Cornetto Oreo Frozen Dessert Cone,price:70,weight:110 ml
name:Kwality Wall's Cornetto Double Chocolate Frozen Dessert Cone,price:40,weight:105 ml
name:Kwality Wall's Cornetto Butterscotch Frozen Dessert Cone,price:160,weight:105 ml * 4
name:Kwality Wall's Cornetto Black Currant Ice Cream Cone,price:35,weight:105 ml
name:Kwality Wall's Cornetto Choco Brownie,price:55,weight:110 ml
name:Arun Double Chocolate Ice Cream. Cone,price:60,weight:100 ml
name:Amul Ice Cream Tricone Gold Butter Scotch,price:40,weight:120 ml
name:Milky Mist Vanilla Ice Cream Cone,price:50,weight:120 ml
name:Hocco Cookies and Cream Ice Cream Cone,price:100,weight:135 ml
name:Amul Tricone Cookie Crunch Delight Ice Cream Cone,price:110,weight:120 ml
name:Amul Tricone Coffee Gold Cone,price:40,weight:120 ml
name:Kwality Wall's Cornetto Almond Crunch Cone,price:45,weight:105 ml
name:SKEI Butterscotch Cone,price:40,weight:120 ml
name:minus Thirty French Vanilla Low Calorie Guilt free Ice Cream,price:700,weight:500 ml
name:Minus Thirty Mint Chocolate Chip Low Calorie Vegan ,price:899,weight:500 ml
name:Hocco Amachi Mango Ice Cream,price:200,weight:120 ml
name:Amul Tru Tendur Coconut Ice Cream Tub,price:275,weight:1 Litre
name:Huber & Holly Sicilian Pistachio Ice Cream Tub,price:356,originalPrice:360,weight:500 ml
name:Amul Ice Cream Sugar Free Panjabi Kulfi Stick,price:25,weight:60 ml
name:Milky Mist Capella Vanilla Ice Cream Stick Bar,price:40,weight:60 ml
name:Milky Midst Duet Chocolate & Vanilla Ice Cream Stick Bar,price:55,weight:80 ml
name:NOTO Strawberry Raspberry Sugar Free Popsicle,price:80,originalPrice:100,weight:60 ml
name:Dairy Day Bento Choco Fantacy Ice Cream Cake,price:164,originalPrice:179,weight:200 ml
name:Milky Mist Duet Butterscotch & Vanilla Ice Cream Stick Bar,price:55,weight:80 ml
name:Milky Mist Duet Chocolate & Vanilla Ice Cream Stick Bar,price:55,weight:80 ml
name:Milky Mist Duet Butterscotch & Vanilla Ice Cream Stick Bar,price:55,weight:80 ml
name:Natural Tender Coconut Ice Cream Tub,price:523,originalPrice:578,weight:500 g
name:Amul Chocolate BrownieSandwich Gold,price:40,weight:80 ml
name:Amul Protein Mango Kulfi(4 * 60 ml),price:153,originalPrice:160,weight:240 ml
name:Amul Ice Cream Cake Magic Dark Chocolate,price:278,originalPrice:290,weight:750 ml
name:Dairy Day Triple Frozen Dessert Bar,price:80,weight:70 ml * 2
name:Minus Thirty Double Choco Low Calorie Ice Cream Stick(Vegan),price:120,originalPrice:,weight:40 ml
name:HANGYO Berry & Cream Bar,price:35,weight:50 ml
name:Amul Ice Cream Gold Stick Mango,price:60,weight:60 ml * 3
name:Milky Mist Mist Capella Almond Bar,price:45,weight:45
name:Amul Coffee Bar Ice Cream Stick,price:20,weight:60 ml
name:Amul Gold Frostik Ice Cream Stick,price:45,weight:70 ml
name:MAGNUM Caramel Ice Cream Pop,price:70,weight:75 ml
name:Milky mist Capella Vanilla Ice Cream Stick bar,price:40,weight:60 ml
name:NOICE Malai Kulfi,price:69,originalPrice:79,weight:79
name:Get-A-Way Triple Chocolate Ice Cream Cake,price:378,originalPrice:543,weight:500 ml
name:Hocco Chocolate Chips Bix Ice Cream,price:70,weight:125 ml
name:Amul Sandwitch Vanilla Ice Cream,price:30,weight:80 ml
name:Milky mist Chocolate Sandwich Round,price:35,weight:80 ml
name:Get-A-Way Black Forest Ice Cream Cake Slice Pastry,price:123,originalPrice:155,weight:150 ml
name:Amul Cassatta Gold,price:65,weight:150 ml
name:The Baker's Dozen Banana Mufin,price:45,weight:40 g
name:Arun Ice Cream Cake Slice,price:80,weight:125 ml
name:Baskin Robbins Choco Vanilla Funwich Sandwich Ice Cream,price:95,weight:90 ml
name:The Baker's Dozen ,price:33,weight:42 g
name:Amul Chocolate Brownie Sandwich Gold,price:40,weight:80 ml
name:Havmor Chocolate Ice Cream Cake,price:350,weight:500 ml
name:Amul Cake Magic Golden Fantasy Ice Cream Cake,price:299,originalPrice:325,weight:500 ml
name:Havmor Mud Ice Cream Cake,price:370,weight:500 ml
name:Baskin Robbins Red Velvet Slice Cake,price:110,weight:70 g
name:Creambell Caramel Crunch Ice Cream,price:360,weight:500 ml
name:Creambell Double Chocolate Ice Cream Cake,price:360,weight:500 ml
name:Cream Bell Vanilla Sandwich,price:60,,weight:80 ml * 2
name:Dairy Day Red Velvet Ice Cream Cake,price:344,originalPrice:350,weight:500 ml
name:Hershey'S Chocolate Syrup,price:188,originalPrice:198,weight:180 g * 2
name:Hershey'S Genuine Chocolate Flavour Syrup,price:215,originalPrice:222,weight:600 g
name:Dabur Sharbat E Azam Rose Syrup,price:154,originalPrice:160,weight:750 ml
name:Hershey's Caramel Syrup,price:222,originalPrice:235,weight:600 g
name:Hershey's Strawberry Syrup Bottle,price:222,originalPrice:235,weight:600 g
name:Urban Platter Arabian Date Syrup,price:243,originalPrice:250,weight:400 g
name:Del Monte Chocolate Flavoured Syrup,price:199,originalPrice:240,weight:600 g
name:Monin Curacco Bleu Syrup,price:399,originalPrice:425,weight:250 ml
name:Hershey'S Chocolate Syrup and Betty Crocker Pancake Mix Original Combo,price:264,originalPrice:294,weight:1 Combo
name:Gulabs Nannari Syrup,price:360,weight:500 ml
name:YELLOW DIAMOND Spicy Korean Chips,price:38,originalPrice:50,weight:85 g
name:YELLOW DIAMOND Cream n Onion Chips,price:18,originalPrice:20,weight:60 g
name:Let's Try Potato Wafers,price:37,originalPrice:60,weight:52 g
name:Lay's Crunchy PotatoChips,price:20,weight:58 g
name:Red Rock Deli Kettle Chips,price:45,originalPrice:60,weight:58 g
name:The Baker's Dozen Protein Chips-Masala Mania,price:74,originalPrice:80,weight:45 * 2
name:Too Yumm! Naagin Sauce _ Smoking Hot Bhoot Chips,price:46,originalPrice:60,weight:46 g * 3
name:Too Yumm! Kashmiri Chilli Potato Chips,price:37,originalPrice:49,weight:79 g
name:YELLOW DIAMOND Classic Salted Chips,price:20,weight:60 g
name:YELLOW DIAMOND Sizzling Cheese Chips & YELLOW DIAMOND Naga Punch Chips,price:77,originalPrice:100,weight:1 Combo
name:Lay's American Style Cream & Onion Chips,price:132,originalPrice:144,weight:80 g * 3
name:VS Mani & Co.Potato Hot Chips Chilli,price:43,originalPrice:60,weight:60 g
name:YELLOW DIAMOND Classic Salted Chips,price:34,originalPrice:50,weight:85 g
name:YELLOW DIAMOND Spicy Korean Chips & YELLOW DIAMOND Cheese Flavoured Puffcorn,price:85,originalPrice:100,weight:1 COmbo
name:Bingo Mad Angles Achaari Masti Masala Crisps,price:49,originalPrice:50,weight:124.8 g
name:Lay's Hot 'N' Sweet Chilli Potato Chips 82 g & Lay's American Style Cream & Onion,price:132,originalPrice:144,weight:1 Combo
name:Lay's Magic Masala & Chilli Potato Combo,price:83,weight:1 Combo
name:Pringles Sour Cream & Onion Potato,price:163,originalPrice:165,weight:40 g * 3
name:Too Yumm! Naagin Sauce Smoking Hot Bhoot Chips,price:87,originalPrice:110,weight:79 * 2
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
  if (lowerName.includes("syrup") || lowerName.includes("sharbat") || (lowerName.includes("combo") && lowerName.includes("syrup"))) {
    return "Sauces and Spreads";
  }
  if (lowerName.includes("chips") || lowerName.includes("wafer") || lowerName.includes("puffcorn") || lowerName.includes("kettle") || lowerName.includes("hot chips") || lowerName.includes("crisps") || lowerName.includes("pringles") || lowerName.includes("mad angles")) {
    return "Chips and Namkeens";
  }
  return "Ice Creams & Desserts";
}

function getSubCategory(name, category) {
  const lowerName = name.toLowerCase();
  if (category === "Sauces and Spreads") {
    if (lowerName.includes("chocolate") || lowerName.includes("caramel") || lowerName.includes("strawberry")) {
      return "Chocolate Spreads";
    }
    return "Jams & Honey";
  }
  if (category === "Chips and Namkeens") {
    if (lowerName.includes("puffcorn") || lowerName.includes("puff")) {
      return "Puffs & Popcorn";
    }
    return "Potato Chips";
  }
  
  // Ice Creams & Desserts
  if (lowerName.includes("cone") || lowerName.includes("cornetto") || lowerName.includes("tricone")) {
    return "Cones & Cups";
  }
  if (lowerName.includes("cake")) {
    return "Ice Cream Cakes";
  }
  if (lowerName.includes("stick") || lowerName.includes("kulfi") || lowerName.includes("bar") || lowerName.includes("pop") || lowerName.includes("popsicle")) {
    return "Kulfi";
  }
  if (lowerName.includes("sandwich") || lowerName.includes("slice") || lowerName.includes("funwich") || lowerName.includes("mufin") || lowerName.includes("pastry") || lowerName.includes("cassatta")) {
    return "Gourmet Desserts";
  }
  return "Tubs";
}

function getBrand(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("kwality wall")) return "Kwality Wall's";
  if (lowerName.includes("go zero")) return "Go Zero";
  if (lowerName.includes("arun")) return "Arun";
  if (lowerName.includes("hangyo")) return "Hangyo";
  if (lowerName.includes("amul")) return "Amul";
  if (lowerName.includes("milky mist") || lowerName.includes("milky midst")) return "Milky Mist";
  if (lowerName.includes("huber & holly") || lowerName.includes("huber and holly")) return "Huber & Holly";
  if (lowerName.includes("hocco")) return "Hocco";
  if (lowerName.includes("noice")) return "NOICE";
  if (lowerName.includes("dairy day")) return "Dairy Day";
  if (lowerName.includes("nic")) return "NIC Ice Cream";
  if (lowerName.includes("havmor")) return "Havmor";
  if (lowerName.includes("uncle john")) return "Uncle John";
  if (lowerName.includes("baskin robbins")) return "Baskin Robbins";
  if (lowerName.includes("get-a-way") || lowerName.includes("get a way")) return "Get-A-Way";
  if (lowerName.includes("natural")) return "Natural Ice Cream";
  if (lowerName.includes("minus thirsty") || lowerName.includes("minus thirty")) return "Minus Thirty";
  if (lowerName.includes("cream stone")) return "Cream Stone";
  if (lowerName.includes("skei")) return "SKEI";
  if (lowerName.includes("noto")) return "NOTO";
  if (lowerName.includes("magnum")) return "Magnum";
  if (lowerName.includes("the baker's dozen")) return "The Baker's Dozen";
  if (lowerName.includes("creambell") || lowerName.includes("cream bell")) return "Creambell";
  if (lowerName.includes("hershey")) return "Hershey's";
  if (lowerName.includes("dabur")) return "Dabur";
  if (lowerName.includes("urban platter")) return "Urban Platter";
  if (lowerName.includes("del monte")) return "Del Monte";
  if (lowerName.includes("monin")) return "Monin";
  if (lowerName.includes("gulabs")) return "Gulabs";
  if (lowerName.includes("yellow diamond")) return "Yellow Diamond";
  if (lowerName.includes("let's try") || lowerName.includes("let’s try")) return "Let's Try";
  if (lowerName.includes("lay")) return "Lay's";
  if (lowerName.includes("red") && lowerName.includes("deli")) return "Red Rock Deli";
  if (lowerName.includes("too yumm")) return "Too Yumm!";
  if (lowerName.includes("vs mani")) return "VS Mani & Co.";
  if (lowerName.includes("bingo")) return "Bingo";
  if (lowerName.includes("pringles")) return "Pringles";
  return "Other";
}

function getProductImage(subCategory, name) {
  if (subCategory === "Tubs") {
    return "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Cones & Cups") {
    return "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Kulfi") {
    return "https://images.unsplash.com/photo-1481391319762-47dff72954d4?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Ice Cream Cakes") {
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Gourmet Desserts") {
    return "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Chocolate Spreads") {
    return "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Jams & Honey") {
    return "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Potato Chips") {
    return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop";
  }
  if (subCategory === "Puffs & Popcorn") {
    return "https://images.unsplash.com/photo-1536680465769-2365207b035e?w=500&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop";
}

function getSectionName(category) {
  if (category === "Sauces and Spreads") return "sauces-spreads";
  if (category === "Chips and Namkeens") return "chips-namkeens";
  return "ice-cream";
}

const lines = rawList.trim().split("\n").map(l => l.trim()).filter(Boolean);
const parsedProducts = [];

let counter = 4000;
for (const line of lines) {
  const p = parseLine(line);
  if (!p.name) continue;

  const category = getCategory(p.name);
  const subCategory = getSubCategory(p.name, category);
  const brand = getBrand(p.name);
  
  // Clean up product name slightly if needed (e.g. typos, leading/trailing space)
  let cleanName = p.name
    .replace(/\s+/g, " ")
    .replace(/Creram/g, "Cream")
    .replace(/Vream/g, "Cream")
    .replace(/Guiilt/g, "Guilt")
    .replace(/cCrfeam/g, "Cream")
    .replace(/CReam/g, "Cream")
    .replace(/Browine/g, "Brownie")
    .replace(/Coffe/g, "Coffee")
    .replace(/NOiCE/g, "NOICE")
    .replace(/Millionarie's/g, "Millionaire's")
    .replace(/BrownieSandwich/g, "Brownie Sandwich")
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
      ...cleanName.toLowerCase().split(/[\s,()_+&-\/.*]+/).filter(w => w.length > 2)
    ],
    isTrending: false,
    price: Number(p.price || 0),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : Math.round(Number(p.price || 0) * 1.25),
    weight: p.weight || "1 Pc",
    stock: 50,
    image: getProductImage(subCategory, cleanName),
    section: getSectionName(category),
    brand: brand,
    description: `${cleanName}. Delicious and high quality product, sourced fresh and handled with strict hygiene standards.`,
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
