const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Category = require("./models/Category");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  const cats = await Category.find().lean();
  console.log("All Categories in MongoDB:");
  cats.forEach(c => console.log(`- Name: "${c.name}", Slug: "${c.slug}", ID: ${c._id}`));

  process.exit(0);
}

main();
