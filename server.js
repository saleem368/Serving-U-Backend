const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Routes
const orderRoutes = require('./routes/orderRoutes');
const laundryRoutes = require('./routes/laundryRoutes');
const unstitchedRoutes = require('./routes/unstitchedRoutes');
const adminRoutes = require('./routes/adminroutes');
const authRoutes = require('./routes/authRoutes');
const alterationRoutes = require('./routes/alterationRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;

// Function to normalize URL (remove trailing slash)
function normalizeUrl(url) {
  if (!url) return url;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

// Middleware
const allowedOrigins = [
  normalizeUrl(process.env.CLIENT_URL),
  // Add both versions to be safe
  process.env.CLIENT_URL
].filter(Boolean).filter((url, index, arr) => arr.indexOf(url) === index); // Remove duplicates

console.log('Allowed Origins:', allowedOrigins);
console.log('Server is starting...', process.env.CLIENT_URL);
console.log('Port:', PORT);
console.log('MongoDB URI exists:', !!MONGO_URI);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // If CLIENT_URL is not set, block all browser requests for security
    if (!process.env.CLIENT_URL) {
      console.log('CLIENT_URL not set, blocking browser request from:', origin);
      return callback(new Error('CLIENT_URL environment variable must be set'));
    }
    
    // Normalize the incoming origin
    const normalizedOrigin = normalizeUrl(origin);
    
    // Check if normalized origin is in allowed list
    if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      console.log('Normalized origin:', normalizedOrigin);
      console.log('Allowed origins:', allowedOrigins);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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
app.use('/api/auth', authRoutes);
app.use('/api/alterations', alterationRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/google-auth', googleAuthRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Serving U Backend API is running!' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// MongoDB Connection
if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

// Export upload for use in routes
module.exports = { app, upload };
