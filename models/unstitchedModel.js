const mongoose = require('mongoose');

const unstitchedSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String }, // not required for new items
  price: { type: Number, required: true },
  image: { type: String }, // legacy single image
  images: [{ type: String }], // Array of image URLs for carousel
  description: { type: String },
  sizes: { type: [String], default: [] }, // Always include sizes, default empty array
});

module.exports = mongoose.model('Unstitched', unstitchedSchema);