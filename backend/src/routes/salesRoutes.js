const express = require('express');

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale
} = require('../controllers/salesController');

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getSales);
router.get('/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getSaleById);
router.post('/', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('prescriptionImage'), createSale);
router.put('/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('prescriptionImage'), updateSale);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'pharmacist'), deleteSale);

module.exports = router;
