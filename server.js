const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config(); // In case you use .env

// Route Imports
const orderRoutes = require('./routes/orderRoutes');
const laundryRoutes = require('./routes/laundryRoutes');
const unstitchedRoutes = require('./routes/unstitchedRoutes');
const adminRoutes = require('./routes/adminroutes');
const authRoutes = require('./routes/authRoutes');
const alterationRoutes = require('./routes/alterationRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://saleem152000:saleem%40123@cluster0.hhyzrqb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// ✅ CORS Setup
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://serving-u-frontend.vercel.app',
  'https://www.servingu.in',
  'https://servingu.in',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow mobile apps, curl, etc.
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// ✅ Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Route Middleware
app.use('/api/orders', orderRoutes);
app.use('/api/laundry', laundryRoutes);
app.use('/api/unstitched', unstitchedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alterations', alterationRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/google-auth', googleAuthRoutes);

// ✅ Default Route
app.get('/', (req, res) => {
  res.json({ message: 'Serving U Backend API is running!' });
});

// ✅ Optional: Catch-all route for 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Connect MongoDB and Start Server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error);
  });

// ✅ Export upload for use in routes
module.exports = { app, upload };
