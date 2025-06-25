const express = require('express');
const router = express.Router();
const Laundry = require('../models/laundryModel');
const multer = require('multer');
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
    folder: 'laundry-items',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image',
  },
});
const upload = multer({ storage });

// GET all laundry items
router.get('/', async (req, res) => {
  try {
    const laundryItems = await Laundry.find();
    res.status(200).json(laundryItems);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch laundry items', error: error.message });
  }
});

// POST new laundry item
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, category, price, unit } = req.body;
    
    // Validate all required fields including unit
    if (!name || !category || !price || !unit) {
      return res.status(400).json({ 
        message: 'Name, category, price, and unit are required.' 
      });
    }

    if (!req.files || !req.files.image || req.files.image.length === 0) {
      return res.status(400).json({ message: 'Image is required for laundry items.' });
    }

    const newItem = new Laundry({ 
      name, 
      category, 
      price: parseFloat(price), 
      image: req.files.image[0].path,
      unit  // Unit is now required
    });
    
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error adding laundry item', 
      error: error.message 
    });
  }
});

// PUT update laundry item
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, category, price, unit } = req.body;
    
    // Validate all fields including unit
    if (!name || !category || !price || !unit) {
      return res.status(400).json({ 
        message: 'Name, category, price, and unit are required.' 
      });
    }

    const updateData = { 
      name, 
      category, 
      price: parseFloat(price), 
      unit  // Unit is required
    };

    if (req.files && req.files.image && req.files.image.length > 0) {
      updateData.image = req.files.image[0].path;
    }

    const updatedItem = await Laundry.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Laundry item not found' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating laundry item', 
      error: error.message 
    });
  }
});

// DELETE laundry item
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Laundry.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Laundry item not found' });
    }
    res.status(200).json({ message: 'Laundry item deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting laundry item', 
      error: error.message 
    });
  }
});

module.exports = router;
