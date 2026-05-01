const InventoryItem = require('../models/InventoryItem');

const buildFileUrl = (req, fileName) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/api/files/${fileName}`;
};

const createItem = async (req, res, next) => {
  try {
    const payload = req.body;

    if (req.file) {
      payload.invoiceUrl = buildFileUrl(req, req.file.filename);
    }

    const item = await InventoryItem.create(payload);
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
};

const getItems = async (req, res, next) => {
  try {
    const items = await InventoryItem.find().sort({ expiryDate: 1, itemName: 1 });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    return res.json(item);
  } catch (error) {
    return next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const updates = req.body;

    if (req.file) {
      updates.invoiceUrl = buildFileUrl(req, req.file.filename);
    }

    const item = await InventoryItem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    return res.json(item);
  } catch (error) {
    return next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    return res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

const getNearExpiryItems = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 30);
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + days);

    const items = await InventoryItem.find({
      expiryDate: {
        $gte: today,
        $lte: thresholdDate
      }
    }).sort({ expiryDate: 1 });

    return res.json(items);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getNearExpiryItems
};
