const express = require('express');

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getPatients);
router.get('/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), getPatientById);
router.post('/', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('consentForm'), createPatient);
router.put('/:id', verifyToken, authorizeRoles('admin', 'pharmacist', 'staff'), upload.single('consentForm'), updatePatient);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'pharmacist'), deletePatient);

module.exports = router;
