const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const { sendOrderEmail } = require('../utils/email');

// POST /api/orders - Place a new order
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received order request body:', JSON.stringify(req.body, null, 2));
    
    const { customer, items, total, note, paymentStatus } = req.body;

    console.log('🔍 Extracted fields:');
    console.log('- customer:', customer);
    console.log('- items:', items);
    console.log('- total:', total);
    console.log('- note:', note);
    console.log('- paymentStatus:', paymentStatus);

    if (!customer || !items || total === undefined || total === null) {
      console.error('❌ Missing required fields:', {
        hasCustomer: !!customer,
        hasItems: !!items,
        hasTotal: total !== undefined && total !== null,
        totalValue: total
      });
      return res.status(400).json({ message: 'Missing required fields: customer, items, and total are required' });
    }

    // Validate that total is a number (can be 0 for laundry-only orders)
    if (typeof total !== 'number' || total < 0) {
      console.error('❌ Invalid total value:', { total, type: typeof total });
      return res.status(400).json({ message: 'Total must be a non-negative number' });
    }

    // Separate laundry and readymade items
    // Handle both new laundryType field and old category field for backward compatibility
    const laundryItems = items.filter(item => 
      (item.laundryType && item.laundryType.trim() !== '') || 
      (item.category === 'laundry')
    );
    const readymadeItems = items.filter(item => 
      (!item.laundryType || item.laundryType.trim() === '') && 
      (item.category !== 'laundry')
    );

    console.log('📊 Item categorization:');
    console.log('- laundryItems:', laundryItems.length);
    console.log('- readymadeItems:', readymadeItems.length);

    const newOrder = new Order({
      customer,
      items,
      total,
      note, // Save note if present
      paymentStatus: paymentStatus || 'Cash on Delivery',
      // Initialize new status fields
      laundryStatus: laundryItems.length > 0 ? 'Pending' : undefined,
      readymadeStatus: readymadeItems.length > 0 ? 'Pending' : undefined,
      // Note: Payment statuses will be set by the pre-save hook in the model
      timestamp: new Date(),
    });

    console.log('💾 Saving order to database...');
    const savedOrder = await newOrder.save();
    console.log('✅ Order saved successfully:', savedOrder._id);
    
    // Send email notification to admin
    sendOrderEmail(savedOrder);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('🚨 Error placing order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

// GET /api/orders - Fetch all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Accepted', 'Rejected', 'Completed', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// PATCH /api/orders/:id/total - Update order admin total
router.patch('/:id/total', async (req, res) => {
  try {
    console.log('PATCH /api/orders/:id/total called');
    console.log('Order ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const { adminTotal } = req.body;
    if (adminTotal !== undefined && adminTotal < 0) {
      return res.status(400).json({ message: 'Admin total must be non-negative' });
    }
    
    console.log('Updating order with adminTotal:', adminTotal);
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { adminTotal: adminTotal || null },
      { new: true }
    );
    
    if (!updatedOrder) {
      console.log('Order not found:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('Order updated successfully:', {
      id: updatedOrder._id,
      total: updatedOrder.total,
      adminTotal: updatedOrder.adminTotal
    });
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order admin total:', error);
    res.status(500).json({ message: 'Failed to update order admin total' });
  }
});

// PATCH /api/orders/:id/payment - Update order payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    console.log('PATCH /api/orders/:id/payment called');
    console.log('Order ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const { paymentStatus, paymentId, razorpayOrderId, razorpaySignature } = req.body;
    
    if (!paymentStatus || !['Paid', 'Cash on Delivery'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    
    const updateData = { 
      paymentStatus,
      paymentUpdatedAt: new Date()
    };
    
    // For online payments, store transaction details
    if (paymentStatus === 'Paid' && paymentId) {
      updateData.paymentId = paymentId;
      updateData.razorpayOrderId = razorpayOrderId;
      updateData.razorpaySignature = razorpaySignature;
      
      console.log('Recording payment transaction:', {
        paymentId,
        razorpayOrderId,
        orderId: req.params.id
      });
    }
    
    console.log('Updating order payment with:', updateData);
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedOrder) {
      console.log('Order not found:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('Order payment updated successfully:', {
      id: updatedOrder._id,
      paymentStatus: updatedOrder.paymentStatus,
      paymentId: updatedOrder.paymentId,
      customer: updatedOrder.customer.name,
      amount: updatedOrder.adminTotal || updatedOrder.total
    });
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order payment status:', error);
    res.status(500).json({ message: 'Failed to update order payment status' });
  }
});

