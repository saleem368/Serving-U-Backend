const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Password is now optional for Google users
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  name: { type: String },
  phone: { type: String },
  address: { type: String }
});

module.exports = mongoose.model('User', userSchema);