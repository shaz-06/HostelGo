const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

// ─────────────────────────────────────────────
//  RAW DATA  (parsed from user input)
// ─────────────────────────────────────────────

const SECTIONS = {
  MAKEUP: "Makeup & Beauty",
  HAIR: "Hair Care",
  BATH: "Bath and Body",
  FEMININE: "Health and Pharma",
  PHARMA: "Health and Pharma",
};

// Each entry: { raw, category, section }
const rawData = [
  // ── MAKEUP & BEAUTY ────────────────────────────────────────────────────────
  { raw: `name:Fit Me Matte+Poreless Liquid Foundation ,price:329 ,weight:18 ml - 128 Warm Nude, brand: Maybelline New York`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Mehendi Cone ,price:40 ,weight:100 g - (4 * 25 g), brand: Neha Herbals`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Everstay Hydrating Longstay Matte Lipstick ,price:749 ,weight:4.2 g - 03 Mauve Muse, brand: Renee`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Sunkisser A Highlighter + Blush - 12H Wear ,price:699, brand: Maybelline New York`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Dip & Twist Nail Paint Remover ,price:115 ,originalPrice:125 ,weight:40 ml, brand: Maybelline New York`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Matte Box Lipsticks ,price:427 ,originalPrice:447 ,weight:9.6 g - (3 * 3.2 g), brand: Blue Heaven`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:9 to 5 Primer + Matte Powder Foundation ,price:559 ,originalPrice:599, brand: MARS Cosmetics`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:9 to 5 Eyeconic Kajal Twin Pack ,price:450 ,weight:0.35 g - (Pack of 2), brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Clean Girl Aesthetic Nail Paint ,price:645 ,weight:55 ml - (Set of 5), brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Fit Me Matte + Poreless Powder - 310 Sun Beige ,price:577, brand: Maybelline New York`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Eyeconic Kajal ,price:225 ,weight:0.35 g - Depp Black, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Get Bold Pencil Kajal ,price:75 ,weight:3.2 g - Black, brand: Blue Heaven`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Intense Matte Lipstick ,price:587.50 ,originalPrice:650.00 ,weight:3.6 g - Burgundy Passion, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Oil Blotter Gel Compact ,price:399 ,weight:5 g, brand: MARS Cosmetics`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Colossal Bold Eyeliner - Black ,price:319 ,weight:3 g, brand: Maybelline New York`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:LNC-03 Large Nail Clipper With Anti-Slip Grip ,price:150 ,weight:1 pcs, brand: Veg`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Lash Sensational Waterproof Mascara - Black ,price:599 ,weight:10 g, brand: Maybelline New York`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Oil Infused Cleaning Water - Waterproof Makeup ,price:309 ,weight:125 ml, brand: Garnier`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Forever Matte Liquid Lip Colour - Nude Dream ,price:425 ,originalPrice:450, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:9 to 5 CC Cream - SPF 30 PA++ ,price:389 ,originalPrice:399, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Stainless Steel Facial Hair Cutting Scissors ,price:69 ,weight:1 pcs, brand: Se7en`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Kajal ,price:140 ,weight:2.6 g, brand: Himalaya`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:All-in-1 Micellar Cleansing Water ,price:285 ,weight:125 ml, brand: Ganier`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Forever Matte Compact Powder - With Vitamin E ,price:269, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Saj Dhaj Festive Makeup Kit ,price:649 ,originalPrice:749 ,weight:10 pcs, brand: Blue Heaven`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Eyeconic Volumizing Mascara ,price:456 ,originalPrice:475 ,weight:12 ml - Black, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Face Powder - Matte Finish, Oil Control, For Rosy Glow ,price:245, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Instant Nail Paint Remover ,price:49 ,weight:28 ml, brand: Blue Heaven`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Nail Polish Remove Wipes ,price:99 ,weight:30 pcs, brand: CoCaBo`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Cotton Pads - For MakeUp & Nail Polish Removal ,price:180 ,weight:100 pcs, brand: Tulips`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:BB+ Cream - With SPF 30 PA++, For Spot Coverage ,price:189 ,weight:18 g, brand: Ponds`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Eye Drama Kajal ,price:125 ,weight:0.35 g - Bold Black, brand: Eile 18`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Creamy Matte Long Stay Lipstick ,price:399 ,weight:4.2 g - 04 Mauve Bloom, brand: Mamaearth`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Water Resistant Black Out Liner ,price:110 ,weight:5 ml, brand: Eile 18`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:BB+ Cream - SPF 30 PA++ with Niacinamide ,price:310 ,originalPrice:315 ,weight:30 g - Light, brand: Ponds`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Forever Matte Liquid Sindoor ,price:199 ,weight:5 ml - Red, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Liquid Lip Colour ,price:160, brand: Eile 18`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Cotton Pads ,price:60 ,originalPrice:99 ,weight:30 pcs, brand: buyto`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Face Soft Pad Pink Tone- Cotton Powder Puff ,price:129 ,weight:1 pcs, brand: Majestique`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Nail Clipper ,price:99 ,weight:1 pcs, brand: Majestique`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Curved Wide Hair Dye Brush - With Comfortable ,price:89 ,weight:1 pcs, brand: Majestique`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Nail Pops Nail Colour ,price:65 ,weight:5 ml - Shade 30, brand: Eile 18`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Powder Puff - Cotton, PP-75 ,price:170 ,weight:1 pcs, brand: Vega`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Nail Colour Remover ,price:110 ,weight:27 ml, brand: Lakme`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:DS-XL 18 Full Hand Mehndi Stencil Stickers - Black ,price:99 ,weight:1 pair, brand: DailySo`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:LNC-02 Large Nail Clipper/Cutter ,price:140 ,weight:1 pcs, brand: Vega`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Lash Twist Curling Mascara ,price:149, brand: Blue Heaven`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Volumax Mascara ,price:449 ,weight:10 ml, brand: Renee`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:10X Volumising Mascara ,price:90 ,weight:8 ml - Black, brand: Blue Heaven`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:BB Bright SPF 15 Face Cream ,price:125 ,weight:18 g - Shade 01, brand: Glow & Lovely`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:EV-19 Blush Brush With Wooden Handle ,price:210 ,weight:1 pcs, brand: Vega`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Stainless Steel Toenail Clipper ,price:185 ,weight:1 pcs, brand: Gubb`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Ds-SM 20 Hand Mehndi Stencil Stickers - Black ,price:80 ,weight:2 pcs (1 pair), brand: DailySo`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Gold Oil Base Mehandi Cones ,price:30 ,weight:2 pcs, brand: Neha Herbals`, category: "Makeup & Beauty", section: "makeup" },
  { raw: `name:Baby Nail Clipper/Cutter with Skin Guard ,price:170 ,weight:1 pcs, brand: Vega`, category: "Makeup & Beauty", section: "makeup" },

  // ── HAIR CARE ──────────────────────────────────────────────────────────────
  { raw: `name:Excellence Creme Hair Color ,price:769, brand: L'Oreal Paris`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Pure Coconut Oil ,price:349 ,weight:600 ml - Bottle, brand: Parachute`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Casting Creme Gloss Hair Colour ,price:705 ,originalPrice:729, brand: L'Oreal Paris`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Keratin Smooth Shampoo ,price:189 ,weight:180 ml, brand: Tresemme`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Casting Creme Gloss Hair Colour ,price:269, brand: L'Oreal Paris`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti Hairfall Regime Serum, Shampoo & Conditioner Combo ,price:999 ,weight:3 pcs - (200 ml + 135 ml + 30 ml), brand: Plix`, category: "Hair Care", section: "hair_care" },
  { raw: `name:100% Pure Coconut Oil ,price:575 ,weight:1 litre - PET Jar, brand: Parachute`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Kerala Virgin Coconut Oil - Cold ,price:499 ,weight:500 ml, brand: Kapiva`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Ready-To-Apply Henna Paste ,price:370 ,weight:220 g - (Pack of 2), brand: Nat Habit`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Hair Fall Rescue Shampoo ,price:1299 ,originalPrice:1370 ,weight:1 litre, brand: Dove`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Organically Natural Gel Hair Colour Trial ,price:249 ,weight:65 g, brand: Indus Valley`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Coconut Milk & Peptides Shampoo ,price:665 ,weight:2 pcs, brand: Plum`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Strong & Long Shampoo With Milk ,price:999 ,originalPrice:1075 ,weight:1 L, brand: Clinic Plus`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Daily Shine Shampoo ,price:999 ,originalPrice:1030 ,weight:1 L, brand: Dove`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Aloe Vera Enriched Coconut Hair Oil ,price:165 ,weight:250 ml, brand: Parachute Advansed`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Shampoo + Conditioner 2-in-1 ,price:1299 ,originalPrice:1511 ,weight:1 L, brand: Head & Shoulders`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Hair Growth Serum Roll-On ,price:599 ,weight:25 ml, brand: Be Bodywise`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Bringha Scalp Serum ,price:576 ,weight:30 ml, brand: Indulekha`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Dryness Care Conditioner ,price:313 ,weight:175 ml, brand: Dove`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti-Hairfall Shampoo - Scalp & Hair Medicine Nourishes Deep ,price:155 ,weight:200 ml, brand: Kesh King`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Easy-Do-It Yourself 10 Minutes Hair Color ,price:126 ,weight:100 ml - Natural Black, brand: Indica`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Dandruff Care Shampoo ,price:435 ,weight:340 ml, brand: Dove`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Hairfall Rescue 1 Minute Conditioner ,price:499 ,originalPrice:555 ,weight:335 ml, brand: Dove`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti-Dandruff Shampoo - Lemon ,price:218 ,weight:180 ml, brand: Head & Shoulders`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti-Hairfall Shampoo With Bhringraj For All Type of Hairs ,price:335 ,weight:340 ml, brand: Himalaya`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Gold Biotin Coconut Hair Oil ,price:356 ,weight:300 ml, brand: Parachute Advansed`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti-Hairfall Anti-Dandruff Shampoo ,price:477 ,weight:340 ml, brand: Head & Shoulders`, category: "Hair Care", section: "hair_care" },
  { raw: `name:2-in-1 Anti-Dandruff Shampoo + Conditioner ,price:499 ,originalPrice:526 ,weight:340 ml, brand: Head & Shoulders`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Hair Science Silky Smooth Shampoo ,price:899 ,originalPrice:999 ,weight:650 ml, brand: Pantene`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Bringha Hair Oil ,price:513 ,weight:100 ml, brand: Indulekha`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Strong & Healthy Shampoo ,price:435 ,weight:340 ml, brand: Meera`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Smooth & Shine Shampoo With Rice Kanji and Aloe Vera ,price:199 ,weight:180 ml, brand: Meera`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Ayurvedic Cool Oil ,price:165 ,weight:200 ml, brand: Navratna`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Advansed Ayurvedic Coconut Hair Oil ,price:264 ,weight:300 ml, brand: Parachute`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Gentle Daily Care Protein Shampoo ,price:335 ,weight:340 ml, brand: Himalaya`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti-Dandruff Cooling Mint Shampoo ,price:359 ,weight:340 ml, brand: Himalaya`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti-Dandruff Shampoo - Smooth ,price:218 ,weight:180 ml, brand: Head & Shoulders`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Advansed Gold Coconut Hair Oil ,price:399 ,originalPrice:400 ,weight:400 ml, brand: Parachute Advansed`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Gold Keratin Coconut Hair Oil ,price:356 ,weight:300 ml, brand: Parachute Advansed`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Organically Natural Gel Hair Colour ,price:249 ,weight:65 g, brand: Indus Valley`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Onion Shampoo For Hair Growth & Hairfall Control ,price:349 ,weight:250 ml, brand: Mamaearth`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Onion & Jojoba Oil Blends Shampoo ,price:399 ,originalPrice:429 ,weight:370 ml, brand: Sunsilk`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Rich Creme Hair Colour ,price:40, brand: Godrej Expert`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Colors Natural Mini ,price:109, brand: Garnier`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Radiant Black Shine Shampoo ,price:173 ,weight:180 ml, brand: Sunsilk`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Bringha Shampoo - Proprietary ,price:135 ,weight:100 ml, brand: Indulekha`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Almond Oil - Roghan Badam Shirin ,price:254 ,weight:50 ml, brand: Hamdard`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Color Naturals Long Lasting Creme Hair Colour ,price:229, brand: Garnier`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Natural Rosemary Hair Oil ,price:345 ,weight:100 ml, brand: Brillare`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Rich Creme Hair Colour - Natural ,price:15, brand: Godrej Expert`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Strong Scalp Anti-Dandruff Shampoo ,price:169 ,weight:175 ml, brand: Clinic Plus`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Hairfall Defense+ Professional Shampoo ,price:1199 ,originalPrice:1370 ,weight:1 L, brand: Tresemme`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Hair Highlighting Kit ,price:390, brand: Streax`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Keratin Smooth Conditioner ,price:320 ,weight:175 ml, brand: Tresemme`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti-Dandruff Shampoo - Cool ,price:1599 ,weight:1 L, brand: Head & Shoulders`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Bringha Hairfall Control Shampoo ,price:972 ,weight:580 ml, brand: Indulekha`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Intense Repair 1 Minute Conditioner ,price:313 ,weight:175 ml, brand: Dove`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Shampoo Based Hair Colour ,price:35, brand: Garnier Men`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Deep Cleanse Anti-Dandruff Shampoo ,price:434 ,weight:340 ml, brand: Head & Shoulders`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Flowy Silk Smooth Shampoo ,price:166 ,weight:180 ml, brand: Sunsilk`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Natural Shine Henna ,price:75 ,weight:120 g, brand: Himalaya`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Natural Henna Paste - Ready To Apply ,price:249 ,weight:200 g, brand: Mamaearth`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Fresh Neem Anti-Dandruff Shampoo ,price:205 ,weight:180 ml, brand: BIOTIQUE`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Kesh Kanti Natural Hair Cleanser ,price:89 ,weight:180 ml, brand: Patanjali`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Jasmine Gold Coconut Hair Oil ,price:218 ,weight:300 ml, brand: Parachute Advansed`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Dandruff Defense Shampoo With Tea Tree Oil ,price:293 ,weight:200 ml, brand: Naturali`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Easy Hair Color ,price:42 ,weight:25 ml, brand: Indica`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Bio Neem Margosa Anti-Dandruff Shampoo ,price:155 ,weight:120 ml, brand: BIOTIQUE`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Ocean Kelp Anti-Hairfall Shampoo ,price:199 ,weight:180 ml, brand: BIOTIQUE`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Anti-Dandruff Hair Cream ,price:100 ,weight:100 ml, brand: Himalaya`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Coconut Oil ,price:110 ,weight:200 ml, brand: Patanjali`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Thyme Volume & Bounce Conditioner ,price:260 ,weight:200 ml, brand: BIOTIQUE`, category: "Hair Care", section: "hair_care" },
  { raw: `name:Xpress Shampoo Hair Colour ,price:120 ,weight:18 ml - (Pack of 4), brand: Godrej Selfie`, category: "Hair Care", section: "hair_care" },

  // ── BATHING ────────────────────────────────────────────────────────────────
  { raw: `name:Skin Moisturizing Sandal & Turmeric Bathing Soap ,price:399 ,originalPrice:410 ,weight:125 g - (Pack of 8), brand: Santoor`, category: "Bath and Body", section: "bath" },
  { raw: `name:Cream Beauty Soap Bar ,price:499 ,originalPrice:519 ,weight:125 g - (Buy 4 Get 1 Free), brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Original Glycerin Soap Bar - Pure & Gentle Glow ,price:399 ,originalPrice:401 ,weight:125 g - (Buy 4 Get 1 Free), brand: Pears`, category: "Bath and Body", section: "bath" },
  { raw: `name:Skincare Liquid Handwash ,price:219 ,weight:1350 ml - Pouch, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Original Liquid Handwash ,price:219 ,weight:1350 ml - Pouch, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Total Soap ,price:152 ,weight:125 g - (Pack of 4), brand: Lifebuoy`, category: "Bath and Body", section: "bath" },
  { raw: `name:Pure & Gentle Body Wash ,price:130 ,weight:250 ml, brand: Pears`, category: "Bath and Body", section: "bath" },
  { raw: `name:Almond Oil Nourishing Bathing Bar ,price:173 ,weight:75 g - (Pack of 3), brand: BIOTIQUE`, category: "Bath and Body", section: "bath" },
  { raw: `name:Sensitive Liquid Handwash ,price:219 ,weight:1.35 L, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Bathing Soap - Gold ,price:90 ,weight:125 g, brand: Mysore Sandal`, category: "Bath and Body", section: "bath" },
  { raw: `name:Moisturising Liquid Handwash - Mahogany ,price:119 ,weight:675 ml - Refill Pack, brand: Beco`, category: "Bath and Body", section: "bath" },
  { raw: `name:Handwash - Fresh ,price:99 ,weight:600 ml, brand: Santoor`, category: "Bath and Body", section: "bath" },
  { raw: `name:Orchid & Lily Fragrance Foaming Handwash ,price:135 ,weight:250 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Deep Moisture Body Wash ,price:520 ,originalPrice:580 ,weight:800 ml, brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Renew Nourishing Body Wash - Raspberry & Lime ,price:899 ,originalPrice:949 ,weight:1 L, brand: Dove Body Wash`, category: "Bath and Body", section: "bath" },
  { raw: `name:International Smooth & Radiant Bathing Soap ,price:320 ,weight:520 g - (4 * 130 g), brand: Lux`, category: "Bath and Body", section: "bath" },
  { raw: `name:Bathing Soap ,price:75 ,weight:150 g - Carton, brand: Mysore Sandal`, category: "Bath and Body", section: "bath" },
  { raw: `name:Sandal, Jasmine, Rose Soap ,price:200 ,weight:150 g - (Pack of 3), brand: Mysore Sandal`, category: "Bath and Body", section: "bath" },
  { raw: `name:Classic Ayurvedic Bathing Soap ,price:52 ,weight:125 g, brand: Medimix`, category: "Bath and Body", section: "bath" },
  { raw: `name:Sandal & Almond Milk Bathing Soap ,price:310 ,originalPrice:336 ,weight:150 g - (Pack of 6), brand: Santoor`, category: "Bath and Body", section: "bath" },
  { raw: `name:Skincare Liquid Handwash - Pump ,price:79 ,weight:200 ml - Pump, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Neem Bathing Soap Bar With Pure Neem Oil ,price:126 ,weight:300 g - (Buy 3 Get 1 Free), brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Mild Gentle Hand Wash With Goodness of Lotus & Tulsi ,price:105 ,weight:200 ml - (Pack of 2), brand: Santoor`, category: "Bath and Body", section: "bath" },
  { raw: `name:Beauty Perfumed Talc with Sandalwood Extracts ,price:370 ,weight:400 g - (Pack of 2), brand: Santoor`, category: "Bath and Body", section: "bath" },
  { raw: `name:Icy Cool Soap ,price:298 ,weight:125 g - (Pack of 5), brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Glow Lush Rose Bathing Soap Bar With Vitamin C ,price:185 ,weight:450 g - (3 * 150 g), brand: Lux`, category: "Bath and Body", section: "bath" },
  { raw: `name:Body Wash ,price:175 ,weight:200 ml, brand: Mysore Sandal`, category: "Bath and Body", section: "bath" },
  { raw: `name:Germ Protection Handwash - Moisture ,price:99 ,weight:650 ml, brand: Salvon`, category: "Bath and Body", section: "bath" },
  { raw: `name:Orchid & Lily Fragrance Foaming Handwash - Large ,price:179 ,weight:700 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Syndet Bar ,price:249 ,weight:75 ml, brand: Cetaphil`, category: "Bath and Body", section: "bath" },
  { raw: `name:Dreamflower Pink Lily Perfume Powder ,price:59 ,weight:40 g, brand: Pond's`, category: "Bath and Body", section: "bath" },
  { raw: `name:Bathing Bar - Multi Variant (Buy 4 & Get 1 Free) ,price:480 ,weight:625 g, brand: Fiama`, category: "Bath and Body", section: "bath" },
  { raw: `name:Total 10 Protect Liquid Handwash - With Vitamins ,price:199 ,weight:675 ml - (Buy 1 Get 1 Free), brand: Lifebuoy`, category: "Bath and Body", section: "bath" },
  { raw: `name:Bathing Soap - Neem & Turmeric ,price:124 ,weight:75 g - (Pack of 4), brand: Himalaya`, category: "Bath and Body", section: "bath" },
  { raw: `name:Cool Bath Soap - 99.9% Germ Protection ,price:210 ,weight:100 g, brand: Cinthol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Shower Gel - Waterlily & Oil ,price:110 ,weight:125 ml, brand: Nivea`, category: "Bath and Body", section: "bath" },
  { raw: `name:Original Bath Soap - 99.9% Germ Protection ,price:270 ,weight:150 g - (Pack of 4), brand: Cinthol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Classic Gentle Handwash - Sandalwood & Tulsi ,price:209 ,weight:1200 ml, brand: Santoor`, category: "Bath and Body", section: "bath" },
  { raw: `name:Lime Foam Body Wash ,price:120 ,weight:200 ml, brand: Cinthol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Clear Glycerine Deep Hydration Bathing Soap ,price:50 ,weight:100 g, brand: Medimix`, category: "Bath and Body", section: "bath" },
  { raw: `name:Clear Glycerine Oil Balance Bathing Soap Bar ,price:50 ,weight:100 g, brand: Medimix`, category: "Bath and Body", section: "bath" },
  { raw: `name:Pure & Gentle Body Wash Refill ,price:199 ,weight:400 ml - Pouch, brand: Pears`, category: "Bath and Body", section: "bath" },
  { raw: `name:Liquid Handwash - Soap Free Formula, Everyday Use ,price:99 ,weight:200 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Gentle Exfoliating Body Wash ,price:235 ,weight:250 ml, brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Ayurvedic Soap ,price:156 ,weight:125 g - (Pack of 3), brand: Chandrika`, category: "Bath and Body", section: "bath" },
  { raw: `name:Magic Body Wash - Saffron + Lactic Acid ,price:499 ,weight:250 ml, brand: Ghar Soaps`, category: "Bath and Body", section: "bath" },
  { raw: `name:Naturale Pomegranate Brightening Body Wash ,price:180 ,weight:250 ml, brand: Pears`, category: "Bath and Body", section: "bath" },
  { raw: `name:Hand Sanitiser ,price:140 ,weight:200 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Gel Bathing Bar - Men, Refreshing Pulse ,price:84 ,weight:125 g, brand: Fiama`, category: "Bath and Body", section: "bath" },
  { raw: `name:Sensitive Care Pro-Ceramide Serum Bar ,price:330 ,weight:125 g - (Pack of 3), brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Men Active Clean 3 in 1 Shower Gel ,price:499 ,originalPrice:599 ,weight:500 ml, brand: Nivea`, category: "Bath and Body", section: "bath" },
  { raw: `name:Soft & Fresh Glycerine & Mint Extracts Bathing Bar ,price:380 ,weight:125 g - (Pack of 4), brand: Pears`, category: "Bath and Body", section: "bath" },
  { raw: `name:Fresh Hydrate Hydration Serum Bar ,price:70 ,weight:75 g, brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Hand Wash Liquid - Jojoba, Vanilla & Almond ,price:399 ,weight:500 ml, brand: Baylis & Harding`, category: "Bath and Body", section: "bath" },
  { raw: `name:Magnolia Magic Radiant Body Wash with Niacinamide ,price:99 ,weight:245 ml, brand: Lux`, category: "Bath and Body", section: "bath" },
  { raw: `name:Handwash - Rose ,price:90 ,weight:250 ml, brand: Mysore Sandal`, category: "Bath and Body", section: "bath" },
  { raw: `name:Pink Rosa Beauty Bathing Bar 1/4th Moisturizing ,price:70 ,weight:100 g, brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Original Bathing Soap Bar with 12 Hr Germ Protection ,price:170 ,weight:400 g - (Pack of 4), brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Brightening Body Wash - Rose & Aloe Vera for Soft Skin ,price:355 ,weight:400 ml, brand: Lux`, category: "Bath and Body", section: "bath" },
  { raw: `name:Glow Lush Rose Bathing Soap Bar with Vitamin C ,price:345 ,weight:750 g, brand: Lux`, category: "Bath and Body", section: "bath" },
  { raw: `name:Refreshing Bodywash with Triple Hydration ,price:235 ,weight:300 ml, brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Men Pure Impact 3 in 1 Shower Gel ,price:293 ,weight:250 ml, brand: Nivea`, category: "Bath and Body", section: "bath" },
  { raw: `name:Foaming Handwash - 10x Better Germ Protection ,price:179 ,weight:700 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Strawberry Fragrance Foaming Handwash ,price:109 ,weight:250 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Shower Gel Freesia Scent & Aloe Vera Bodywash ,price:109 ,weight:245 ml, brand: Lux`, category: "Bath and Body", section: "bath" },
  { raw: `name:Sandalwood Bar for Glowing Skin - Natural Origin Sandalwood and Saffron ,price:330 ,weight:125 g - (Pack of 3), brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Original Soap ,price:40 ,weight:100 g, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Original Foam Body Wash ,price:330 ,weight:750 ml, brand: Cinthol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Sandal Foam Body Wash ,price:120 ,weight:200 ml, brand: Cinthol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Soft Fresh Body Wash ,price:499 ,weight:750 ml, brand: Pears`, category: "Bath and Body", section: "bath" },
  { raw: `name:Creme Berries & Tulsi Handwash ,price:99 ,weight:600 ml, brand: Santoor`, category: "Bath and Body", section: "bath" },
  { raw: `name:Foaming Handwash Combo - Aloe Coconut & Strawberry Fragrance ,price:218 ,weight:250 ml - (Pack of 2), brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Lime & Aloe Vera Bathing Soap ,price:315 ,weight:125 g - (Pack of 6), brand: Santoor`, category: "Bath and Body", section: "bath" },
  { raw: `name:Relax Hand Wash - Lavender & Ylang ,price:289 ,weight:750 ml, brand: Fiama`, category: "Bath and Body", section: "bath" },
  { raw: `name:Haldi Chandan Kanti Body Cleanser ,price:99 ,weight:75 g - (Buy 4 Get 1 Free), brand: Patanjali`, category: "Bath and Body", section: "bath" },
  { raw: `name:Original Liquid Handwash - Refill ,price:155 ,weight:875 ml - Refill Pack, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Hand Wash - Sensitive ,price:79 ,weight:200 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Bathing Soap - Honey & Cream ,price:36 ,weight:75 g, brand: Himalaya`, category: "Bath and Body", section: "bath" },
  { raw: `name:Body Back / Neck / Feet Scrubber - Brown ,price:169 ,originalPrice:189 ,weight:1 pcs, brand: buyto home`, category: "Bath and Body", section: "bath" },
  { raw: `name:Almond & Rose Bathing Soap ,price:60 ,weight:125 g, brand: Himalaya`, category: "Bath and Body", section: "bath" },
  { raw: `name:Hand Wash - Herbal ,price:60 ,weight:250 ml, brand: Patanjali`, category: "Bath and Body", section: "bath" },
  { raw: `name:Perfumed Talc - Fresh Flower Shower ,price:60 ,weight:100 g, brand: Eva`, category: "Bath and Body", section: "bath" },
  { raw: `name:Foaming Handwash - Pump + Refill Combo ,price:159 ,weight:250 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Original Germ Defence Liquid Handwash ,price:129 ,weight:210 ml - (Buy 1 Get 1 Free), brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Germ Expert Prickly Heat Powder - Cool ,price:50 ,weight:50 g, brand: Nycil`, category: "Bath and Body", section: "bath" },
  { raw: `name:Perfumed Deo Talc - Fantasy ,price:60 ,weight:100 g, brand: Eva`, category: "Bath and Body", section: "bath" },
  { raw: `name:Neem Kanti Body Cleanser Soap ,price:22 ,weight:75 g - Carton, brand: Patanjali`, category: "Bath and Body", section: "bath" },
  { raw: `name:Aloe Vera Kanti Body Cleanser Soap ,price:22 ,weight:75 g, brand: Patanjali`, category: "Bath and Body", section: "bath" },
  { raw: `name:Neem & Aloe Vera Soap Bar 100% Better Skin ,price:42 ,weight:100 g, brand: Lifebuoy`, category: "Bath and Body", section: "bath" },
  { raw: `name:Perfumed Talc - Sweet Exotic Rose ,price:60 ,weight:100 g, brand: Eva`, category: "Bath and Body", section: "bath" },
  { raw: `name:Ice Bath Bodywash with Cool Sense Actives ,price:390 ,weight:750 ml, brand: Lifebuoy`, category: "Bath and Body", section: "bath" },
  { raw: `name:Icy Cool Soap 150g ,price:72 ,weight:150 g, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Apricot Body Wash - Soap Free ,price:449 ,weight:500 ml, brand: BIOTIQUE`, category: "Bath and Body", section: "bath" },
  { raw: `name:Sandal Glow Serum Bar ,price:108 ,weight:125 g, brand: Dove`, category: "Bath and Body", section: "bath" },

  // ── FEMININE HYGIENE ───────────────────────────────────────────────────────
  { raw: `name:Secure Nights Sanitary Pad - With Cottony Soft ,price:299 ,originalPrice:328 ,weight:40 pcs, brand: STAYFREE`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Mint Toilet Seat Sanitizer Spray ,price:180 ,weight:75 ml, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Choice Ultra Sanitary Pads - XL For Heavy Flow ,price:299 ,originalPrice:320 ,weight:40 pcs, brand: Whisper`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Thick Bindazz Nights Sanitary Pads - XXXL ,price:502 ,originalPrice:800 ,weight:20 pcs, brand: Whisper`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Choice Nights Pads - All Night Protection XXL ,price:130 ,weight:16 pcs, brand: Whisper`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Sanitary Pads - Secure XL Cottony Soft with Wings ,price:45 ,weight:6 pcs, brand: STAYFREE`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Ultra Bindazz Nights Sanitary Pads - XXL ,price:110 ,originalPrice:115 ,weight:7 pcs, brand: Whisper`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Super Absorbent Period Panty 360 Degree ,price:656 ,originalPrice:957 ,weight:18 pcs, brand: Whisper`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Ultra Soft Air Fresh Sanitary Pads With Wider and Longer Back ,price:449 ,originalPrice:699 ,weight:50 pcs, brand: Whisper`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Secure Cottony XL Sanitary Pads For Women ,price:273 ,weight:40 pcs, brand: STAYFREE`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Ultra Bindazz Nights Sanitary Pads - XXL+ ,price:549 ,originalPrice:655 ,weight:30 pcs, brand: Whisper`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Anti-Bacteria Sanitary Pads - XL ,price:470 ,weight:48 pcs, brand: Sofy`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Advanced Sanitary Napkins ,price:499 ,originalPrice:575 ,weight:42 pcs, brand: STAYFREE`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Plus Expert Intimate Hygiene Liquid Wash ,price:440 ,weight:200 ml, brand: Vwash`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Thick Bindazz Nights Sanitary Pads - XXXL ,price:719 ,weight:30 pcs, brand: Whisper`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Secure Dry Cover With Wings XL ,price:37 ,weight:6 pcs, brand: STAYFREE`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Period Panty M/L ,price:219 ,weight:5 pcs, brand: Plush`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Reusable Menstrual Cup - Medium ,price:327 ,weight:1 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Pure Aloe Vera Hair Removal Cream For Women ,price:325 ,weight:100 g, brand: Veet`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Smooth Sensitive Hair Removal Razor for Women ,price:325 ,weight:1 pcs, brand: Gillette Venus`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Breeze Hair Removal Razor for Women ,price:399 ,weight:1 pcs, brand: Gillette Venus`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Smooth & Precise Face Razor for Women ,price:119 ,weight:3 pcs, brand: Azah`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Body Wax Strips - For Sensitive Skin ,price:119 ,weight:1 pcs, brand: Bombay Shaving Company`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Period Panty L/XL ,price:229 ,weight:5 pcs, brand: Plush`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Facial Wax Strips Sakura ,price:299 ,weight:16 pcs, brand: Sanfe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Smooth Glide Body Razor For Women - Pain Free Instant Hair Removal ,price:169 ,weight:3 pcs, brand: Azah`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Pain Relief Heat Patches ,price:349 ,weight:3 pcs, brand: SIRONA`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Eyebrow Touch Up Face 5 in 1 Razor - For Upper Lip, Chin, Bikini Line ,price:99 ,weight:3 pcs, brand: Sanfe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Ready To Use Wax Strips For Normal Skin ,price:129 ,weight:8 pcs, brand: Veet`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Gold Honey Wax ,price:399 ,weight:600 g, brand: Namyaa`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Ready To Use Wax Strips For Sensitive Skin ,price:129 ,weight:8 pcs, brand: Veet`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Ready To Use Wax Strips For Normal Skin - 20 Strips ,price:299 ,weight:20 pcs, brand: Veet`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Shave Gel - Sensitive Skin ,price:299 ,weight:195 g, brand: Gillette Venus`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Evior Bikini Line Trimming Razor For Women ,price:199 ,weight:3 pcs, brand: LetsShave`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Daily Fresh Pantyliner ,price:185 ,weight:40 pcs, brand: Sofy`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Pure Hair Removal Cream For Dry to Normal Skin ,price:115 ,weight:30 g, brand: Veet`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:100% Organic Biodegradable Cotton ,price:99 ,weight:6 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Floral Toilet Seat Sanitizer Spray ,price:180 ,weight:75 ml, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Prega News Value Pack HCG Home Pregnancy Test ,price:200 ,weight:1 pack - (2N * 3 pcs), brand: Mankind`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Portable Jet Spray ,price:2899 ,originalPrice:2999 ,weight:1 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Natural Skincare Intimate Hygiene Wash ,price:350 ,weight:100 ml, brand: Namyaa`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Natural Intimate Wipes For Women ,price:65 ,weight:10 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Refreshing Intimate Wash ,price:75 ,weight:15 ml, brand: SIRONA`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Intimate Hygiene Spray For Women & Men ,price:399 ,weight:60 ml, brand: Hi Life`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Feminine Intimate Wipes - Flushable ,price:399 ,weight:28 pcs, brand: Hi Life`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Daily Intimate Foam Wash ,price:299 ,weight:85 g, brand: Clean & Dry`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Comfort Period Panties L-XL ,price:349 ,weight:8 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Comfort Period Panties XL-XXL ,price:380 ,weight:8 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Ultra Thin Panty Liners 155 mm ,price:99 ,weight:20 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:EaseFit Zero Irritation Tampons For Heavy Flow ,price:220 ,weight:12 pcs, brand: Nua`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Reusable Menstrual Cup - Medium ,price:327 ,weight:1 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:FDA Approved Reusable Menstrual Cup ,price:349 ,weight:1 pcs, brand: SIRONA`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:EaseFit Tampons - Heavy Flow ,price:275 ,weight:16 pcs, brand: Nua`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Premium Applicator Tampons - Heavy Flow ,price:449 ,weight:16 pcs, brand: SIRONA`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Natural Menstrual Cup Wash ,price:249 ,weight:100 ml, brand: SIRONA`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Biodegradable Tampons - Light Flow ,price:279 ,weight:16 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Super Biodegradable Tampons - Medium Flow ,price:320 ,weight:16 pcs, brand: Pee Safe`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Ultra-Soft Menstrual Cup - Reusable Large ,price:499 ,weight:50 g, brand: Namyaa`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Menstrual Cup Sterilizer ,price:399 ,weight:1 pcs, brand: SIRONA`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Tampons for Average Flow ,price:299 ,weight:20 pcs - Carton, brand: STAYFREE`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Tampons - Super For Heavy Flow ,price:199 ,weight:16 pcs - Carton, brand: Bella`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Pumice Stone No 4 ,price:400 ,weight:1 pcs, brand: Ceramic`, category: "Health and Pharma", section: "feminine_hygiene" },
  { raw: `name:Shower Cap BA206 Ideal For All Hair ,price:99 ,weight:1 pcs - Pouch, brand: Majestique`, category: "Bath and Body", section: "bath" },
  { raw: `name:Rose Pink Luxe Premium Bathing Sponge ,price:99 ,weight:1 pcs, brand: buyto home`, category: "Bath and Body", section: "bath" },
  { raw: `name:Pink Pearl Dual Colour Premium Bathing Sponge ,price:99 ,weight:1 pcs, brand: buyto home`, category: "Bath and Body", section: "bath" },
  { raw: `name:Soap Case - Glamour ,price:200 ,weight:1 pcs, brand: Plasto World`, category: "Bath and Body", section: "bath" },
  { raw: `name:Spa Bath Shower Face Head/Hair Cap - Grey ,price:319 ,weight:1 pcs, brand: buyto home`, category: "Bath and Body", section: "bath" },
  { raw: `name:Lavender Dream Premium Bathing Sponge ,price:149 ,weight:1 pcs, brand: buyto home`, category: "Bath and Body", section: "bath" },
  { raw: `name:Puff-A-Loofah Bath Essentials ,price:125 ,weight:1 pcs, brand: Fiama`, category: "Bath and Body", section: "bath" },
  { raw: `name:Deep Moisture Body Wash 800ml ,price:580 ,weight:800 ml, brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Pure & Gentle Shower Gel ,price:460 ,weight:750 ml, brand: Pears`, category: "Bath and Body", section: "bath" },
  { raw: `name:Renew Nourishing Body Wash ,price:949 ,weight:1 L, brand: Dove Body Wash`, category: "Bath and Body", section: "bath" },
  { raw: `name:Antifungal Tea Tree Bath & Body Wash ,price:899 ,weight:500 ml, brand: ST. Dvence`, category: "Bath and Body", section: "bath" },
  { raw: `name:Radiant Body Wash With Niacinamide ,price:109 ,weight:245 ml, brand: Lux`, category: "Bath and Body", section: "bath" },
  { raw: `name:Orchid Obsession Radiant Body Wash ,price:99 ,weight:245 ml, brand: Lux`, category: "Bath and Body", section: "bath" },
  { raw: `name:Cool Foam Body Wash ,price:120 ,weight:200 ml, brand: Cinthol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Relaxing Care Nourishing Body Wash ,price:898 ,originalPrice:949 ,weight:1 L, brand: Dove Body Wash`, category: "Bath and Body", section: "bath" },
  { raw: `name:Guava Tini De-Tan Body Wash ,price:449 ,weight:300 ml, brand: mCaffeine`, category: "Bath and Body", section: "bath" },
  { raw: `name:Naturale Nourishing Coconut Water Body Wash ,price:180 ,weight:250 ml, brand: Pears`, category: "Bath and Body", section: "bath" },
  { raw: `name:Men Refreshing Pulse Shower Gel ,price:159 ,weight:250 ml, brand: Fiama`, category: "Bath and Body", section: "bath" },
  { raw: `name:Lavender Fresh Shower Gel ,price:200 ,weight:250 ml, brand: Dettol`, category: "Bath and Body", section: "bath" },
  { raw: `name:Caramel Crunch Exfoliating Body Wash ,price:449 ,weight:300 ml, brand: mCaffeine`, category: "Bath and Body", section: "bath" },
  { raw: `name:Acne Clear Body Wash with 1% Salicylic Acid ,price:560 ,weight:300 ml, brand: Dove`, category: "Bath and Body", section: "bath" },
  { raw: `name:Romantic Perfumed Talcum Powder with Floral Fragrance for Women ,price:240 ,weight:250 g, brand: Enchanteur`, category: "Bath and Body", section: "bath" },
  { raw: `name:Antifungal Powder - Treats Skin Infection ,price:95.62 ,weight:75 g, brand: Clocip`, category: "Bath and Body", section: "bath" },
  { raw: `name:Talc ,price:44 ,weight:100 g, brand: Mysore Sandal`, category: "Bath and Body", section: "bath" },
  { raw: `name:Imperial Jasmine Perfumed Talc for Women ,price:139 ,weight:100 g, brand: Yardley London`, category: "Bath and Body", section: "bath" },
  { raw: `name:Germ Expert Prickly Heat Powder - Cool Herbal ,price:50 ,weight:50 g, brand: Nycil`, category: "Bath and Body", section: "bath" },
  { raw: `name:Germ Expert Prickly Heat Powder - Cool Gulabjal ,price:50 ,weight:50 g, brand: Nycil`, category: "Bath and Body", section: "bath" },
  { raw: `name:Sandal Natural Sunscreen Powder ,price:135 ,weight:80 g, brand: Pond's`, category: "Bath and Body", section: "bath" },
  { raw: `name:Magic Lavender Bloom Perfume Powder ,price:69 ,weight:40 g, brand: Pond's`, category: "Bath and Body", section: "bath" },

  // ── PHARMACY ───────────────────────────────────────────────────────────────
  { raw: `name:Ashwagandha Gold Capsule - Ayurvedic ,price:562 ,weight:60 pcs, brand: Kalpva`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Gold Standard Double Rich Chocolate Whey Protein ,price:5079 ,weight:907 g, brand: Optimum Nutrition`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Antiseptic Liquid ,price:591.20 ,weight:1.3 L, brand: Dettol`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Wellness Hemp Migraine Pain Relief Roll On ,price:449 ,weight:10 ml, brand: Hampa`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Non-Contact Infrared Thermometer ,price:1895 ,originalPrice:1995 ,weight:1 pcs, brand: Accusure`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Wellness Hemp Muscle Pain Relief Oil ,price:1299 ,weight:100 ml, brand: Hampa`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Choco Almond & Cranberry High Protein Muesli+ ,price:588 ,originalPrice:790 ,weight:350 g * 2, brand: Yoga Bar`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Orthotics Posture Corrector - Slim Lightweight Adjustable ,price:1343 ,weight:1 pcs, brand: Frido`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Ayurveda Castor Oil ,price:140 ,weight:200 ml, brand: Mamta Swastik Ayurveda`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Chocolate Flavour Fermented Yeast Protein Powder ,price:1299 ,weight:500 g, brand: Yoga Bar`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Abdominal Support 23 cm Grey Large ,price:861 ,weight:1 pcs, brand: Tynor`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:LLHC09 Electric Hot Water Bag With Panda Cover ,price:1999 ,originalPrice:2249 ,weight:1 Unit, brand: Lifelong`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Omron BP Monitor HEM 7121-J ,price:2316 ,weight:1 Unit, brand: Omron`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Himalayan Shilajit Resin ,price:1199 ,weight:20 g, brand: Kaplva`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Gulkand ,price:150 ,weight:400 g, brand: Patanjali`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:ORS Ready To Drink - Apple Flavour ,price:32.26 ,weight:200 ml, brand: ORSL`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Pro Clean Chocolate Flavour With Monk Fruit Plant Protein ,price:1599 ,originalPrice:1645 ,weight:500 g, brand: Yoga Bar`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Pulse Oximeter ,price:1999 ,weight:1 pcs, brand: Microtek`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Dry + Wet Cough Syrup ,price:121 ,weight:100 ml, brand: Vicks`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Wheat Grass Powder - Natural ,price:425 ,weight:100 g, brand: Organic India`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Washproof Plaster Medicated Dressings ,price:55 ,weight:20 pcs, brand: Hansaplast`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Micronised Creatine Powder - Unflavoured ,price:619 ,weight:100 g, brand: Optimum Nutrition`, category: "Health and Pharma", section: "pharma" },
  { raw: `name:Original Multi-use Skin & Surface Wipes ,price:259 ,weight:80 pcs, brand: Dettol`, category: "Health and Pharma", section: "pharma" },
];

// ─────────────────────────────────────────────
//  IMAGE MAPS
// ─────────────────────────────────────────────

const makeupImages = {
  lipstick:     "https://images.unsplash.com/photo-1586495777744-4e6232bf5e79?w=500&auto=format&fit=crop",
  foundation:   "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=500&auto=format&fit=crop",
  kajal:        "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=500&auto=format&fit=crop",
  mascara:      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop",
  nail:         "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop",
  eyeliner:     "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop",
  blush:        "https://images.unsplash.com/photo-1596704017307-34322485e1db?w=500&auto=format&fit=crop",
  powder:       "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop",
  mehendi:      "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=500&auto=format&fit=crop",
  bb_cream:     "https://images.unsplash.com/photo-1526758097130-bab247274f58?w=500&auto=format&fit=crop",
  cleaning:     "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop",
  cotton:       "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop",
  tool:         "https://images.unsplash.com/photo-1583241801015-1cf13bf7efeb?w=500&auto=format&fit=crop",
  default:      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop",
};

const hairImages = {
  shampoo:      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop",
  conditioner:  "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop",
  oil:          "https://images.unsplash.com/photo-1617897903246-719242758050?w=500&auto=format&fit=crop",
  color:        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop",
  henna:        "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=500&auto=format&fit=crop",
  serum:        "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=500&auto=format&fit=crop",
  default:      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop",
};

const bathImages = {
  soap:         "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=500&auto=format&fit=crop",
  handwash:     "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop",
  bodywash:     "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop",
  talc:         "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop",
  sanitiser:    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop",
  default:      "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=500&auto=format&fit=crop",
};

const pharmaImages = {
  pad:          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop",
  menstrual:    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop",
  razor:        "https://images.unsplash.com/photo-1583241801015-1cf13bf7efeb?w=500&auto=format&fit=crop",
  wax:          "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop",
  intimate:     "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop",
  protein:      "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&auto=format&fit=crop",
  supplement:   "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&auto=format&fit=crop",
  device:       "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&auto=format&fit=crop",
  antiseptic:   "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop",
  default:      "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&auto=format&fit=crop",
};

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function parseLine(rawStr) {
  const cleanLine = rawStr.trim();
  const fields = ["name", "price", "originalPrice", "weight", "brand"];
  const indices = fields
    .map((k) => ({ key: k, index: cleanLine.indexOf(`${k}:`) }))
    .filter((p) => p.index !== -1)
    .sort((a, b) => a.index - b.index);

  const result = {};
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].index + indices[i].key.length + 1;
    const end = i + 1 < indices.length ? indices[i + 1].index : cleanLine.length;
    let val = cleanLine.substring(start, end).trim().replace(/^[,\s]+|[,\s]+$/g, "").trim();
    result[indices[i].key] = val;
  }
  return result;
}

function getImageForProduct(name, section) {
  const l = name.toLowerCase();
  if (section === "makeup") {
    if (l.includes("lipstick") || l.includes("lip colour") || l.includes("lip color") || l.includes("sindoor")) return makeupImages.lipstick;
    if (l.includes("foundation") || l.includes("powder") || l.includes("compact") || l.includes("cc cream") || l.includes("bb+") || l.includes("bb cream")) return makeupImages.foundation;
    if (l.includes("kajal") || l.includes("liner") || l.includes("kohl")) return makeupImages.kajal;
    if (l.includes("mascara")) return makeupImages.mascara;
    if (l.includes("nail")) return makeupImages.nail;
    if (l.includes("eyeliner")) return makeupImages.eyeliner;
    if (l.includes("blush") || l.includes("highlighter") || l.includes("blusher")) return makeupImages.blush;
    if (l.includes("mehendi") || l.includes("henna") || l.includes("mehndi") || l.includes("stencil")) return makeupImages.mehendi;
    if (l.includes("micellar") || l.includes("cleansing") || l.includes("remover")) return makeupImages.cleaning;
    if (l.includes("cotton") || l.includes("puff") || l.includes("pad")) return makeupImages.cotton;
    if (l.includes("brush") || l.includes("scissor") || l.includes("clipper") || l.includes("cutter")) return makeupImages.tool;
    return makeupImages.default;
  }
  if (section === "hair_care") {
    if (l.includes("shampoo")) return hairImages.shampoo;
    if (l.includes("conditioner")) return hairImages.conditioner;
    if (l.includes("oil")) return hairImages.oil;
    if (l.includes("color") || l.includes("colour") || l.includes("dye") || l.includes("highlight")) return hairImages.color;
    if (l.includes("henna") || l.includes("paste")) return hairImages.henna;
    if (l.includes("serum")) return hairImages.serum;
    return hairImages.default;
  }
  if (section === "bath") {
    if (l.includes("soap") || l.includes("bar")) return bathImages.soap;
    if (l.includes("handwash") || l.includes("hand wash") || l.includes("sanitiser") || l.includes("sanitizer")) return bathImages.handwash;
    if (l.includes("body wash") || l.includes("bodywash") || l.includes("shower gel")) return bathImages.bodywash;
    if (l.includes("talc") || l.includes("powder") || l.includes("prickly heat")) return bathImages.talc;
    return bathImages.default;
  }
  // pharma / feminine_hygiene
  if (l.includes("pad") || l.includes("napkin") || l.includes("pantyliner") || l.includes("panty liner")) return pharmaImages.pad;
  if (l.includes("tampon") || l.includes("menstrual") || l.includes("period panty") || l.includes("cup")) return pharmaImages.menstrual;
  if (l.includes("razor") || l.includes("shave") || l.includes("hair removal")) return pharmaImages.razor;
  if (l.includes("wax") || l.includes("waxing") || l.includes("wax strip")) return pharmaImages.wax;
  if (l.includes("intimate") || l.includes("hygiene") || l.includes("wash") || l.includes("wipe") || l.includes("sanitizer")) return pharmaImages.intimate;
  if (l.includes("protein") || l.includes("whey") || l.includes("muesli") || l.includes("creatine")) return pharmaImages.protein;
  if (l.includes("capsule") || l.includes("tablet") || l.includes("ashwagandha") || l.includes("shilajit") || l.includes("ayurved") || l.includes("wheat grass") || l.includes("castor")) return pharmaImages.supplement;
  if (l.includes("monitor") || l.includes("thermometer") || l.includes("oximeter") || l.includes("hot water") || l.includes("posture") || l.includes("abdominal")) return pharmaImages.device;
  if (l.includes("antiseptic") || l.includes("dettol") || l.includes("plaster") || l.includes("wipes")) return pharmaImages.antiseptic;
  return pharmaImages.default;
}

function getSubCategory(name, section) {
  const l = name.toLowerCase();
  if (section === "makeup") {
    if (l.includes("lipstick") || l.includes("lip colour") || l.includes("lip color") || l.includes("sindoor")) return "Lipstick & Lip Colour";
    if (l.includes("kajal") || l.includes("liner") || l.includes("kohl")) return "Kajal & Eyeliner";
    if (l.includes("mascara")) return "Mascara";
    if (l.includes("foundation") || l.includes("powder") || l.includes("compact") || l.includes("cc cream") || l.includes("bb+") || l.includes("bb cream")) return "Foundation & Face Powder";
    if (l.includes("nail")) return "Nail Care";
    if (l.includes("blush") || l.includes("highlighter") || l.includes("blusher")) return "Blush & Highlighter";
    if (l.includes("mehendi") || l.includes("henna") || l.includes("mehndi") || l.includes("stencil")) return "Mehendi";
    if (l.includes("cotton") || l.includes("puff") || l.includes("pad")) return "Makeup Tools & Accessories";
    if (l.includes("brush") || l.includes("scissor") || l.includes("clipper") || l.includes("cutter")) return "Makeup Tools & Accessories";
    if (l.includes("micellar") || l.includes("cleansing") || l.includes("remover")) return "Makeup Removers";
    return "Makeup & Beauty";
  }
  if (section === "hair_care") {
    if (l.includes("shampoo")) return "Shampoo";
    if (l.includes("conditioner")) return "Conditioner";
    if (l.includes("oil")) return "Hair Oil";
    if (l.includes("color") || l.includes("colour") || l.includes("dye") || l.includes("highlight")) return "Hair Colour";
    if (l.includes("henna") || l.includes("paste")) return "Henna & Hair Packs";
    if (l.includes("serum")) return "Hair Serums";
    return "Hair Care";
  }
  if (section === "bath") {
    if (l.includes("handwash") || l.includes("hand wash")) return "Hand Wash";
    if (l.includes("sanitiser") || l.includes("sanitizer")) return "Hand Sanitiser";
    if (l.includes("body wash") || l.includes("bodywash") || l.includes("shower gel")) return "Body Wash & Shower Gel";
    if (l.includes("soap") || l.includes("bathing bar")) return "Bathing Soap & Bar";
    if (l.includes("talc") || l.includes("powder") || l.includes("prickly heat")) return "Talcum Powder";
    if (l.includes("scrubber") || l.includes("loofah") || l.includes("puff") || l.includes("sponge") || l.includes("cap")) return "Bath Accessories";
    return "Bath and Body";
  }
  // feminine_hygiene / pharma
  if (l.includes("pad") || l.includes("napkin") || l.includes("pantyliner") || l.includes("panty liner")) return "Sanitary Pads & Liners";
  if (l.includes("tampon")) return "Tampons";
  if (l.includes("menstrual cup") || l.includes("period cup")) return "Menstrual Cups";
  if (l.includes("period panty")) return "Period Panties";
  if (l.includes("razor") || l.includes("shave")) return "Razors & Shaving";
  if (l.includes("wax") || l.includes("hair removal")) return "Waxing & Hair Removal";
  if (l.includes("intimate") || l.includes("hygiene wash") || l.includes("intimate wipe")) return "Intimate Hygiene";
  if (l.includes("protein") || l.includes("whey") || l.includes("muesli") || l.includes("creatine")) return "Sports Nutrition";
  if (l.includes("capsule") || l.includes("tablet") || l.includes("ashwagandha") || l.includes("shilajit") || l.includes("ayurved") || l.includes("wheat grass") || l.includes("castor")) return "Ayurvedic & Supplements";
  if (l.includes("monitor") || l.includes("thermometer") || l.includes("oximeter") || l.includes("hot water") || l.includes("posture") || l.includes("abdominal")) return "Health Devices";
  if (l.includes("antiseptic") || l.includes("plaster") || l.includes("dressing") || l.includes("wipes")) return "First Aid";
  if (l.includes("cough") || l.includes("syrup")) return "Cough & Cold";
  return "Health and Pharma";
}

// ─────────────────────────────────────────────
//  PARSE & FORMAT
// ─────────────────────────────────────────────

const parsedProducts = [];
let counter = 10000;

for (const entry of rawData) {
  const p = parseLine(entry.raw);
  if (!p.name) continue;

  const name = p.name.trim();
  const price = parseFloat(p.price) || 0;
  const originalPrice = p.originalPrice
    ? parseFloat(p.originalPrice)
    : Math.round(price * 1.15);
  const weight = p.weight ? p.weight.trim() : "";
  const brand = p.brand ? p.brand.trim() : "";
  const category = entry.category;
  const section = entry.section;
  const subCategory = getSubCategory(name, section);
  const image = getImageForProduct(name, section);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const tags = [
    category.toLowerCase(),
    subCategory.toLowerCase(),
    brand.toLowerCase(),
    ...name.toLowerCase().split(/[\s,()_+&\-\/.*]+/).filter((w) => w.length > 2),
  ].filter(Boolean);

  parsedProducts.push({
    id: `beauty_seed_${counter++}`,
    name,
    category,
    subCategory,
    subcategory: "",
    tags: [...new Set(tags)],
    isTrending: false,
    price,
    originalPrice,
    weight,
    stock: 50,
    image,
    section,
    brand,
    description: `${name} by ${brand}. Quality product for your everyday beauty and personal care needs.`,
    eta: "15 MINS",
    isAd: false,
    variants: [],
    slug,
  });
}

console.log(`Parsed ${parsedProducts.length} new products.`);

// ─────────────────────────────────────────────
//  MERGE WITH EXISTING SEED
// ─────────────────────────────────────────────

const seedFilePath = path.resolve(__dirname, "seed.js");

function decache(moduleName) {
  const resolved = require.resolve(moduleName);
  delete require.cache[resolved];
}

const existingProducts = require("./seed");
console.log(`Loaded ${existingProducts.length} existing products from seed.js.`);

const existingKeys = new Set(
  existingProducts.map(
    (p) =>
      `${(p.name || "").toLowerCase().trim()}_${(p.weight || "").toLowerCase().trim()}`
  )
);

const newProductsToSeed = parsedProducts.filter(
  (p) =>
    !existingKeys.has(
      `${(p.name || "").toLowerCase().trim()}_${(p.weight || "").toLowerCase().trim()}`
    )
);

console.log(`Of the parsed products, ${newProductsToSeed.length} are new (no duplicates).`);

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

// ─────────────────────────────────────────────
//  UPLOAD TO MONGODB
// ─────────────────────────────────────────────

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("Database connection successful. Seeding database...");
      decache("./seed");
      const updatedSeed = require("./seed");
      await Product.deleteMany();
      await Product.insertMany(updatedSeed);
      console.log(
        `Database Seeding Successful! Total ${updatedSeed.length} products uploaded to MongoDB.`
      );
      process.exit();
    })
    .catch((err) => {
      console.error("Database connection/seeding failed:", err);
      process.exit(1);
    });
} else {
  console.log(
    "MONGODB_URI not found in environment variables. Database was not seeded automatically."
  );
}
