// controllers/authController.js — Authentication & User Management
const { User, CaregiverLink } = require('../models');
const { generateToken }       = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware');

/* ─── Register ─── */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, dateOfBirth, gender } = req.body;

  if (!name || !email || !password) throw createError('Name, email and password are required.');
  if (password.length < 6) throw createError('Password must be at least 6 characters.');

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw createError('Email already registered.', 409);

  const user = await User.create({ name, email, password, role: role || 'elderly', phone, dateOfBirth, gender });
  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: user.toPublicJSON(),
  });
});

/* ─── Login ─── */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw createError('Email and password are required.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw createError('Invalid credentials.', 401);
  if (!user.isActive) throw createError('Account has been deactivated.', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw createError('Invalid credentials.', 401);

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: user.toPublicJSON(),
  });
});

/* ─── Get Profile ─── */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('linkedCaregivers', 'name email phone role avatar')
    .populate('linkedPatients',   'name email phone role avatar');

  res.json({ success: true, user: user.toPublicJSON() });
});

/* ─── Update Profile ─── */
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'phone', 'dateOfBirth', 'gender', 'bloodGroup',
    'address', 'emergencyContact', 'medicalConditions', 'allergies',
    'currentMedications', 'preferredLanguage', 'accessibilitySettings',
  ];

  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.file) updates.avatar = `/uploads/${req.user._id}/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated.', user: user.toPublicJSON() });
});

/* ─── Change Password ─── */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw createError('Both passwords required.');
  if (newPassword.length < 6) throw createError('New password must be at least 6 characters.');

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw createError('Current password is incorrect.', 401);

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully.' });
});

/* ─── Link Caregiver ─── */
exports.linkCaregiver = asyncHandler(async (req, res) => {
  const { caregiverEmail, permissions } = req.body;
  if (!caregiverEmail) throw createError('Caregiver email is required.');

  const caregiver = await User.findOne({ email: caregiverEmail.toLowerCase(), role: 'caregiver' });
  if (!caregiver) throw createError('Caregiver not found with this email.', 404);
  if (caregiver._id.equals(req.user._id)) throw createError('Cannot link yourself.');

  const existing = await CaregiverLink.findOne({ caregiverId: caregiver._id, patientId: req.user._id });
  if (existing) throw createError('Caregiver already linked.', 409);

  const link = await CaregiverLink.create({
    caregiverId: caregiver._id,
    patientId:   req.user._id,
    permissions: permissions || {},
  });

  // Update both users
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { linkedCaregivers: caregiver._id } });
  await User.findByIdAndUpdate(caregiver._id, { $addToSet: { linkedPatients: req.user._id } });

  res.status(201).json({ success: true, message: 'Caregiver linked successfully.', link });
});

/* ─── Get All Users (Admin) ─── */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (role)   query.role  = role;
  if (search) query.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip  = (page - 1) * limit;
  const total = await User.countDocuments(query);
  const users = await User.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

  res.json({ success: true, total, page: parseInt(page), users: users.map(u => u.toPublicJSON()) });
});

/* ─── Dashboard Stats (for any role) ─── */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { Medicine, MoodLog, Reminder, Achievement } = require('../models');
  const userId = req.user._id;
  const today  = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const [medicines, todayMoods, todayReminders, achievements] = await Promise.all([
    Medicine.countDocuments({ userId, isActive: true }),
    MoodLog.find({ userId, logDate: { $gte: today, $lt: tomorrow } }),
    Reminder.find({ userId, scheduledTime: { $gte: today, $lt: tomorrow } }),
    Achievement.find({ userId }).sort({ earnedAt: -1 }).limit(5),
  ]);

  const taken  = todayReminders.filter(r => r.status === 'taken').length;
  const missed = todayReminders.filter(r => r.status === 'missed').length;
  const avgMood = todayMoods.length
    ? (todayMoods.reduce((s, m) => s + m.moodScore, 0) / todayMoods.length).toFixed(1)
    : null;

  res.json({
    success: true,
    stats: {
      activeMedicines: medicines,
      todayReminders:  todayReminders.length,
      taken, missed,
      complianceRate:  todayReminders.length ? Math.round((taken / todayReminders.length) * 100) : 0,
      avgMoodScore:    avgMood,
      xp:              req.user.xp,
      level:           req.user.level,
      streak:          req.user.streak,
      recentAchievements: achievements,
    },
  });
});

// Patch register to send welcome email
const _originalRegister = exports.register;
exports.register = require('../middleware').asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, dateOfBirth, gender } = req.body;
  if (!name || !email || !password) throw require('../middleware').createError('Name, email and password are required.');
  if (password.length < 6) throw require('../middleware').createError('Password must be at least 6 characters.');
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw require('../middleware').createError('Email already registered.', 409);
  const user = await User.create({ name, email, password, role: role||'elderly', phone, dateOfBirth, gender });
  const token = generateToken(user._id, user.role);
  // Send welcome email (non-blocking)
  try {
    const { sendWelcomeEmail } = require('../services/notificationService');
    sendWelcomeEmail(user).catch(e => console.error('Welcome email error:', e.message));
  } catch(_) {}
  res.status(201).json({ success:true, message:'Account created successfully.', token, user: user.toPublicJSON() });
});
