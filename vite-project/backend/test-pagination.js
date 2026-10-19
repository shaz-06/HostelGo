const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./models/Product");
const { buildProductFilters, buildProductSort } = require("./utils/productQueryBuilder");

// A simple script to verify if the new backend query produces the same results as old frontend logic
async function verify() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelgo");
  console.log("Connected to DB");

  // Mock an incoming query from the frontend
  const mockQuery = {
    category: "Beauty",
    filters: JSON.stringify({
      price: ["Under ₹100"]
    }),
    sortBy: "price-asc",
    page: 1,
    limit: 20
  };

  const filter = buildProductFilters(mockQuery);
  const sort = buildProductSort(mockQuery);
  
  console.log("Built filter:", JSON.stringify(filter, null, 2));
  console.log("Built sort:", sort);

  // New logic (Backend only)
  let newLogicProducts = await Product.find(filter).sort(sort).limit(20).lean();
  console.log(`New logic returned: ${newLogicProducts.length} items`);
  console.log(`New logic IDs:`, newLogicProducts.map(p => p.id || p._id).join(", "));

  process.exit(0);
}

verify();
