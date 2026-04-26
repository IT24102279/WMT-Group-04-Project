const express = require('express');

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
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
} = require('../controllers/shopController');

const router = express.Router();

router.get('/products', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff', 'driver', 'customer'), getProducts);
router.get('/products/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff', 'driver', 'customer'), getProductById);
router.post('/products', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('image'), createProduct);
router.put('/products/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('image'), updateProduct);
router.delete('/products/:id', verifyToken, authorizeRoles('admin', 'pharmacist'), deleteProduct);

router.get('/orders', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff', 'driver', 'customer'), getOrders);
router.get('/orders/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff', 'driver', 'customer'), getOrderById);
router.post('/orders', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff', 'customer'), createOrder);
router.put('/orders/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), updateOrder);
router.delete('/orders/:id', verifyToken, authorizeRoles('admin', 'pharmacist'), deleteOrder);
router.patch('/orders/:id/assign-driver', verifyToken, authorizeRoles('admin', 'pharmacist'), assignOrderDriver);
router.post(
  '/orders/:id/proof-of-delivery',
  verifyToken,
  authorizeRoles('admin', 'pharmacist', 'driver'),
  upload.single('proof'),
  uploadProofOfDelivery
);

module.exports = router;
