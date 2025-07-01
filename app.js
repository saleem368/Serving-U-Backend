const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const laundryRoutes = require('./routes/laundryRoutes'); // Import laundry routes
const orderRoutes = require('./routes/orderRoutes'); // Import order routes
const alterationRoutes = require('./routes/alterationRoutes'); // Import alteration routes
const unstitchedRoutes = require('./routes/unstitchedRoutes'); // Import unstitched routes
const adminRoutes = require('./routes/adminroutes'); // Import admin routes
const razorpayRoutes = require('./routes/razorpayRoutes'); // Import Razorpay routes
const googleAuthRoutes = require('./routes/googleAuthRoutes'); // Import Google OAuth routes

const app = express();

// Middleware
// CORS configuration for multiple origins (development and production)
const allowedOrigins = [
  'http://localhost:5173',           // Development frontend
  'http://localhost:3000',           // Alternative development port
  'https://www.servingu.in',         // Production frontend
  'https://servingu.in',             // Production frontend (without www)
  process.env.CLIENT_URL             // Environment variable fallback
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS Error - Origin not allowed:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow cookies and credentials
}));
app.use(express.json()); // Parse incoming JSON requests

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint is working!' });
})

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/laundry', laundryRoutes); // Add laundry routes
app.use('/api/orders', orderRoutes); // Add order routes
app.use('/api/alterations', alterationRoutes); // Add alteration routes
app.use('/api/unstitched', unstitchedRoutes); // Add unstitched routes
app.use('/api/admin', adminRoutes); // Add admin routes
app.use('/api/razorpay', razorpayRoutes); // Add Razorpay routes
app.use('/api/google-auth', googleAuthRoutes); // Add Google OAuth routes

// Default route for root path
app.get('/', (req, res) => {
  res.send('Welcome to the Serving U API!');
});

module.exports = app;
