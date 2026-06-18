const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Product = require("../models/Product");

// Simulating a catalog of available images on Cloudinary / ImageKit / local assets
const AVAILABLE_IMAGES = [
  { name: "coca cola", url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500" },
  { name: "aashirvaad atta", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500" },
  { name: "maggi", url: "https://images.unsplash.com/photo-1612966608967-302fa54d87da?w=500" },
  { name: "red bull", url: "https://images.unsplash.com/photo-1622543956221-15b50d9d8318?w=500" },
  { name: "dettol liquid", url: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500" },
  { name: "tomato", url: "https://images.unsplash.com/photo-1566385101042-1a010c129fa6?w=500" },
  { name: "apple", url: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=500" }
];

function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // remove special characters
    .replace(/\s+/g, " ")       // normalize spacing
    .trim();
}

async function runAutoAssign() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("Error: MONGODB_URI not found in backend/.env");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    // Find products without images (or we can run on all for verification)
    const products = await Product.find({
      $or: [
        { image: { $exists: false } },
        { image: null },
        { image: "" }
      ]
    });

    console.log(`Found ${products.length} products without images.`);
    let matchCount = 0;

    for (const product of products) {
      const normalizedProductName = normalizeString(product.name);
      
      let bestMatch = null;
      let highestConfidence = 0;

      for (const img of AVAILABLE_IMAGES) {
        const normalizedImgName = normalizeString(img.name);
        
        // Match condition: product name contains the image keywords
        if (normalizedProductName.includes(normalizedImgName)) {
          // Simple confidence calculation based on matching word ratio or substring match
          const confidence = normalizedImgName.length / normalizedProductName.length;
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = img;
          }
        }
      }

      // If confidence threshold is met (e.g. > 0.2), assign image
      if (bestMatch && highestConfidence > 0.2) {
        console.log(`Matching: "${product.name}" -> "${bestMatch.name}" (Confidence: ${highestConfidence.toFixed(2)})`);
        product.image = bestMatch.url;
        await product.save();
        matchCount++;
      } else {
        console.log(`Skipped: "${product.name}" (No confident match found)`);
      }
    }

    console.log(`\n=================================`);
    console.log(`Auto assignment completed.`);
    console.log(`Successfully matched and updated: ${matchCount} products.`);
    console.log(`=================================`);

  } catch (err) {
    console.error("Auto assign failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runAutoAssign();
