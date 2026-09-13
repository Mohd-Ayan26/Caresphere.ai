// controllers/chatController.js — AI Chatbot with Groq API
const { ChatHistory } = require('../models');
const { asyncHandler, createError } = require('../middleware');
const aiService = require('../services/aiService');

/* ─── Send Message ─── */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId, language } = req.body;
  if (!message?.trim()) throw createError('Message cannot be empty.');

  // Get or create chat session
  let session;
  if (sessionId) {
    session = await ChatHistory.findOne({ _id: sessionId, userId: req.user._id });
  }

  if (!session) {
    session = await ChatHistory.create({
      userId: req.user._id,
      messages: [],
      sessionTitle: message.slice(0, 50),
      language: language || req.user.preferredLanguage || 'en',
    });
  }

  // Add user message
  session.messages.push({ role: 'user', content: message });

  // Build context from recent messages (last 10)
  const history = session.messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

  // Get AI response
  const userContext = {
    name:       req.user.name,
    conditions: req.user.medicalConditions || [],
    allergies:  req.user.allergies         || [],
    medicines:  req.user.currentMedications || [],
    language:   language || req.user.preferredLanguage || 'en',
  };

  const aiResponse = await aiService.chat(history, userContext);

  // Add AI response to session
  session.messages.push({ role: 'assistant', content: aiResponse });
  await session.save();

  res.json({
    success: true,
    response: aiResponse,
    reply: aiResponse,
    sessionId: session._id,
    messageCount: session.messages.length,
  });
});

/* ─── Get Chat Sessions ─── */
exports.getSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatHistory.find({ userId: req.user._id, isActive: true })
    .select('sessionTitle language createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(20);

  res.json({ success: true, sessions });
});

/* ─── Get Session Messages ─── */
exports.getSession = asyncHandler(async (req, res) => {
  const session = await ChatHistory.findOne({ _id: req.params.id, userId: req.user._id });
  if (!session) throw createError('Chat session not found.', 404);
  res.json({ success: true, session });
});

/* ─── Delete Session ─── */
exports.deleteSession = asyncHandler(async (req, res) => {
  await ChatHistory.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isActive: false }
  );
  res.json({ success: true, message: 'Chat session deleted.' });
});

/* ─── Quick Health Question (no session) ─── */
exports.quickQuestion = asyncHandler(async (req, res) => {
  const { question, language } = req.body;
  if (!question?.trim()) throw createError('Question is required.');

  const userContext = {
    name: req.user.name,
    conditions: req.user.medicalConditions || [],
    allergies:  req.user.allergies         || [],
    language:   language || req.user.preferredLanguage || 'en',
  };

  const answer = await aiService.chat([{ role: 'user', content: question }], userContext);
  res.json({ success: true, answer });
});
