const express = require('express');
const router = express.Router();
const Laundry = require('../models/laundryModel');
const Unstitched = require('../models/unstitchedModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary config - Use environment variables instead of hardcoded values
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'admin-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image',
  },
});

const upload = multer({ storage });

// Helper function to ensure uploads directory exists
const ensureUploadsDir = () => {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// GET all laundry items
router.get('/laundry', async (req, res) => {
  try {
    console.log('Admin: Fetching all laundry items...');
    const items = await Laundry.find();
    console.log(`Admin: Found ${items.length} laundry items`);
    res.status(200).json(items);
  } catch (error) {
    console.error('Admin: Error fetching laundry items:', error);
    res.status(500).json({ message: 'Failed to fetch laundry items', error: error.message });
  }
});

// GET all unstitched items
router.get('/unstitched', async (req, res) => {
  try {
    console.log('Admin: Fetching all unstitched items...');
    const items = await Unstitched.find();
    console.log(`Admin: Found ${items.length} unstitched items`);
    res.status(200).json(items);
  } catch (error) {
    console.error('Admin: Error fetching unstitched items:', error);
    res.status(500).json({ message: 'Failed to fetch unstitched items', error: error.message });
  }
});

// POST Laundry - Add new laundry item
router.post('/laundry', upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    console.log('--- Admin POST /laundry ---');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    if (!req.body.unit) {
      console.warn('WARNING: unit field missing in req.body:', req.body);
    }
    const { name, category, price, unit } = req.body; // Extract unit

    // Validate required fields
    if (!name || !category || !price || !unit) {
      return res.status(400).json({ message: 'Name, category, price, and unit are required' });
    }

    const newItem = new Laundry({
      name,
      category,
      price: parseFloat(price),
      unit, // Add unit
    });

    // Save image if present
    if (req.files && req.files.image && req.files.image[0]) {
      newItem.image = req.files.image[0].path; // Cloudinary URL
    }

    const savedItem = await newItem.save();
    console.log('Admin: New laundry item created:', savedItem);
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Admin: Error adding laundry item:', error);
    res.status(500).json({ message: 'Failed to add laundry item', error: error.message });
  }
});

// POST Unstitched - Add new unstitched item
router.post('/unstitched', upload.array('images', 5), async (req, res) => {
  try {
    console.log('--- Admin POST /unstitched ---');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    let { sizes, name, price, description } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    // Handle images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path); // Cloudinary URLs
    }

    // Handle sizes parsing
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

    const newItem = new Unstitched({ 
      name, 
      price: parseFloat(price), 
      description: description || '', 
      images, 
      sizes 
    });

    const savedItem = await newItem.save();
    console.log('Admin: New unstitched item created:', savedItem);
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Admin: Error adding unstitched item:', error);
    res.status(500).json({ message: 'Failed to add unstitched item', error: error.message });
  }
});

// PUT Laundry - Update laundry item
router.put('/laundry/:id', upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    console.log('--- Admin PUT /laundry/:id ---');
    console.log('req.params.id:', req.params.id);
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    const { name, category, price, unit } = req.body; // Extract unit

    if (!name || !category || !price || !unit) {
      return res.status(400).json({ message: 'Name, category, price, and unit are required' });
    }

    let update = {
      name,
      category,
      price: parseFloat(price),
      unit, // Add unit
    };

    // Update image if new one is uploaded
    if (req.files && req.files.image && req.files.image[0]) {
      update.image = req.files.image[0].path; // Cloudinary URL
    }

    const updatedItem = await Laundry.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Laundry item not found' });
    }

    console.log('Admin: Laundry item updated:', updatedItem);
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Admin: Error updating laundry item:', error);
    res.status(500).json({ message: 'Failed to update laundry item', error: error.message });
  }
});

// PUT Unstitched - Update unstitched item
router.put('/unstitched/:id', upload.array('replaceImages', 5), async (req, res) => {
  try {
    console.log('--- Admin PUT /unstitched/:id ---');
    console.log('req.params.id:', req.params.id);
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    let { name, price, description, sizes, images } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    let update = { 
      name, 
      price: parseFloat(price), 
      description: description || '' 
    };

    // Handle sizes parsing
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

    // Find existing item
    const item = await Unstitched.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Unstitched item not found' });
    }

    let updatedImages = item.images || [];

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path); // Cloudinary URLs
      
      // If replaceIndexes are provided, replace specific images
      let replaceIndexes = req.body.replaceIndexes;
      if (replaceIndexes) {
        if (!Array.isArray(replaceIndexes)) replaceIndexes = [replaceIndexes];
        
        replaceIndexes.forEach((idx, i) => {
          const nIdx = parseInt(idx);
          if (!isNaN(nIdx) && i < newImages.length) {
            if (nIdx < updatedImages.length) {
              updatedImages[nIdx] = newImages[i];
            } else {
              updatedImages.push(newImages[i]);
            }
          }
        });
      } else {
        // No specific indexes, append new images
        newImages.forEach(img => {
          if (updatedImages.length < 5) {
            updatedImages.push(img);
          }
        });
      }
    }

    // Handle image deletions from frontend
    if (images && Array.isArray(images)) {
      updatedImages = images;
    }

    // Limit to 5 images max
    updatedImages = updatedImages.slice(0, 5);
    update.images = updatedImages;

    const updatedItem = await Unstitched.findByIdAndUpdate(
      req.params.id, 
      update, 
      { new: true }
    );

    console.log('Admin: Unstitched item updated:', updatedItem);
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Admin: Error updating unstitched item:', error);
    res.status(500).json({ message: 'Failed to update unstitched item', error: error.message });
  }
});

// DELETE Laundry - Delete laundry item
router.delete('/laundry/:id', async (req, res) => {
  try {
    console.log('--- Admin DELETE /laundry/:id ---');
    console.log('req.params.id:', req.params.id);

    const deletedItem = await Laundry.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Laundry item not found' });
    }

    console.log('Admin: Laundry item deleted:', deletedItem);
    res.status(200).json({ message: 'Laundry item deleted successfully' });
  } catch (error) {
    console.error('Admin: Error deleting laundry item:', error);
    res.status(500).json({ message: 'Failed to delete laundry item', error: error.message });
  }
});

// DELETE Unstitched - Delete unstitched item
router.delete('/unstitched/:id', async (req, res) => {
  try {
    console.log('--- Admin DELETE /unstitched/:id ---');
    console.log('req.params.id:', req.params.id);

    const deletedItem = await Unstitched.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Unstitched item not found' });
    }

    console.log('Admin: Unstitched item deleted:', deletedItem);
    res.status(200).json({ message: 'Unstitched item deleted successfully' });
  } catch (error) {
    console.error('Admin: Error deleting unstitched item:', error);
    res.status(500).json({ message: 'Failed to delete unstitched item', error: error.message });
  }
});

// Bulk operations
router.post('/laundry/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'IDs array is required' });
    }

    const result = await Laundry.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ 
      message: `${result.deletedCount} laundry items deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Admin: Error bulk deleting laundry items:', error);
    res.status(500).json({ message: 'Failed to bulk delete laundry items', error: error.message });
  }
});

router.post('/unstitched/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'IDs array is required' });
    }

    const result = await Unstitched.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ 
      message: `${result.deletedCount} unstitched items deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Admin: Error bulk deleting unstitched items:', error);
    res.status(500).json({ message: 'Failed to bulk delete unstitched items', error: error.message });
  }
});

module.exports = router;
