const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const router = express.Router();
const JWT_SECRET = 'your_jwt_secret_key'; // Use a secure key in production

// Google OAuth callback endpoint
router.post('/google', async (req, res) => {
  const { email, name, phone = '', address = '' } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password: '', role: 'customer', name, phone, address });
      await user.save();
    } else {
      // Only update fields if provided and not empty, and for name, prefer existing user-set name over Google name
      if (name && name.trim() !== '' && (!user.name || user.name.trim() === '' || user.name === user.email)) {
        user.name = name;
      }
      if (phone && phone.trim() !== '') user.phone = phone;
      if (address && address.trim() !== '') user.address = address;
      await user.save();
    }
    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, role: user.role, name: user.name, phone: user.phone, address: user.address });
  } catch (error) {
    res.status(500).json({ message: 'Google auth failed', error: error.message });
  }
});

module.exports = router;
