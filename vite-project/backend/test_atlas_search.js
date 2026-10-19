require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

async function testSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for search testing");

    const searchQuery = "Matte Box Lipsticks";
    const pipeline = [
      {
        $search: {
          index: "buyto_product_search",
          text: {
            query: searchQuery,
            path: ["name", "brand", "tags", "category"]
          }
        }
      },
      {
        $limit: 5
      }
    ];

    console.log("Running search pipeline for:", searchQuery);
    const results = await Product.aggregate(pipeline);
    console.log(`Found ${results.length} results.`);
    results.forEach(r => console.log(`- ${r.name} (${r.category})`));

    process.exit(0);
  } catch (err) {
    console.error("Error running search:", err);
    process.exit(1);
  }
}

testSearch();
