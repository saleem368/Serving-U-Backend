const mongoose = require('mongoose');

const alterationSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }, // Add email field
  },
  note: { type: String, required: true },
  quantity: { type: Number, default: 1 }, // Number of items to alter
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'delivered'],
    default: 'pending',
  },
  adminTotal: { type: Number }, // Admin-set total price for alteration
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Cash on Delivery', 'Pending'],
    default: 'Pending',
  },
  paymentId: { type: String }, // Razorpay payment ID for online payments
  razorpayOrderId: { type: String }, // Razorpay order ID
  razorpaySignature: { type: String }, // Razorpay signature for verification
  paymentUpdatedAt: { type: Date }, // When payment status was last updated
  timestamp: { type: Date, default: Date.now },
});

// Initialize payment status when alteration is created
alterationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.paymentStatus = 'Pending'; // Alteration needs admin pricing first
  }
  next();
});

module.exports = mongoose.model('Alteration', alterationSchema);
