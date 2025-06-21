const mongoose = require('mongoose');

const laundrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: false },
});

module.exports = mongoose.model('Laundry', laundrySchema);