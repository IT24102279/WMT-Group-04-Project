const Transaction = require('../models/Transaction');

const buildFileUrl = (req, fileName) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${fileName}`;
};

const isLegacyReminderRecord = (transaction) => {
  if (transaction.isReminder === true) {
    return true;
  }
  return transaction.type === 'expense' && transaction.status === 'pending' && !transaction.documentUrl;
};

const createTransaction = async (req, res, next) => {
  try {
    const payload = req.body;
    if (payload.isReminder !== undefined) {
      payload.isReminder = payload.isReminder === true || payload.isReminder === 'true';
    }
    if (req.file) {
      payload.documentUrl = buildFileUrl(req, req.file.filename);
    }
    const transaction = await Transaction.create(payload);
    return res.status(201).json(transaction);
  } catch (error) {
    return next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const data = await Transaction.find({}).sort({ date: -1 });
    const filtered = data.filter((transaction) => !isLegacyReminderRecord(transaction));
    return res.json(filtered);
  } catch (error) {
    return next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    return res.json(transaction);
  } catch (error) {
    return next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const updates = req.body;
    if (req.file) {
      updates.documentUrl = buildFileUrl(req, req.file.filename);
    }
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    return res.json(transaction);
  } catch (error) {
    return next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    return res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

const getPaymentReminders = async (req, res, next) => {
  try {
    const reminders = await Transaction.find({ status: { $in: ['pending', 'overdue'] } }).sort({ date: 1 });
    return res.json(reminders.filter((transaction) => isLegacyReminderRecord(transaction)));
  } catch (error) {
    return next(error);
  }
};

const getCheckReminders = async (req, res, next) => {
  try {
    const reminders = await Transaction.find({ type: 'expense', status: 'pending' }).sort({ date: 1 });
    return res.json(reminders.filter((transaction) => isLegacyReminderRecord(transaction)));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getPaymentReminders,
  getCheckReminders
};
