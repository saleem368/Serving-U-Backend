const mongoose = require('mongoose');

const laundrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  image: { type: String, required: false },
});

// Debug: log every time a document is saved
laundrySchema.post('save', function(doc) {
  console.log('Laundry saved to DB:', doc);
});

module.exports = mongoose.model('Laundry', laundrySchema);
