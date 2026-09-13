// controllers/wellnessController.js — Mood, Journal, Meditation
const { MoodLog, JournalEntry, Meditation, WellnessSession, User } = require('../models');
const { asyncHandler, createError } = require('../middleware');
const aiService = require('../services/aiService');

/* ─── Log Mood ─── */
exports.logMood = asyncHandler(async (req, res) => {
  const { mood, moodScore, emotions, note, activities, stressLevel, energyLevel, sleepHours } = req.body;
  if (!mood || !moodScore) throw createError('Mood and score required.');

  let aiAnalysis = null;
  if (note && note.length > 20) {
    try { aiAnalysis = await aiService.analyzeMood(note, mood); } catch (_) {}
  }

  const log = await MoodLog.create({
    userId: req.user._id, mood, moodScore, emotions, note,
    activities, stressLevel, energyLevel, sleepHours, aiAnalysis,
  });

  await awardXP(req.user._id, 5, 'Mood logged');
  res.status(201).json({ success: true, message: 'Mood logged.', log });
});

/* ─── Get Mood History ─── */
exports.getMoodHistory = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = new Date(); from.setDate(from.getDate() - days);

  const logs = await MoodLog.find({ userId: req.user._id, logDate: { $gte: from } })
    .sort({ logDate: -1 });

  const avgScore = logs.length
    ? (logs.reduce((s, l) => s + l.moodScore, 0) / logs.length).toFixed(1)
    : 0;

  res.json({ success: true, count: logs.length, avgScore, logs });
});

/* ─── Add Journal Entry ─── */
exports.addJournal = asyncHandler(async (req, res) => {
  const { title, content, mood, tags, isPrivate } = req.body;
  if (!content) throw createError('Journal content is required.');

  let aiInsights = null, sentiment = null, sentimentScore = null;
  try {
    const analysis = await aiService.analyzeJournal(content);
    aiInsights    = analysis.insights;
    sentiment     = analysis.sentiment;
    sentimentScore = analysis.score;
  } catch (_) {}

  const entry = await JournalEntry.create({
    userId: req.user._id, title, content, mood, tags,
    isPrivate: isPrivate !== false, aiInsights, sentiment, sentimentScore,
  });

  await awardXP(req.user._id, 8, 'Journal entry added');
  res.status(201).json({ success: true, message: 'Journal entry saved.', entry });
});

/* ─── Get Journal Entries ─── */
exports.getJournals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip  = (page - 1) * limit;
  const total = await JournalEntry.countDocuments({ userId: req.user._id });
  const entries = await JournalEntry.find({ userId: req.user._id })
    .sort({ entryDate: -1 }).skip(skip).limit(parseInt(limit));

  res.json({ success: true, total, page: parseInt(page), entries });
});

/* ─── Log Meditation Session ─── */
exports.logMeditation = asyncHandler(async (req, res) => {
  const { type, duration } = req.body;
  if (!type || !duration) throw createError('Type and duration required.');

  const session = await Meditation.create({ userId: req.user._id, type, duration });
  await awardXP(req.user._id, 15, 'Meditation completed');

  res.status(201).json({ success: true, message: 'Meditation session logged. +15 XP!', session });
});

/* ─── Wellness Stats ─── */
exports.getWellnessStats = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = new Date(); from.setDate(from.getDate() - days);

  const [moodLogs, journals, meditations] = await Promise.all([
    MoodLog.find({ userId: req.user._id, logDate: { $gte: from } }),
    JournalEntry.countDocuments({ userId: req.user._id, entryDate: { $gte: from } }),
    Meditation.find({ userId: req.user._id, completedAt: { $gte: from } }),
  ]);

  const totalMeditationMins = meditations.reduce((s, m) => s + m.duration, 0);
  const avgMood = moodLogs.length
    ? (moodLogs.reduce((s, l) => s + l.moodScore, 0) / moodLogs.length).toFixed(1)
    : 0;

  res.json({
    success: true,
    stats: {
      moodEntries: moodLogs.length, avgMoodScore: avgMood,
      journalEntries: journals,
      meditationSessions: meditations.length,
      totalMeditationMinutes: totalMeditationMins,
      moodTrend: moodLogs.slice(-7).map(l => ({ date: l.logDate, score: l.moodScore })),
    },
  });
});

async function awardXP(userId, amount) {
  try {
    const user = await User.findById(userId);
    user.xp += amount;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save({ validateBeforeSave: false });
  } catch (_) {}
}

/* ─── AI-Guided Wellness Session ─── */
exports.getWellnessSession = asyncHandler(async (req, res) => {
  const { type }     = req.params;
  const { duration } = req.query;
  const mins         = parseInt(duration) || 10;

  const validTypes = ['guided_meditation','mindfulness','sleep_meditation','breathing','stress_relief','relaxation'];
  if (!validTypes.includes(type)) throw createError(`Invalid session type. Choose: ${validTypes.join(', ')}`);

  const session = await aiService.getWellnessSession(type, mins, {
    name:       req.user.name,
    conditions: req.user.medicalConditions || [],
  });

  // Auto-log it with valid enum mapping
  let dbType = 'meditation';
  if (type === 'breathing') dbType = 'breathing';
  
  await WellnessSession.create({ userId: req.user._id, type: dbType, duration: mins });
  await awardXP(req.user._id, 15, `${type} session`);

  res.json({ success: true, type, duration: mins, session, xpAwarded: 15 });
});

/* ─── AI Wellness Summary ─── */
exports.getAISummary = asyncHandler(async (req, res) => {
  const moodLogs = await MoodLog.find({ userId: req.user._id })
    .sort({ logDate: -1 })
    .limit(7);

  const avgScore = moodLogs.length
    ? (moodLogs.reduce((s, l) => s + l.moodScore, 0) / moodLogs.length).toFixed(1)
    : 7.5;

  const latestMood = moodLogs[0]?.mood || 'peaceful';
  const userName   = req.user.name || 'User';

  let summaryText = `Hello ${userName}. Based on your recent assessments (${latestMood}, avg score ${avgScore}/10), your emotional balance is steady. Taking 5 minutes for guided breath awareness today will further release physical tension and enhance mental clarity.`;
  
  if (moodLogs.length === 0) {
    summaryText = `Hello ${userName}. Welcome to your Wellness Hub. Logging your daily mood and taking 5 minutes for a guided audio meditation each day will help maintain emotional stability and lower daily stress.`;
  }

  res.json({
    success: true,
    summary: {
      userName,
      latestMood,
      avgScore,
      analysis: summaryText,
      recommendation: "Listen to the 5-Min Inner Calm Meditation or 5-Min Stress Release audio session today.",
      updatedAt: new Date().toISOString()
    }
  });
});
