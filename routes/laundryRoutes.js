const express = require('express');
const router = express.Router();
const Laundry = require('../models/laundryModel');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

console.log('laundryRoutes.js loaded and running!');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for image uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'assets/media', // Use a clear folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image',
  },
});
const upload = multer({ storage });

// Cloud/local upload switch
const USE_CLOUD_UPLOAD = process.env.USE_CLOUD_UPLOAD === 'true';

// Example cloud upload function (to be implemented for your provider)
async function uploadToCloud(file) {
  // TODO: Replace with actual cloud upload logic (e.g., AWS S3, Cloudinary, etc.)
  // Return the public URL of the uploaded image
  return 'https://your-cloud-storage.com/' + file.filename;
}

// GET /api/laundry - Fetch all laundry items
router.get('/', async (req, res) => {
  try {
    const laundryItems = await Laundry.find();
    res.status(200).json(laundryItems);
  } catch (error) {
    console.error('Error fetching laundry items:', error.message, error);
    res.status(500).json({ message: 'Failed to fetch laundry items', error: error.message });
  }
});

// POST /api/laundry - Add new laundry item with image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('--- Incoming POST /api/laundry ---');
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : undefined
    });
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    if (!req.file) {
      return res.status(400).json({
        message: 'No file received. Make sure you are sending a multipart/form-data request with the field name "image".',
        tip: 'In Postman, set Body to form-data, add key "image" of type File, and select your image file.',
        receivedBody: req.body
      });
    }
    const { name, category, price } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Name, category, and price are required.' });
    }
    const image = req.file.path; // Cloudinary URL is in file.path
    if (!image || !image.startsWith('http')) {
      return res.status(500).json({
        message: 'Image was not uploaded to Cloudinary. Check Cloudinary credentials and configuration.',
        file: req.file
      });
    }
    const newItem = new Laundry({ name, category, price, image });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding laundry item:', error);
    res.status(500).json({
      message: 'Error adding laundry item',
      error: error && error.message ? error.message : error,
      fullError: error
    });
  }
});

// Catch-all route to log all requests to this router
router.use((req, res, next) => {
  console.log('Request received at laundryRoutes:', req.method, req.originalUrl);
  next();
});

module.exports = router;