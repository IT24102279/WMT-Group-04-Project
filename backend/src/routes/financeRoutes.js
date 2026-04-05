const express = require('express');

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getPaymentReminders,
  getCheckReminders
} = require('../controllers/financeController');

const router = express.Router();

router.get('/transactions', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getTransactions);
router.get('/transactions/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getTransactionById);
router.post(
  '/transactions',
  verifyToken,
  authorizeRoles('admin', 'pharmacist', 'staff'),
  upload.single('document'),
  createTransaction
);
router.put(
  '/transactions/:id',
  verifyToken,
  authorizeRoles('admin', 'pharmacist', 'staff'),
  upload.single('document'),
  updateTransaction
);
router.delete('/transactions/:id', verifyToken, authorizeRoles('admin', 'pharmacist'), deleteTransaction);
router.get('/reminders/payments', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getPaymentReminders);
router.get('/reminders/checks', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getCheckReminders);

module.exports = router;
