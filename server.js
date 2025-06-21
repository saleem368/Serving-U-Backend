// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Routes
const orderRoutes = require('./routes/orderRoutes');
const laundryRoutes = require('./routes/laundryRoutes');
const unstitchedRoutes = require('./routes/unstitchedRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes'); // New auth route
const alterationRoutes = require('./routes/alterationRoutes'); // New alteration route
const razorpayRoutes = require('./routes/razorpayRoutes'); // New Razorpay route
const googleAuthRoutes = require('./routes/googleAuthRoutes'); // Google OAuth route

const app = express();
const PORT = 5000;
const MONGO_URI = 'mongodb://localhost:27017/serving-u';

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route Middleware
app.use('/api/orders', orderRoutes);
app.use('/api/laundry', laundryRoutes);
app.use('/api/unstitched', unstitchedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes); // Register auth route
app.use('/api/alterations', alterationRoutes); // Register alteration route
app.use('/api/razorpay', razorpayRoutes); // Register Razorpay route
app.use('/api/google-auth', googleAuthRoutes); // Register Google OAuth route

// MongoDB Connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Export upload for use in routes
module.exports = { app, upload };
