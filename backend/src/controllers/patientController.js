const Patient = require('../models/Patient');

const buildFileUrl = (req, fileName) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/api/files/${fileName}`;
};

const createPatient = async (req, res, next) => {
  try {
    const payload = req.body;
    if (req.file) {
      payload.consentFormUrl = buildFileUrl(req, req.file.filename);
    }
    const patient = await Patient.create(payload);
    return res.status(201).json(patient);
  } catch (error) {
    return next(error);
  }
};

const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    return res.json(patients);
  } catch (error) {
    return next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    return res.json(patient);
  } catch (error) {
    return next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    console.log(`[Patient] Updating ${id}:`, updates);

    if (req.file) {
      updates.consentFormUrl = buildFileUrl(req, req.file.filename);
    }
    
    if (updates.loyaltyPoints) {
      updates.loyaltyPoints = Number(updates.loyaltyPoints);
    }

    const patient = await Patient.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!patient) {
      console.log(`[Patient] Update failed: Patient ${id} not found`);
      return res.status(404).json({ message: 'Patient not found' });
    }

    console.log(`[Patient] Update success: ${id}`);
    return res.json(patient);
  } catch (error) {
    console.error(`[Patient] Update error:`, error);
    return next(error);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    return res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
