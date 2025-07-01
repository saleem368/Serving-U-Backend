const Alteration = require('../models/alterationModel');
const { sendAlterationEmail } = require('../utils/email');

exports.createAlteration = async (req, res) => {
  try {
    const { customer, note, quantity = 1 } = req.body;
    if (!customer || !customer.name || !customer.address || !customer.phone || !note) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newAlteration = new Alteration({ customer, note, quantity });
    const saved = await newAlteration.save();
    // Send email notification to admin
    sendAlterationEmail(saved);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create alteration', error });
  }
};

exports.getAlterations = async (req, res) => {
  try {
    const alterations = await Alteration.find();
    res.status(200).json(alterations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch alterations', error });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected', 'completed', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const updateFields = { status };
    
    // Auto-update payment status to "Paid" when status is set to "Delivered"
    if (status === 'delivered') {
      updateFields.paymentStatus = 'Paid';
      updateFields.paymentUpdatedAt = new Date();
      console.log('🔄 Auto-updating alteration payment status to Paid for delivered alteration');
    }
    
    const updated = await Alteration.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Alteration not found' });
    
    console.log('✅ Alteration status updated:', { id: req.params.id, status, paymentStatus: updated.paymentStatus });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error });
  }
};

// Update admin total for alteration
exports.updateAdminTotal = async (req, res) => {
  try {
    const { adminTotal } = req.body;
    if (!adminTotal || adminTotal <= 0) {
      return res.status(400).json({ message: 'Invalid admin total value' });
    }
    
    const updated = await Alteration.findByIdAndUpdate(
      req.params.id,
      { adminTotal },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Alteration not found' });
    
    console.log('✅ Alteration admin total updated:', { id: req.params.id, adminTotal });
    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Failed to update alteration admin total:', error);
    res.status(500).json({ message: 'Failed to update admin total', error });
  }
};

// Update payment status for alteration
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!['Paid', 'Cash on Delivery', 'Pending'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status value' });
    }
    
    const updateFields = { 
      paymentStatus, 
      paymentUpdatedAt: new Date() 
    };
    
    if (paymentId) updateFields.paymentId = paymentId;
    if (razorpayOrderId) updateFields.razorpayOrderId = razorpayOrderId;
    if (razorpaySignature) updateFields.razorpaySignature = razorpaySignature;
    
    const updated = await Alteration.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Alteration not found' });
    
    console.log('✅ Alteration payment status updated:', { id: req.params.id, paymentStatus });
    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Failed to update alteration payment status:', error);
    res.status(500).json({ message: 'Failed to update payment status', error });
  }
};
