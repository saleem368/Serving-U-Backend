const mongoose = require('mongoose');

const alterationSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }, // Add email field
  },
  note: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alteration', alterationSchema);
