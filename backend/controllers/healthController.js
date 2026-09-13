// controllers/healthController.js — Health Diary & Symptom Tracking
const { Symptom, User } = require('../models');
const { asyncHandler, createError } = require('../middleware');
const aiService = require('../services/aiService');
const PDFDocument = require('pdfkit');

/* ─── Log Symptoms ─── */
exports.logSymptoms = asyncHandler(async (req, res) => {
  const { symptoms, vitalSigns, notes } = req.body;

  let aiSummary = null;
  try {
    if (symptoms?.length || notes) {
      aiSummary = await aiService.summarizeSymptoms({ symptoms, vitalSigns, notes });
    }
  } catch (_) {}

  const log = await Symptom.create({
    userId: req.user._id,
    symptoms: Array.isArray(symptoms) ? symptoms : [],
    vitalSigns,
    notes,
    voiceNoteUrl: req.file ? `/uploads/${req.user._id}/${req.file.filename}` : undefined,
    aiSummary,
  });

  res.status(201).json({ success: true, message: 'Health log saved.', log });
});

/* ─── Get Health History ─── */
exports.getHealthHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, days } = req.query;
  const query = { userId: req.user._id };

  if (days) {
    const from = new Date();
    from.setDate(from.getDate() - parseInt(days));
    query.logDate = { $gte: from };
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Symptom.countDocuments(query);
  const logs  = await Symptom.find(query).sort({ logDate: -1 }).skip(skip).limit(parseInt(limit));

  res.json({ success: true, total, page: parseInt(page), logs });
});

/* ─── Get Single Log ─── */
exports.getLog = asyncHandler(async (req, res) => {
  const log = await Symptom.findOne({ _id: req.params.id, userId: req.user._id });
  if (!log) throw createError('Log not found.', 404);
  res.json({ success: true, log });
});

/* ─── Generate PDF Report ─── */
exports.generateReport = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const from = new Date();
  from.setDate(from.getDate() - parseInt(days));

  const [logs, user] = await Promise.all([
    Symptom.find({ userId: req.user._id, logDate: { $gte: from } }).sort({ logDate: 1 }),
    User.findById(req.user._id),
  ]);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="health-report-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(24).fillColor('#1e40af').text('CareSphere AI', { align: 'center' });
  doc.fontSize(16).fillColor('#1f2937').text('Health Report', { align: 'center' });
  doc.fontSize(10).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#1e40af');
  doc.moveDown();

  // Patient Info
  doc.fontSize(14).fillColor('#1e40af').text('Patient Information');
  doc.fontSize(11).fillColor('#1f2937');
  doc.text(`Name: ${user.name}`);
  doc.text(`Date of Birth: ${user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}`);
  doc.text(`Blood Group: ${user.bloodGroup || 'N/A'}`);
  doc.text(`Conditions: ${user.medicalConditions?.join(', ') || 'None'}`);
  doc.text(`Allergies: ${user.allergies?.join(', ') || 'None'}`);
  doc.moveDown();

  // Logs
  doc.fontSize(14).fillColor('#1e40af').text(`Health Logs — Last ${days} Days`);
  doc.moveDown(0.5);

  if (logs.length === 0) {
    doc.fontSize(11).fillColor('#6b7280').text('No health logs found for this period.');
  } else {
    logs.forEach((log, idx) => {
      doc.fontSize(12).fillColor('#1f2937').text(`${idx + 1}. ${new Date(log.logDate).toLocaleDateString()}`);
      if (log.symptoms?.length) {
        const s = log.symptoms.map(s => `${s.name} (severity: ${s.severity}/10)`).join(', ');
        doc.fontSize(10).fillColor('#374151').text(`   Symptoms: ${s}`);
      }
      if (log.vitalSigns) {
        const v = log.vitalSigns;
        const vitals = [];
        if (v.bloodPressureSystolic) vitals.push(`BP: ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
        if (v.heartRate)   vitals.push(`HR: ${v.heartRate} bpm`);
        if (v.temperature) vitals.push(`Temp: ${v.temperature}°F`);
        if (v.oxygenLevel) vitals.push(`O2: ${v.oxygenLevel}%`);
        if (vitals.length) doc.fontSize(10).fillColor('#374151').text(`   Vitals: ${vitals.join(' | ')}`);
      }
      if (log.notes) doc.fontSize(10).fillColor('#6b7280').text(`   Notes: ${log.notes}`);
      if (log.aiSummary) doc.fontSize(10).fillColor('#1d4ed8').text(`   AI Summary: ${log.aiSummary}`);
      doc.moveDown(0.5);
    });
  }

  doc.end();
});

/* ─── Vital Trends ─── */
exports.getVitalTrends = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = new Date(); from.setDate(from.getDate() - days);

  const logs = await Symptom.find({
    userId: req.user._id,
    logDate: { $gte: from },
    'vitalSigns': { $ne: null },
  }).sort({ logDate: 1 }).select('vitalSigns logDate');

  res.json({ success: true, trends: logs });
});
