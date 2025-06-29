const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }, // Add email field
  },
  items: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      category: { type: String }, // Optional: present for laundry, undefined for unstitched
      size: { type: String }, // Add size for unstitched items
    },
  ],
  total: { type: Number, required: true },
  adminTotal: { type: Number }, // Admin-set total price
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Delivered'],
    default: 'Pending',
  },
  note: { type: String }, // Optional note from customer
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Cash on Delivery'],
    default: 'Cash on Delivery',
  },
});

// Helper static method to group items by laundry/unstiched
orderSchema.statics.groupItems = function(items) {
  const laundry = [];
  const unstitched = [];
  let unstitchedTotal = 0;
  for (const item of items) {
    if (item.category === 'laundry') {
      laundry.push(item);
    } else {
      unstitched.push(item);
      unstitchedTotal += item.price * item.quantity;
    }
  }
  return { laundry, unstitched, unstitchedTotal };
};

module.exports = mongoose.model('Order', orderSchema);
