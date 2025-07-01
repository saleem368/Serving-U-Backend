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
      laundryType: { type: String }, // Add laundry type for subcategory
    },
  ],
  total: { type: Number, required: true },
  adminTotal: { type: Number }, // Admin-set total price
  timestamp: { type: Date, default: Date.now },
  
  // Legacy status (for backward compatibility)
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Delivered'],
    default: 'Pending',
  },
  
  // Separate status tracking for laundry and readymade items
  laundryStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Delivered'],
    default: 'Pending',
  },
  readymadeStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Delivered'],
    default: 'Pending',
  },
  
  note: { type: String }, // Optional note from customer
  
  // Legacy payment status (for backward compatibility)
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Cash on Delivery'],
    default: 'Cash on Delivery',
  },
  
  // Separate payment status tracking
  laundryPaymentStatus: {
    type: String,
    enum: ['Paid', 'Cash on Delivery', 'Pending'],
    default: 'Pending',
  },
  readymadePaymentStatus: {
    type: String,
    enum: ['Paid', 'Cash on Delivery', 'Pending'],
    default: 'Pending',
  },
  
  // Admin-set pricing for laundry
  laundryAdminTotal: { type: Number }, // Admin-set total for laundry items
  readymadeTotal: { type: Number }, // Total for readymade items (calculated)
  
  paymentId: { type: String }, // Razorpay payment ID for online payments
  razorpayOrderId: { type: String }, // Razorpay order ID
  razorpaySignature: { type: String }, // Razorpay signature for verification
  paymentUpdatedAt: { type: Date }, // When payment status was last updated
  
  // Separate payment tracking
  laundryPaymentId: { type: String }, // Razorpay payment ID for laundry payment
  readymadePaymentId: { type: String }, // Razorpay payment ID for readymade payment
});

// Helper static method to group items by laundry/readymade
orderSchema.statics.groupItems = function(items) {
  const laundry = [];
  const readymade = [];
  let readymadeTotal = 0;
  for (const item of items) {
    // Handle both new laundryType field and old category field for backward compatibility
    if ((item.laundryType && item.laundryType.trim() !== '') || item.category === 'laundry') {
      laundry.push(item);
    } else {
      readymade.push(item);
      readymadeTotal += item.price * item.quantity;
    }
  }
  return { laundry, readymade, readymadeTotal };
};

// Initialize separate statuses when order is created
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    const { laundry, readymade, readymadeTotal } = this.constructor.groupItems(this.items);
    
    // Set readymade total from calculated total
    this.readymadeTotal = readymadeTotal;
    
    // Initialize payment statuses based on items
    if (laundry.length > 0) {
      this.laundryPaymentStatus = 'Pending'; // Laundry needs admin pricing first
    }
    if (readymade.length > 0) {
      this.readymadePaymentStatus = this.paymentStatus || 'Cash on Delivery';
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
