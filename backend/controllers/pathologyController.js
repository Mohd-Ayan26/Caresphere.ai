// controllers/pathologyController.js — Pathology Report OCR + AI Analysis
const { asyncHandler, createError } = require('../middleware');
const aiService = require('../services/aiService');
const { sendPathologyAlert } = require('../services/notificationService');
const mongoose = require('mongoose');

/* ─── Pathology Report Schema (inline) ─── */
const PathologyReport = mongoose.models.PathologyReport || mongoose.model('PathologyReport', new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl:    { type: String },
  rawText:     { type: String },
  values:      [{ name: String, value: String, unit: String, normalRange: String, status: { type: String, enum: ['normal','high','low','critical'] }, interpretation: String }],
  summary:     { type: String },
  riskLevel:   { type: String, enum: ['low','moderate','high','critical'], default: 'low' },
  abnormalValues: [String],
  recommendations: [String],
  aiInsights:  { type: String },
  reportDate:  { type: Date, default: Date.now },
  reportType:  { type: String },
}, { timestamps: true }));

/* ─── Upload & Analyze Report ─── */
exports.analyzeReport = asyncHandler(async (req, res) => {
  if (!req.file) throw createError('Please upload a pathology report image or PDF.');

  const imagePath = req.file.path;
  const imageUrl  = `/uploads/${req.user._id}/${req.file.filename}`;

  // PDF text extraction fallback
  let ocrText = req.body.rawText || '';
  if (!ocrText && imagePath.toLowerCase().endsWith('.pdf')) {
    try {
      const fs = require('fs');
      const buf = fs.readFileSync(imagePath);
      const str = buf.toString('utf8').replace(/[^\x20-\x7E]/g, ' ').trim();
      if (str.length > 30) ocrText = str.slice(0, 4000);
    } catch (_) {}
  }

  // AI analysis via Groq + Tesseract local OCR
  const analysis = await aiService.analyzePathologyReport(ocrText, req.user, imagePath);

  // Save to DB
  const report = await PathologyReport.create({
    userId:          req.user._id,
    imageUrl,
    rawText:         analysis.ocrText || ocrText || 'Pathology report scanned successfully.',
    values:          analysis.values        || [],
    summary:         analysis.summary       || '',
    riskLevel:       analysis.riskLevel     || 'low',
    abnormalValues:  analysis.abnormalValues || [],
    recommendations: analysis.recommendations || [],
    aiInsights:      analysis.insights      || '',
    reportType:      analysis.reportType    || 'Blood Test',
  });

  // Step 4: Send email alert if abnormal values found
  if (report.abnormalValues.length > 0 && req.user.email) {
    sendPathologyAlert(req.user, {
      summary:         report.summary,
      abnormalValues:  report.abnormalValues,
      recommendations: report.recommendations,
    }).catch(e => console.error('Pathology email error:', e.message));
  }

  res.status(201).json({
    success: true,
    message:   `Report analyzed. ${report.abnormalValues.length} abnormal value(s) found.`,
    report,
    hasAbnormals: report.abnormalValues.length > 0,
  });
});

/* ─── Get Report History ─── */
exports.getReports = asyncHandler(async (req, res) => {
  const reports = await PathologyReport.find({ userId: req.user._id })
    .sort({ reportDate: -1 }).limit(20);
  res.json({ success: true, count: reports.length, reports });
});

/* ─── Get Single Report ─── */
exports.getReport = asyncHandler(async (req, res) => {
  const report = await PathologyReport.findOne({ _id: req.params.id, userId: req.user._id });
  if (!report) throw createError('Report not found.', 404);
  res.json({ success: true, report });
});

/* ─── Delete Report ─── */
exports.deleteReport = asyncHandler(async (req, res) => {
  await PathologyReport.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true, message: 'Report deleted.' });
});

/* ─── Analyze Raw Text (manual entry) ─── */
exports.analyzeText = asyncHandler(async (req, res) => {
  const { text, reportType } = req.body;
  if (!text?.trim()) throw createError('Report text is required.');

  const analysis = await aiService.analyzePathologyReport(text, req.user);

  const report = await PathologyReport.create({
    userId:          req.user._id,
    rawText:         text,
    values:          analysis.values        || [],
    summary:         analysis.summary       || '',
    riskLevel:       analysis.riskLevel     || 'low',
    abnormalValues:  analysis.abnormalValues || [],
    recommendations: analysis.recommendations || [],
    aiInsights:      analysis.insights      || '',
    reportType:      reportType || analysis.reportType || 'Blood Test',
  });

  res.status(201).json({ success: true, report });
});
