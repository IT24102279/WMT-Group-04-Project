const Order = require('../models/Order');
const ShopProduct = require('../models/ShopProduct');

const buildFileUrl = (req, fileName) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/api/files/${fileName}`;
};

const buildOrderItems = async (items = []) => {
  const resolvedItems = [];

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    const productId = item.productId || null;
    let itemName = item.itemName;
    let unitPrice = Number(item.unitPrice || 0);

    if (productId) {
      const product = await ShopProduct.findById(productId);
      if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
      }

      if (product.stock < quantity) {
        const error = new Error(`Insufficient stock for ${product.name}`);
        error.statusCode = 400;
        throw error;
      }

      itemName = itemName || product.name;
      unitPrice = unitPrice > 0 ? unitPrice : Number(product.price || 0);
    }

    resolvedItems.push({
      productId,
      itemName,
      quantity,
      unitPrice
    });
  }

  return resolvedItems;
};

const createProduct = async (req, res, next) => {
  try {
    const payload = req.body;
    if (req.file) {
      payload.imageUrl = buildFileUrl(req, req.file.filename);
    }
    const product = await ShopProduct.create(payload);
    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const filter = req.user?.role === 'customer' ? { isActive: true } : {};
    const products = await ShopProduct.find(filter).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await ShopProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    console.log(`[Product] Updating ${id}:`, updates);

    if (req.file) {
      updates.imageUrl = buildFileUrl(req, req.file.filename);
    }

    if (updates.price) updates.price = Number(updates.price);
    if (updates.stock) updates.stock = Number(updates.stock);
    if (updates.isActive) updates.isActive = updates.isActive === 'true';

    const product = await ShopProduct.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!product) {
      console.log(`[Product] Update failed: Product ${id} not found`);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log(`[Product] Update success: ${id}`);
    return res.json(product);
  } catch (error) {
    console.error(`[Product] Update error:`, error);
    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await ShopProduct.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.user?.role === 'customer') {
      payload.customerId = req.user.id;
    }

    const items = await buildOrderItems(payload.items || []);
    const total = Number(
      payload.total || items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
    );

    const order = await Order.create({
      ...payload,
      items,
      total,
      customerId: payload.customerId
    });

    for (const item of items) {
      if (item.productId) {
        const product = await ShopProduct.findById(item.productId);
        if (product) {
          product.stock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0));
          await product.save();
        }
      }
    }

    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const filter = req.user?.role === 'customer' ? { customerId: req.user.id } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

const assignOrderDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { driverId, status: 'assigned' },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

const uploadProofOfDelivery = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Proof of delivery image is required' });
    }

    const proofOfDeliveryUrl = buildFileUrl(req, req.file.filename);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { proofOfDeliveryUrl, status: 'delivered' },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  assignOrderDriver,
  uploadProofOfDelivery
};
