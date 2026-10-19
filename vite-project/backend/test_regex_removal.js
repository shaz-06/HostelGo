require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Category = require("./models/Category");

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const categoryName = "The Veggie Store";
    const subCategoryName = "Fresh Vegetables";

    console.log("=== BEFORE (REGEX QUERIES) ===\n");

    // 1. Category Lookup
    let catStats = await Category.findOne({ $or: [{ slug: 'fresh-vegetables' }, { name: new RegExp('^' + categoryName + '$', 'i') }] }).explain("executionStats");
    console.log(`1. Category findOne`);
    console.log(`Execution Time: ${catStats.executionStats.executionTimeMillis}ms`);
    console.log(`Total Docs Examined: ${catStats.executionStats.totalDocsExamined}`);
    console.log(`Winning Plan: ${JSON.stringify(catStats.queryPlanner.winningPlan, null, 2)}\n`);

    // 2. Category + Price ASC
    let prodAsc = await Product.find({ category: new RegExp('^' + categoryName + '$', 'i') }).sort({ price: 1 }).explain("executionStats");
    console.log(`2. Category + Price ASC`);
    console.log(`Execution Time: ${prodAsc.executionStats.executionTimeMillis}ms`);
    console.log(`Winning Plan: ${JSON.stringify(prodAsc.queryPlanner.winningPlan, null, 2)}\n`);

    // 3. Category + Price DESC
    let prodDesc = await Product.find({ category: new RegExp('^' + categoryName + '$', 'i') }).sort({ price: -1 }).explain("executionStats");
    console.log(`3. Category + Price DESC`);
    console.log(`Execution Time: ${prodDesc.executionStats.executionTimeMillis}ms`);
    console.log(`Winning Plan: ${JSON.stringify(prodDesc.queryPlanner.winningPlan, null, 2)}\n`);

    // 4. Category + SubCategory + Price ASC
    let prodSubAsc = await Product.find({ 
      category: new RegExp('^' + categoryName + '$', 'i'),
      subCategory: new RegExp('^' + subCategoryName + '$', 'i')
    }).sort({ price: 1 }).explain("executionStats");
    console.log(`4. Category + SubCategory + Price ASC`);
    console.log(`Execution Time: ${prodSubAsc.executionStats.executionTimeMillis}ms`);
    console.log(`Winning Plan: ${JSON.stringify(prodSubAsc.queryPlanner.winningPlan, null, 2)}\n`);

    // 5. Category + SubCategory + Price DESC
    let prodSubDesc = await Product.find({ 
      category: new RegExp('^' + categoryName + '$', 'i'),
      subCategory: new RegExp('^' + subCategoryName + '$', 'i')
    }).sort({ price: -1 }).explain("executionStats");
    console.log(`5. Category + SubCategory + Price DESC`);
    console.log(`Execution Time: ${prodSubDesc.executionStats.executionTimeMillis}ms`);
    console.log(`Winning Plan: ${JSON.stringify(prodSubDesc.queryPlanner.winningPlan, null, 2)}\n`);

    console.log("\n=== AFTER (EXACT QUERIES) ===\n");

    // 1. Category Lookup
    let catStatsExact = await Category.findOne({ name: categoryName }).explain("executionStats");
    console.log(`1. Category findOne Exact`);
    console.log(`Execution Time: ${catStatsExact.executionStats.executionTimeMillis}ms`);
    console.log(`Total Docs Examined: ${catStatsExact.executionStats.totalDocsExamined}`);
    console.log(`Winning Plan: ${JSON.stringify(catStatsExact.queryPlanner.winningPlan, null, 2)}\n`);

    // 2. Category + Price ASC
    let prodAscExact = await Product.find({ category: categoryName }).sort({ price: 1 }).explain("executionStats");
    console.log(`2. Category + Price ASC Exact`);
    console.log(`Execution Time: ${prodAscExact.executionStats.executionTimeMillis}ms`);
    console.log(`Winning Plan: ${JSON.stringify(prodAscExact.queryPlanner.winningPlan, null, 2)}\n`);

    // 3. Category + Price DESC
    let prodDescExact = await Product.find({ category: categoryName }).sort({ price: -1 }).explain("executionStats");
    console.log(`3. Category + Price DESC Exact`);
    console.log(`Execution Time: ${prodDescExact.executionStats.executionTimeMillis}ms`);
    console.log(`Winning Plan: ${JSON.stringify(prodDescExact.queryPlanner.winningPlan, null, 2)}\n`);

    // 4. Category + SubCategory + Price ASC
    let prodSubAscExact = await Product.find({ 
      category: categoryName,
      subCategory: subCategoryName
    }).sort({ price: 1 }).explain("executionStats");
    console.log(`4. Category + SubCategory + Price ASC Exact`);
    console.log(`Execution Time: ${prodSubAscExact.executionStats.executionTimeMillis}ms`);
    console.log(`Winning Plan: ${JSON.stringify(prodSubAscExact.queryPlanner.winningPlan, null, 2)}\n`);

    // 5. Category + SubCategory + Price DESC
    let prodSubDescExact = await Product.find({ 
      category: categoryName,
      subCategory: subCategoryName
    }).sort({ price: -1 }).explain("executionStats");
    console.log(`5. Category + SubCategory + Price DESC Exact`);
    console.log(`Execution Time: ${prodSubDescExact.executionStats.executionTimeMillis}ms`);
    console.log(`Winning Plan: ${JSON.stringify(prodSubDescExact.queryPlanner.winningPlan, null, 2)}\n`);


    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTest();