// PATCH /api/orders/:id/laundry-status - Update laundry status
router.patch('/:id/laundry-status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Accepted', 'Rejected', 'Completed', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid laundry status value' });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { laundryStatus: status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating laundry status:', error);
    res.status(500).json({ message: 'Failed to update laundry status' });
  }
});

// PATCH /api/orders/:id/readymade-status - Update readymade status
router.patch('/:id/readymade-status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Accepted', 'Rejected', 'Completed', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid readymade status value' });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { readymadeStatus: status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating readymade status:', error);
    res.status(500).json({ message: 'Failed to update readymade status' });
  }
});

// PATCH /api/orders/:id/laundry-total - Update laundry admin total
router.patch('/:id/laundry-total', async (req, res) => {
  try {
    const { laundryAdminTotal } = req.body;
    if (laundryAdminTotal !== undefined && laundryAdminTotal < 0) {
      return res.status(400).json({ message: 'Laundry admin total must be non-negative' });
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { laundryAdminTotal: laundryAdminTotal || null },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating laundry admin total:', error);
    res.status(500).json({ message: 'Failed to update laundry admin total' });
  }
});

// PATCH /api/orders/:id/laundry-payment - Update laundry payment status
router.patch('/:id/laundry-payment', async (req, res) => {
  try {
    console.log('🧺 Laundry payment update request:', {
      orderId: req.params.id,
      body: req.body
    });
    
    const { paymentStatus, paymentId, razorpayOrderId, razorpaySignature } = req.body;
    
    if (!paymentStatus || !['Paid', 'Cash on Delivery', 'Pending'].includes(paymentStatus)) {
      console.log('❌ Invalid laundry payment status:', paymentStatus);
      return res.status(400).json({ message: 'Invalid laundry payment status' });
    }
    
    const updateData = { 
      laundryPaymentStatus: paymentStatus,
      paymentUpdatedAt: new Date()
    };
    
    if (paymentStatus === 'Paid' && paymentId) {
      updateData.laundryPaymentId = paymentId;
      if (razorpayOrderId) updateData.laundryRazorpayOrderId = razorpayOrderId;
      if (razorpaySignature) updateData.laundryRazorpaySignature = razorpaySignature;
    }
    
    console.log('📝 Updating laundry payment with data:', updateData);
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedOrder) {
      console.log('❌ Order not found:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('✅ Laundry payment updated successfully:', {
      orderId: updatedOrder._id,
      laundryPaymentStatus: updatedOrder.laundryPaymentStatus
    });
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('❌ Error updating laundry payment status:', error);
    res.status(500).json({ message: 'Failed to update laundry payment status' });
  }
});

// PATCH /api/orders/:id/readymade-payment - Update readymade payment status
router.patch('/:id/readymade-payment', async (req, res) => {
  try {
    console.log('👔 Readymade payment update request:', {
      orderId: req.params.id,
      body: req.body
    });
    
    const { paymentStatus, paymentId, razorpayOrderId, razorpaySignature } = req.body;
    
    if (!paymentStatus || !['Paid', 'Cash on Delivery', 'Pending'].includes(paymentStatus)) {
      console.log('❌ Invalid readymade payment status:', paymentStatus);
      return res.status(400).json({ message: 'Invalid readymade payment status' });
    }
    
    const updateData = { 
      readymadePaymentStatus: paymentStatus,
      paymentUpdatedAt: new Date()
    };
    
    if (paymentStatus === 'Paid' && paymentId) {
      updateData.readymadePaymentId = paymentId;
      if (razorpayOrderId) updateData.readymadeRazorpayOrderId = razorpayOrderId;
      if (razorpaySignature) updateData.readymadeRazorpaySignature = razorpaySignature;
    }
    
    console.log('📝 Updating readymade payment with data:', updateData);
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedOrder) {
      console.log('❌ Order not found:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('✅ Readymade payment updated successfully:', {
      orderId: updatedOrder._id,
      readymadePaymentStatus: updatedOrder.readymadePaymentStatus
    });
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('❌ Error updating readymade payment status:', error);
    res.status(500).json({ message: 'Failed to update readymade payment status' });
  }
});

module.exports = router;
