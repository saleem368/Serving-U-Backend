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
    folder: 'laundry-items',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image',
  },
});
const upload = multer({ storage });

// GET /api/laundry - Fetch all laundry items
router.get('/', async (req, res) => {
  try {
    console.log('Fetching laundry items...');
    const laundryItems = await Laundry.find();
    console.log(`Found ${laundryItems.length} laundry items`);
    res.status(200).json(laundryItems);
  } catch (error) {
    console.error('Error fetching laundry items:', error);
    res.status(500).json({ message: 'Failed to fetch laundry items', error: error.message });
  }
});

// POST /api/laundry - Add new laundry item with image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('--- Incoming POST /api/laundry ---');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const { name, category, price } = req.body;
    
    // Validate required fields
    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Name, category, and price are required.' });
    }

    // Validate image upload
    if (!req.file) {
      return res.status(400).json({
        message: 'Image is required for laundry items.',
      });
    }

    const image = req.file.path; // Cloudinary URL
    
    const newItem = new Laundry({ 
      name, 
      category, 
      price: parseFloat(price), 
      image 
    });
    
    await newItem.save();
    console.log('New laundry item created:', newItem);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding laundry item:', error);
    res.status(500).json({
      message: 'Error adding laundry item',
      error: error.message
    });
  }
});

// PUT /api/laundry/:id - Update laundry item
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('--- Incoming PUT /api/laundry/:id ---');
    console.log('req.params.id:', req.params.id);
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const { name, category, price } = req.body;
    const updateData = { name, category, price: parseFloat(price) };

    // If new image is uploaded, update the image URL
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedItem = await Laundry.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Laundry item not found' });
    }

    console.log('Laundry item updated:', updatedItem);
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating laundry item:', error);
    res.status(500).json({
      message: 'Error updating laundry item',
      error: error.message
    });
  }
});

// DELETE /api/laundry/:id - Delete laundry item
router.delete('/:id', async (req, res) => {
  try {
    console.log('--- Incoming DELETE /api/laundry/:id ---');
    console.log('req.params.id:', req.params.id);

    const deletedItem = await Laundry.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Laundry item not found' });
    }

    console.log('Laundry item deleted:', deletedItem);
    res.status(200).json({ message: 'Laundry item deleted successfully' });
  } catch (error) {
    console.error('Error deleting laundry item:', error);
    res.status(500).json({
      message: 'Error deleting laundry item',
      error: error.message
    });
  }
});

module.exports = router;
