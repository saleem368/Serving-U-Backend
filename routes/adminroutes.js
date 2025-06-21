const express = require('express');
const router = express.Router();
const Laundry = require('../models/laundryModel');
const Unstitched = require('../models/unstitchedModel');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary config
cloudinary.config({
  cloud_name: '641568516994196',
  api_key: '641568516994196',
  api_secret: '3Cy_m8Xdc2uWIwyg6qSiGBsoyaQ',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const upload = multer({ storage });

// POST Laundry
router.post('/laundry', upload.single('image'), async (req, res) => {
  try {
    const newItem = new Laundry(req.body);
    if (req.file) {
      newItem.image = req.file.path; // Cloudinary URL is in file.path
    }
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error adding laundry item:', error);
    res.status(500).json({ message: 'Failed to add laundry item' });
  }
});

// POST Unstitched
router.post('/unstitched', upload.array('images', 5), async (req, res) => {
  try {
    // Accept sizes as array or comma-separated string
    let { sizes, name, price, description } = req.body;
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path); // Cloudinary URL is in file.path
    }
    if (typeof sizes === 'string') {
      try {
        if (sizes.trim().startsWith('[')) {
          sizes = JSON.parse(sizes);
        } else {
          sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch {
        sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(sizes)) sizes = [];
    const newItem = new Unstitched({ name, price, description, images, sizes });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error adding unstitched item:', error);
    res.status(500).json({ message: 'Failed to add unstitched item' });
  }
});

// PUT Laundry (with image update support)
router.put('/laundry/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price } = req.body;
    let update = { name, category, price };
    if (req.file) {
      update.image = req.file.path; // Cloudinary URL is in file.path
    }
    const updatedItem = await Laundry.findByIdAndUpdate(req.params.id, update, { new: true });
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating laundry item:', error);
    res.status(500).json({ message: 'Failed to update laundry item' });
  }
});

// PUT Unstitched (with per-image replacement and append support)
router.put('/unstitched/:id', upload.array('replaceImages'), async (req, res) => {
  try {
    let { name, price, description, sizes } = req.body;
    let update = { name, price, description };
    // Accept sizes as array or comma-separated string
    if (typeof sizes === 'string') {
      try {
        if (sizes.trim().startsWith('[')) {
          sizes = JSON.parse(sizes);
        } else {
          sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch {
        sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (Array.isArray(sizes)) update.sizes = sizes;
    const item = await Unstitched.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    let images = item.images || [];
    if (req.files && req.files.length > 0) {
      let indexes = req.body.replaceIndexes;
      const files = Array.isArray(req.files) ? req.files : [req.files];
      if (indexes) {
        if (!Array.isArray(indexes)) indexes = [indexes];
        indexes.forEach((idx, i) => {
          const nIdx = parseInt(idx);
          if (!isNaN(nIdx) && nIdx < 5) {
            if (nIdx < images.length) {
              images[nIdx] = `/uploads/${files[i].filename}`;
            } else {
              // Always push if index is >= images.length
              images.push(`/uploads/${files[i].filename}`);
            }
          }
        });
      } else {
        // No replaceIndexes: treat all files as new images to append
        files.forEach(file => {
          if (images.length < 5) images.push(`/uploads/${file.filename}`);
        });
      }
      images = images.slice(0, 5);
      update.images = images;
    }
    // Always update images if present, even if no new files are uploaded
    if (images.length > 0 && !update.images) {
      update.images = images;
    }
    // Handle image deletions: if req.body.images is present, use it as the new images array
    if (req.body.images && Array.isArray(req.body.images)) {
      // Optionally, delete removed files from server
      const newImages = req.body.images;
      // Find removed images
      const removedImages = images.filter(img => !newImages.includes(img));
      // Remove files from server (optional, only for local uploads)
      const fs = require('fs');
      const uploadDir = path.join(__dirname, '../uploads');
      removedImages.forEach(imgPath => {
        if (imgPath.startsWith('/uploads/')) {
          const filePath = path.join(uploadDir, path.basename(imgPath));
          fs.unlink(filePath, err => { /* ignore errors */ });
        }
      });
      update.images = newImages;
    }
    const updatedItem = await Unstitched.findByIdAndUpdate(req.params.id, update, { new: true });
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating unstitched item:', error);
    res.status(500).json({ message: 'Failed to update unstitched item' });
  }
});

// DELETE Laundry
router.delete('/laundry/:id', async (req, res) => {
  try {
    await Laundry.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Laundry item deleted successfully' });
  } catch (error) {
    console.error('Error deleting laundry item:', error);
    res.status(500).json({ message: 'Failed to delete laundry item' });
  }
});

// DELETE Unstitched
router.delete('/unstitched/:id', async (req, res) => {
  try {
    await Unstitched.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Unstitched item deleted successfully' });
  } catch (error) {
    console.error('Error deleting unstitched item:', error);
    res.status(500).json({ message: 'Failed to delete unstitched item' });
  }
});

module.exports = router;
