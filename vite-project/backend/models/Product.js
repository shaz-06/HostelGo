const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: String,
  name: { type: String, index: true },
  category: { type: String, index: true },
  subCategory: { type: String, index: true },
  subcategory: String,
  tags: [String],
  isSensitive: { type: Boolean, default: false },
  isTrending: Boolean,
  price: Number,
  originalPrice: Number,
  weight: String,
  stock: Number,
  image: String,
  section: String,
  brand: { type: String, index: true },
  description: String,
  eta: String,
  isAd: Boolean,
  slug: { type: String, index: true },
  variants: [
    {
      weight: String,
      price: Number,
      originalPrice: Number,
      stock: Number
    }
  ],
  saveCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Product", productSchema);