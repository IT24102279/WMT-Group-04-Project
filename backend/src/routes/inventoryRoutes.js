const express = require('express');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getNearExpiryItems
} = require('../controllers/inventoryController');

const router = express.Router();

router.get('/near-expiry', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getNearExpiryItems);
router.get('/', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getItems);
router.get('/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getItemById);
router.post('/', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('invoice'), createItem);
router.put('/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('invoice'), updateItem);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'pharmacist'), deleteItem);

module.exports = router;
