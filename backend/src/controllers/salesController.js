const Sale = require('../models/Sale');
const Patient = require('../models/Patient');
const InventoryItem = require('../models/InventoryItem');

const buildFileUrl = (req, fileName) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/api/files/${fileName}`;
};

const createSale = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    console.log(`[Sale] Creating sale:`, payload);

    if (payload.items && typeof payload.items === 'string') {
      try {
        payload.items = JSON.parse(payload.items);
      } catch (e) {
        console.error('Failed to parse sale items:', e);
      }
    }

    if (req.file) {
      payload.prescriptionImageUrl = buildFileUrl(req, req.file.filename);
    }
    
    if (payload.total) payload.total = Number(payload.total);
    if (payload.discount) payload.discount = Number(payload.discount);

    const sale = await Sale.create(payload);
    console.log(`[Sale] Create success: ${sale._id}`);

    // Handle Patient Loyalty Points
    if (payload.patientId && payload.discount > 0) {
      await Patient.findByIdAndUpdate(payload.patientId, {
        $inc: { loyaltyPoints: -payload.discount }
      }).catch(err => console.error('Failed to update patient loyalty points:', err));
    }

    // Handle Inventory Deduction
    if (payload.items && Array.isArray(payload.items)) {
      for (const item of payload.items) {
        if (item.itemName && item.quantity) {
          await InventoryItem.findOneAndUpdate(
            { itemName: item.itemName },
            { $inc: { quantity: -item.quantity } }
          ).catch(err => console.error(`Failed to deduct inventory for ${item.itemName}:`, err));
        }
      }
    }

    return res.status(201).json(sale);
  } catch (error) {
    console.error(`[Sale] Create error:`, error);
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
    const { id } = req.params;
    const updates = { ...req.body };
    console.log(`[Sale] Updating ${id}:`, updates);

    if (updates.items && typeof updates.items === 'string') {
      try {
        updates.items = JSON.parse(updates.items);
      } catch (e) {
        console.error('Failed to parse sale items in update:', e);
      }
    }

    if (req.file) {
      updates.prescriptionImageUrl = buildFileUrl(req, req.file.filename);
    }

    if (updates.total) updates.total = Number(updates.total);

    const sale = await Sale.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!sale) {
      console.log(`[Sale] Update failed: Sale ${id} not found`);
      return res.status(404).json({ message: 'Sale not found' });
    }

    console.log(`[Sale] Update success: ${id}`);
    return res.json(sale);
  } catch (error) {
    console.error(`[Sale] Update error:`, error);
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
