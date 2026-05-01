const Sale = require('../models/Sale');

const buildFileUrl = (req, fileName) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/api/files/${fileName}`;
};

const createSale = async (req, res, next) => {
  try {
    const payload = req.body;
    if (req.file) {
      payload.prescriptionImageUrl = buildFileUrl(req, req.file.filename);
    }
    const sale = await Sale.create(payload);
    return res.status(201).json(sale);
  } catch (error) {
    return next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find().sort({ date: -1 });
    return res.json(sales);
  } catch (error) {
    return next(error);
  }
};

const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    return res.json(sale);
  } catch (error) {
    return next(error);
  }
};

const updateSale = async (req, res, next) => {
  try {
    const updates = req.body;
    if (req.file) {
      updates.prescriptionImageUrl = buildFileUrl(req, req.file.filename);
    }
    const sale = await Sale.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    return res.json(sale);
  } catch (error) {
    return next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    return res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale
};
