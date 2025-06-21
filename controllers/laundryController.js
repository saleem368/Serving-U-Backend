const Laundry = require('../models/laundryModel');

exports.getItems = async (req, res) => {
  try {
    const items = await Laundry.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching laundry items', error });
  }
};

exports.addItem = async (req, res) => {
  try {
    const newItem = new Laundry(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding laundry item', error });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await Laundry.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting laundry item', error });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const updatedItem = await Laundry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating laundry item', error });
  }
};