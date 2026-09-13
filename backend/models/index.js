// models/index.js — All CareSphere MongoDB Schemas
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

/* ─────────────────────────────────────────────
   USER MODEL
───────────────────────────────────────────── */
const userSchema = new Schema({
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6, select: false },
  phone:       { type: String, trim: true },
  role:        { type: String, enum: ['elderly', 'caregiver', 'doctor', 'admin'], default: 'elderly' },
  avatar:      { type: String, default: '' },
  dateOfBirth: { type: Date },
  gender:      { type: String, enum: ['male', 'female', 'other', ''] },
  bloodGroup:  { type: String, enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-',''] },
  address:     { type: String },
  emergencyContact: {
    name:  { type: String },
    phone: { type: String },
    relation: { type: String }
  },
  medicalConditions: [String],
  allergies:         [String],
  currentMedications:[String],
  preferredLanguage: { type: String, default: 'en' },
  accessibilitySettings: {
    highContrast:  { type: Boolean, default: false },
    largeFont:     { type: Boolean, default: false },
    voiceEnabled:  { type: Boolean, default: true },
    darkMode:      { type: Boolean, default: false },
  },
  linkedCaregivers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  linkedPatients:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isVerified:    { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  lastLogin:     { type: Date },
  xp:            { type: Number, default: 0 },
  level:         { type: Number, default: 1 },
  streak:        { type: Number, default: 0 },
  lastStreakDate: { type: Date },
  lastLoginBonusClaimedAt: { type: Date },
}, { timestamps: true });

userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

/* ─────────────────────────────────────────────
   MEDICINE MODEL
───────────────────────────────────────────── */
const medicineSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true, trim: true },
  genericName: { type: String },
  dosage:      { type: String, required: true },
  unit:        { type: String, enum: ['mg', 'ml', 'tablets', 'capsules', 'drops', 'units'], default: 'mg' },
  frequency:   { type: String, required: true },
  times:       [String],
  startDate:   { type: Date, required: true },
  endDate:     { type: Date },
  prescribedBy:{ type: String },
  instructions:{ type: String },
  uses:        { type: String },
  negativeSymptoms: { type: String },
  sideEffects: [String],
  category:    { type: String },
  color:       { type: String, default: '#3B82F6' },
  isActive:    { type: Boolean, default: true },
  refillDate:  { type: Date },
  quantity:    { type: Number, default: 0 },
  prescriptionImageUrl: { type: String },
  ocrExtracted:{ type: Boolean, default: false },
}, { timestamps: true });

medicineSchema.index({ userId: 1, isActive: 1 });

/* ─────────────────────────────────────────────
   REMINDER MODEL
───────────────────────────────────────────── */
const reminderSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  medicineId:  { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  scheduledTime: { type: Date, required: true },
  status:      { type: String, enum: ['pending', 'taken', 'missed', 'snoozed'], default: 'pending' },
  takenAt:     { type: Date },
  snoozedUntil:{ type: Date },
  notificationSent: { type: Boolean, default: false },
}, { timestamps: true });

reminderSchema.index({ userId: 1, scheduledTime: 1, status: 1 });

/* ─────────────────────────────────────────────
   MOOD LOG MODEL
───────────────────────────────────────────── */
const moodLogSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mood:      { type: String, enum: ['great', 'good', 'okay', 'sad', 'terrible'], required: true },
  moodScore: { type: Number, min: 1, max: 10, required: true },
  emotions:  [String],
  note:      { type: String, maxlength: 500 },
  activities:[String],
  triggers:  [String],
  aiAnalysis:{ type: String },
  stressLevel:{ type: Number, min: 0, max: 10 },
  energyLevel:{ type: Number, min: 0, max: 10 },
  sleepHours: { type: Number },
  logDate:   { type: Date, default: Date.now },
}, { timestamps: true });

moodLogSchema.index({ userId: 1, logDate: -1 });

/* ─────────────────────────────────────────────
   JOURNAL ENTRY MODEL
───────────────────────────────────────────── */
const journalSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, maxlength: 200 },
  content:    { type: String, required: true, maxlength: 5000 },
  mood:       { type: String },
  tags:       [String],
  isPrivate:  { type: Boolean, default: true },
  aiInsights: { type: String },
  sentiment:  { type: String, enum: ['positive', 'negative', 'neutral'] },
  sentimentScore: { type: Number },
  entryDate:  { type: Date, default: Date.now },
}, { timestamps: true });

journalSchema.index({ userId: 1, entryDate: -1 });

/* ─────────────────────────────────────────────
   MEAL / NUTRITION MODEL
───────────────────────────────────────────── */
const mealSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mealType:  { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  name:      { type: String, required: true },
  foods:     [{
    name:     String,
    quantity: Number,
    unit:     String,
    calories: Number,
    protein:  Number,
    carbs:    Number,
    fat:      Number,
    fiber:    Number,
  }],
  totalCalories: { type: Number, default: 0 },
  totalProtein:  { type: Number, default: 0 },
  totalCarbs:    { type: Number, default: 0 },
  totalFat:      { type: Number, default: 0 },
  imageUrl:      { type: String },
  aiDetected:    { type: Boolean, default: false },
  notes:         { type: String },
  mealDate:      { type: Date, default: Date.now },
}, { timestamps: true });

mealSchema.index({ userId: 1, mealDate: -1 });

/* ─────────────────────────────────────────────
   WATER LOG MODEL
───────────────────────────────────────────── */
const waterLogSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount:    { type: Number, required: true },
  unit:      { type: String, default: 'ml' },
  logDate:   { type: Date, default: Date.now },
}, { timestamps: true });

