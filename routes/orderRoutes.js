const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');

// POST /api/orders - Place a new order
router.post('/', async (req, res) => {
  try {
    const { customer, items, total, note, paymentStatus } = req.body;

    if (!customer || !items || !total) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newOrder = new Order({
      customer,
      items,
      total,
      note, // Save note if present
      paymentStatus: paymentStatus || 'Cash on Delivery',
      timestamp: new Date(),
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Failed to place order' });
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
    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
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

module.exports = router;
