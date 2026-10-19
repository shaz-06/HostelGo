const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    index: true
  },
  image: {
    type: String,
    default: ""
  },
  icon: {
    type: String,
    default: ""
  },
  showInHeader: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Category", categorySchema);