/* ─────────────────────────────────────────────
   EMERGENCY CONTACT MODEL
───────────────────────────────────────────── */
const emergencyContactSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true },
  phone:    { type: String, required: true },
  relation: { type: String, required: true },
  email:    { type: String },
  isPrimary:{ type: Boolean, default: false },
  isDoctor: { type: Boolean, default: false },
  notes:    { type: String },
}, { timestamps: true });

/* ─────────────────────────────────────────────
   EMERGENCY ALERT MODEL
───────────────────────────────────────────── */
const emergencyAlertSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['sos', 'fall', 'medical', 'location'], required: true },
  status:    { type: String, enum: ['active', 'resolved', 'false_alarm'], default: 'active' },
  location:  {
    lat:     Number,
    lng:     Number,
    address: String,
  },
  message:   { type: String },
  resolvedAt:{ type: Date },
  resolvedBy:{ type: Schema.Types.ObjectId, ref: 'User' },
  notifiedContacts: [String],
}, { timestamps: true });

emergencyAlertSchema.index({ userId: 1, status: 1 });

/* ─────────────────────────────────────────────
   SYMPTOM / HEALTH DIARY MODEL
───────────────────────────────────────────── */
const symptomSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms:  [{ name: String, severity: { type: Number, min: 1, max: 10 }, duration: String }],
  vitalSigns: {
    bloodPressureSystolic:  Number,
    bloodPressureDiastolic: Number,
    heartRate:   Number,
    temperature: Number,
    oxygenLevel: Number,
    weight:      Number,
    bloodSugar:  Number,
  },
  notes:      { type: String, maxlength: 2000 },
  voiceNoteUrl:{ type: String },
  aiSummary:  { type: String },
  logDate:    { type: Date, default: Date.now },
}, { timestamps: true });

symptomSchema.index({ userId: 1, logDate: -1 });

/* ─────────────────────────────────────────────
   GAMIFICATION — ACHIEVEMENT MODEL
───────────────────────────────────────────── */
const achievementSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, required: true },
  title:     { type: String, required: true },
  description:{ type: String },
  xpAwarded: { type: Number, default: 0 },
  badge:     { type: String },
  earnedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

/* ─────────────────────────────────────────────
   CHALLENGE MODEL
───────────────────────────────────────────── */
const challengeSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:       { type: String, enum: ['daily', 'weekly', 'special'], required: true },
  title:      { type: String, required: true },
  description:{ type: String },
  target:     { type: Number, required: true },
  current:    { type: Number, default: 0 },
  xpReward:   { type: Number, default: 10 },
  status:     { type: String, enum: ['active', 'completed', 'expired'], default: 'active' },
  expiresAt:  { type: Date, required: true },
  completedAt:{ type: Date },
}, { timestamps: true });

/* ─────────────────────────────────────────────
   CHAT HISTORY MODEL
───────────────────────────────────────────── */
const chatHistorySchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{
    role:      { type: String, enum: ['user', 'assistant'], required: true },
    content:   { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isVoice:   { type: Boolean, default: false },
  }],
  sessionTitle: { type: String },
  language:     { type: String, default: 'en' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

chatHistorySchema.index({ userId: 1, updatedAt: -1 });

/* ─────────────────────────────────────────────
   MEDITATION SESSION MODEL
───────────────────────────────────────────── */
const meditationSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['guided', 'breathing', 'mindfulness', 'sleep'], required: true },
  duration:    { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
  xpAwarded:   { type: Number, default: 15 },
}, { timestamps: true });

/* ─────────────────────────────────────────────
   CAREGIVER LINK MODEL
───────────────────────────────────────────── */
const caregiverLinkSchema = new Schema({
  caregiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  patientId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' },
  permissions: {
    viewMedicines:  { type: Boolean, default: true },
    viewHealth:     { type: Boolean, default: true },
    viewLocation:   { type: Boolean, default: false },
    receiveAlerts:  { type: Boolean, default: true },
  },
  acceptedAt: { type: Date },
}, { timestamps: true });

caregiverLinkSchema.index({ caregiverId: 1, patientId: 1 }, { unique: true });

/* ─────────────────────────────────────────────
   WELLNESS SESSION MODEL
───────────────────────────────────────────── */
const wellnessSessionSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['meditation', 'guided', 'guided_meditation', 'breathing', 'mindfulness', 'sleep_meditation', 'stress_relief', 'relaxation', 'exercise', 'journaling'], default: 'meditation' },
  duration: { type: Number },
  notes:    { type: String },
  date:     { type: Date, default: Date.now },
}, { timestamps: true });

/* ─────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────── */
module.exports = {
  User:              mongoose.model('User', userSchema),
  Medicine:          mongoose.model('Medicine', medicineSchema),
  Reminder:          mongoose.model('Reminder', reminderSchema),
  MoodLog:           mongoose.model('MoodLog', moodLogSchema),
  JournalEntry:      mongoose.model('JournalEntry', journalSchema),
  Meal:              mongoose.model('Meal', mealSchema),
  WaterLog:          mongoose.model('WaterLog', waterLogSchema),
  EmergencyContact:  mongoose.model('EmergencyContact', emergencyContactSchema),
  EmergencyAlert:    mongoose.model('EmergencyAlert', emergencyAlertSchema),
  Symptom:           mongoose.model('Symptom', symptomSchema),
  Achievement:       mongoose.model('Achievement', achievementSchema),
  Challenge:         mongoose.model('Challenge', challengeSchema),
  ChatHistory:       mongoose.model('ChatHistory', chatHistorySchema),
  Meditation:        mongoose.model('Meditation', meditationSchema),
  CaregiverLink:     mongoose.model('CaregiverLink', caregiverLinkSchema),
  WellnessSession:   mongoose.model('WellnessSession', wellnessSessionSchema),
};
