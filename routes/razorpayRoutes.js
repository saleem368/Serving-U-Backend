const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/order', async (req, res) => {
  try {
    console.log('🎯 Razorpay order creation request received');
    console.log('📝 Request body:', req.body);
    console.log('🔑 Razorpay Key ID:', process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing');
    console.log('🔐 Razorpay Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing');
    
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      console.log('❌ Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount', details: 'Amount must be greater than 0' });
    }
    
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: `order_rcptid_${Date.now()}`,
    };
    
    console.log('🏪 Creating Razorpay order with options:', options);
    
    const order = await razorpay.orders.create(options);
    
    console.log('✅ Razorpay order created successfully:', order);
    
    res.json(order);
  } catch (err) {
    console.error('❌ Razorpay order creation failed:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order', details: err.message });
  }
});

// Payment verification route
router.post('/verify-payment', async (req, res) => {
  try {
    console.log('🔍 Payment verification request received');
    console.log('📝 Request body:', req.body);
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log('❌ Missing required payment verification fields');
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    console.log('🔒 Creating signature for:', body);
    
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
    
    console.log('🔐 Expected signature:', expectedSignature);
    console.log('📥 Received signature:', razorpay_signature);
    
    if (expectedSignature === razorpay_signature) {
      console.log('✅ Payment verification successful');
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      console.log('❌ Payment verification failed - signature mismatch');
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ success: false, message: "Server error during payment verification" });
  }
});

module.exports = router;
