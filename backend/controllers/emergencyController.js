// controllers/emergencyController.js — SOS & Emergency System
const { EmergencyContact, EmergencyAlert, User } = require('../models');
const { asyncHandler, createError } = require('../middleware');

exports.getContacts = asyncHandler(async (req, res) => {
  const contacts = await EmergencyContact.find({ userId: req.user._id }).sort({ isPrimary: -1 });
  res.json({ success: true, contacts });
});

exports.addContact = asyncHandler(async (req, res) => {
  const { name, phone, relation, email, isPrimary, isDoctor, notes } = req.body;
  if (!name || !phone || !relation) throw createError('Name, phone and relation required.');

  if (isPrimary) {
    await EmergencyContact.updateMany({ userId: req.user._id }, { isPrimary: false });
  }

  const contact = await EmergencyContact.create({
    userId: req.user._id, name, phone, relation, email, isPrimary, isDoctor, notes,
  });

  res.status(201).json({ success: true, message: 'Emergency contact added.', contact });
});

exports.updateContact = asyncHandler(async (req, res) => {
  const contact = await EmergencyContact.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  if (!contact) throw createError('Contact not found.', 404);
  res.json({ success: true, contact });
});

exports.deleteContact = asyncHandler(async (req, res) => {
  await EmergencyContact.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true, message: 'Contact deleted.' });
});

exports.triggerSOS = asyncHandler(async (req, res) => {
  const { location, message } = req.body;

  const alert = await EmergencyAlert.create({
    userId: req.user._id,
    type:   'sos',
    location,
    message: message || 'EMERGENCY SOS triggered!',
    notifiedContacts: [],
  });

  // Emit via Socket.io (handled in server.js)
  const io = req.app.get('io');
  if (io) {
    io.emit(`emergency:${req.user._id}`, {
      type:    'SOS',
      userId:  req.user._id,
      userName: req.user.name,
      location,
      alert,
    });
  }

  res.status(201).json({ success: true, message: 'SOS alert sent!', alert });
});

exports.getAlerts = asyncHandler(async (req, res) => {
  const alerts = await EmergencyAlert.find({ userId: req.user._id })
    .sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, alerts });
});

exports.resolveAlert = asyncHandler(async (req, res) => {
  const alert = await EmergencyAlert.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user._id },
    { new: true }
  );
  if (!alert) throw createError('Alert not found.', 404);
  res.json({ success: true, alert });
});

// Override triggerSOS to also send emails
const notifySvc = require('../services/notificationService');
const _originalSOS = exports.triggerSOS;
exports.triggerSOS = require('../middleware').asyncHandler(async (req, res) => {
  const { location, message } = req.body;
  const { EmergencyContact, EmergencyAlert, User } = require('../models');

  const alert = await EmergencyAlert.create({
    userId:  req.user._id,
    type:    'sos',
    location,
    message: message || 'EMERGENCY SOS triggered!',
    notifiedContacts: [],
  });

  // Emit socket
  const io = req.app.get('io');
  if (io) {
    io.emit(`emergency:${req.user._id}`, { type:'SOS', userId: req.user._id, userName: req.user.name, location, alert });
    // Also notify all caregivers
    const { linkedCaregivers } = await User.findById(req.user._id).select('linkedCaregivers');
    (linkedCaregivers||[]).forEach(cId => io.to(`user:${cId}`).emit('emergency:sos_alert', { patient: req.user.name, location, alert }));
  }

  // Send SOS emails to all emergency contacts
  const contacts = await EmergencyContact.find({ userId: req.user._id });
  const emailPromises = contacts
    .filter(c => c.email)
    .map(c => notifySvc.sendSOSEmail({ patient: req.user, contact: c, location, message }));

  const emailResults = await Promise.allSettled(emailPromises);
  const notified = emailResults.filter(r => r.status === 'fulfilled' && r.value?.success).length;

  alert.notifiedContacts = contacts.filter(c => c.email).map(c => c.email);
  await alert.save();

  res.status(201).json({
    success: true,
    message: `SOS alert sent! ${notified} email(s) dispatched.`,
    alert,
    emailsSent: notified,
  });
});
