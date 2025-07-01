require('dotenv').config();

// Debug: Check if .env is loaded
console.log('🔧 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI loaded:', !!process.env.MONGO_URI);
console.log('MONGO_URI value:', process.env.MONGO_URI);

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Import the app from app.js (which has CORS configured)
const app = require('./app');

const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI; // Use environment variable

// Debug: Log the MONGO_URI to see what's being used
console.log('🔍 MONGO_URI from environment:', MONGO_URI);

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
