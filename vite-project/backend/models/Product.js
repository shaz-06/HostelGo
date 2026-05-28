const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: String,
  name: String,
  category: String,
  subCategory: String,
  subcategory: String,
  tags: [String],
  isTrending: Boolean,
  price: Number,
  originalPrice: Number,
  weight: String,
  stock: Number,
  image: String,
  variants: [
    {
      weight: String,
      price: Number,
      originalPrice: Number
    }
  ]
});

module.exports = mongoose.model("Product", productSchema);