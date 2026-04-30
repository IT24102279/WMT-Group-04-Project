const express = require('express');

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  createTicket,
  getTickets,
  updateTicket,
  deleteTicket,
  getFile
} = require('../controllers/supportController');

const router = express.Router();

router.get('/files/:filename', getFile); // Public or semi-public file retrieval

router.get('/appointments', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff', 'customer'), getAppointments);
router.post('/appointments', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff', 'customer'), createAppointment);
router.put('/appointments/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), updateAppointment);
router.delete('/appointments/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), deleteAppointment);

router.get('/tickets', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getTickets);
router.post('/tickets', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('report'), createTicket);
router.put('/tickets/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('report'), updateTicket);
router.delete('/tickets/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), deleteTicket);

module.exports = router;
