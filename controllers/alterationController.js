const Alteration = require('../models/alterationModel');
const { sendAlterationEmail } = require('../utils/email');

exports.createAlteration = async (req, res) => {
  try {
    const { customer, note } = req.body;
    if (!customer || !customer.name || !customer.address || !customer.phone || !note) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newAlteration = new Alteration({ customer, note });
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
    const updated = await Alteration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Alteration not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error });
  }
};
