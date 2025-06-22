const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const laundryRoutes = require('./routes/laundryRoutes'); // Import laundry routes
const razorpayRoutes = require('./routes/razorpayRoutes'); // Import Razorpay routes
const googleAuthRoutes = require('./routes/googleAuthRoutes'); // Import Google OAuth routes

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/laundry', laundryRoutes); // Add laundry routes
app.use('/api/razorpay', razorpayRoutes); // Add Razorpay routes
app.use('/api/google-auth', googleAuthRoutes); // Add Google OAuth routes

// Default route for root path
app.get('/', (req, res) => {
  res.send('Welcome to the Serving U API!');
});

module.exports = app;
