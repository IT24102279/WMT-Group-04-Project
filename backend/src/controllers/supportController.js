const Appointment = require('../models/Appointment');
const SupportTicket = require('../models/SupportTicket');

const buildFileUrl = (req, fileName) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${fileName}`;
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
  deleteTicket
};
