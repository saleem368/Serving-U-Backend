const Unstitched = require('../models/unstichedModel');

exports.getItems = async (req, res) => {
  try {
    const items = await Unstitched.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unstitched items', error });
  }
};

exports.addItem = async (req, res) => {
  try {
    const newItem = new Unstitched(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding unstitched item', error });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await Unstitched.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting unstitched item', error });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const updatedItem = await Unstitched.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating unstitched item', error });
  }
};