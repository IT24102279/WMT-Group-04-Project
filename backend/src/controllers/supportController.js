const Appointment = require('../models/Appointment');
const SupportTicket = require('../models/SupportTicket');

const buildFileUrl = (req, fileName) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/api/support/files/${fileName}`;
};

const getFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const { getConnection } = require('../config/db');
    const mongoose = require('mongoose');
    const db = getConnection();

    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(db.db, {
      bucketName: 'uploads'
    });

    const files = await bucket.find({ filename }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.set('Content-Type', files[0].contentType);
    const downloadStream = bucket.openDownloadStreamByName(filename);
    
    downloadStream.on('error', (err) => {
      return res.status(404).json({ message: 'Error retrieving file' });
    });

    downloadStream.pipe(res);
  } catch (error) {
    return next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user.id
    };
    const appointment = await Appointment.create(payload);
    return res.status(201).json(appointment);
  } catch (error) {
    return next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const filter = req.user.role === 'customer' ? { createdBy: req.user.id } : {};
    const appointments = await Appointment.find(filter).sort({ date: 1, time: 1 });
    return res.json(appointments);
  } catch (error) {
    return next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    return res.json(appointment);
  } catch (error) {
    return next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    return res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const payload = req.body;
    if (req.file) {
      payload.reportUrl = buildFileUrl(req, req.file.filename);
    }
    const ticket = await SupportTicket.create(payload);
    return res.status(201).json(ticket);
  } catch (error) {
    return next(error);
  }
};

const getTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return next(error);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const updates = req.body;
    if (req.file) {
      updates.reportUrl = buildFileUrl(req, req.file.filename);
    }
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    return res.json(ticket);
  } catch (error) {
    return next(error);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    return res.json({ message: 'Support ticket deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  createTicket,
  getTickets,
  updateTicket,
  deleteTicket,
  getFile
};
