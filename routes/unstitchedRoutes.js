const express = require('express');
const router = express.Router();
const Unstitched = require('../models/unstitchedModel');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
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

// GET /api/unstitched - Fetch all unstitched items
router.get('/', async (req, res) => {
  try {
    const unstitchedItems = await Unstitched.find();
    res.status(200).json(unstitchedItems);
  } catch (error) {
    console.error('Error fetching unstitched items:', error);
    res.status(500).json({ message: 'Failed to fetch unstitched items' });
  }
});

// POST /api/unstitched - Add new unstitched item with up to 5 images
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { name, price, description, sizes } = req.body;
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path); // Cloudinary URL is in file.path
    }
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
    if (images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }
    // Parse sizes if present
    let parsedSizes = [];
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
      } catch {
        parsedSizes = [];
      }
    }
    const newItem = new Unstitched({ name, price, images, description, sizes: parsedSizes });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding unstitched item', error });
  }
});

module.exports = router;
