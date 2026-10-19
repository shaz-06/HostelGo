require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Category = require("./models/Category");

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const printStats = (name, stats) => {
      console.log(`\n=== ${name} ===`);
      if (!stats.executionStats) {
        console.log("No executionStats found", stats);
        return;
      }
      console.log(`Execution Time: ${stats.executionStats.executionTimeMillis}ms`);
      console.log(`Total Docs Examined: ${stats.executionStats.totalDocsExamined}`);
      console.log(`Total Keys Examined: ${stats.executionStats.totalKeysExamined}`);
      console.log(`Winning Plan: ${JSON.stringify(stats.queryPlanner.winningPlan, null, 2)}`);
    };

    // 1. Home - Bestsellers queries
    let stats = await Product.find({ 
      category: { $in: ["The Veggie Store", "The Fruit Store"] }, 
      image: { $regex: /^https?:\/\//i } 
    }, "image").limit(4).explain("executionStats");
    printStats("Bestsellers (Find 4 Images)", stats);

    stats = await Product.find({ category: { $in: ["The Veggie Store", "The Fruit Store"] } }).explain("executionStats");
    printStats("Bestsellers (Find all - proxy for count)", stats);

    // 2. Category Meta
    stats = await Category.findOne({ $or: [{ slug: 'fresh-vegetables' }, { name: new RegExp('^fresh vegetables$', 'i') }] }).explain("executionStats");
    printStats("Category findOne", stats);

    // 3. Category Products
    stats = await Product.find({ category: new RegExp('^fresh vegetables$', 'i') }).skip(0).limit(20).explain("executionStats");
    printStats("Category Products (Regex)", stats);
    
    // 4. Products with sort (e.g. price)
    stats = await Product.find({ category: new RegExp('^fresh vegetables$', 'i') }).sort({ price: 1 }).limit(20).explain("executionStats");
    printStats("Category Products (Sorted by Price)", stats);

    // 5. Lazy Loaded Section
    stats = await Product.find({ category: new RegExp('fresh fruits', 'i') }).limit(6).explain("executionStats");
    printStats("Lazy Section (Fresh Fruits)", stats);

    // 6. Complex filters
    stats = await Product.find({ 
      $and: [
        { $or: [{ category: "The Veggie Store" }] },
        { $or: [{ subCategory: "Fresh Vegetables" }] },
        { $or: [{ price: { $lt: 50 } }] }
      ]
    }).explain("executionStats");
    printStats("Complex Filters (Category + Sub + Price)", stats);
    
    // 7. Test exact category
    stats = await Product.find({ category: "The Veggie Store" }).explain("executionStats");
    printStats("Exact Category (No Regex)", stats);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTest();
