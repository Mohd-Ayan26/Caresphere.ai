// routes/index.js — All CareSphere API Routes v2.0
const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { authLimiter, aiLimiter, upload } = require('../middleware');

const authCtrl         = require('../controllers/authController');
const medicineCtrl     = require('../controllers/medicineController');
const wellnessCtrl     = require('../controllers/wellnessController');
const nutritionCtrl    = require('../controllers/nutritionController');
const emergencyCtrl    = require('../controllers/emergencyController');
const healthCtrl       = require('../controllers/healthController');
const gamificationCtrl = require('../controllers/gamificationController');
const chatCtrl         = require('../controllers/chatController');
const aqiCtrl          = require('../controllers/aqiController');
const pathologyCtrl    = require('../controllers/pathologyController');
const healthGuideCtrl  = require('../controllers/healthGuideController');

// AUTH
const auth = express.Router();
auth.post('/register',       authLimiter, authCtrl.register);
auth.post('/login',          authLimiter, authCtrl.login);
auth.get('/profile',         authenticate, authCtrl.getProfile);
auth.put('/profile',         authenticate, upload.single('avatar'), authCtrl.updateProfile);
auth.put('/password',        authenticate, authCtrl.changePassword);
auth.post('/link-caregiver', authenticate, authCtrl.linkCaregiver);
auth.get('/dashboard',       authenticate, authCtrl.getDashboardStats);
auth.get('/users',           authenticate, authorize('admin'), authCtrl.getAllUsers);
router.use('/auth', auth);

// MEDICINES
const medicines = express.Router();
medicines.use(authenticate);
medicines.get('/',                        medicineCtrl.getMedicines);
medicines.post('/',                       upload.single('prescription'), medicineCtrl.addMedicine);
medicines.get('/reminders/today',         medicineCtrl.getTodayReminders);
medicines.get('/compliance',              medicineCtrl.getComplianceReport);
medicines.post('/scan',                   upload.single('prescription'), aiLimiter, medicineCtrl.scanPrescription);
medicines.post('/smart-scan',             upload.single('prescription'), aiLimiter, medicineCtrl.smartScanAndSchedule);
medicines.post('/lookup-info',             aiLimiter, medicineCtrl.lookupMedicineInfo);
medicines.put('/reminders/:id/status',    medicineCtrl.updateReminderStatus);
medicines.get('/:id/explain',             aiLimiter, medicineCtrl.explainMedicine);
medicines.get('/:id',                     medicineCtrl.getMedicine);
medicines.put('/:id',                     medicineCtrl.updateMedicine);
medicines.delete('/:id',                  medicineCtrl.deleteMedicine);
router.use('/medicines', medicines);

// WELLNESS
const wellness = express.Router();
wellness.use(authenticate);
wellness.post('/mood',              wellnessCtrl.logMood);
wellness.get('/mood',               wellnessCtrl.getMoodHistory);
wellness.get('/mood/history',       wellnessCtrl.getMoodHistory);
wellness.post('/journal',           wellnessCtrl.addJournal);
wellness.get('/journal',            wellnessCtrl.getJournals);
wellness.post('/meditation',        wellnessCtrl.logMeditation);
wellness.get('/stats',              wellnessCtrl.getWellnessStats);
wellness.get('/session/:type',      aiLimiter, wellnessCtrl.getWellnessSession);
wellness.get('/ai-summary',         aiLimiter, wellnessCtrl.getAISummary);
router.use('/wellness', wellness);

// NUTRITION
const nutrition = express.Router();
nutrition.use(authenticate);
nutrition.post('/meals',            upload.single('food'), nutritionCtrl.addMeal);
nutrition.get('/meals/today',       nutritionCtrl.getTodayNutrition);
nutrition.get('/meals/history',     nutritionCtrl.getNutritionHistory);
nutrition.post('/water',            nutritionCtrl.logWater);
nutrition.get('/water/today',       nutritionCtrl.getTodayWater);
nutrition.get('/diet-suggestions',  aiLimiter, nutritionCtrl.getDietSuggestions);
nutrition.post('/recognize-food',   upload.single('food'), aiLimiter, nutritionCtrl.recognizeFood);
nutrition.post('/estimate-calories',aiLimiter, nutritionCtrl.estimateCalories);
router.use('/nutrition', nutrition);

// EMERGENCY
const emergency = express.Router();
emergency.use(authenticate);
emergency.get('/contacts',          emergencyCtrl.getContacts);
emergency.post('/contacts',         emergencyCtrl.addContact);
emergency.put('/contacts/:id',      emergencyCtrl.updateContact);
emergency.delete('/contacts/:id',   emergencyCtrl.deleteContact);
emergency.post('/sos',              emergencyCtrl.triggerSOS);
emergency.get('/alerts',            emergencyCtrl.getAlerts);
emergency.put('/alerts/:id/resolve',emergencyCtrl.resolveAlert);
router.use('/emergency', emergency);

// HEALTH DIARY
const health = express.Router();
health.use(authenticate);
health.post('/log',           upload.single('voice'), healthCtrl.logSymptoms);
health.get('/logs',           healthCtrl.getHealthHistory);
health.get('/logs/:id',       healthCtrl.getLog);
health.get('/report',         healthCtrl.generateReport);
health.get('/vitals/trends',  healthCtrl.getVitalTrends);
router.use('/health', health);

// GAMIFICATION
const gamification = express.Router();
gamification.use(authenticate);
gamification.get('/progress',       gamificationCtrl.getProgress);
gamification.get('/challenges',     gamificationCtrl.getChallenges);
gamification.put('/challenges/:id', gamificationCtrl.updateChallenge);
gamification.get('/leaderboard',    gamificationCtrl.getLeaderboard);
gamification.post('/login-bonus',   gamificationCtrl.claimLoginBonus);
router.use('/gamification', gamification);

// CHAT
const chat = express.Router();
chat.use(authenticate);
chat.post('/',           aiLimiter, chatCtrl.sendMessage);
chat.post('/message',     aiLimiter, chatCtrl.sendMessage);
chat.get('/sessions',               chatCtrl.getSessions);
chat.get('/sessions/:id',           chatCtrl.getSession);
chat.delete('/sessions/:id',        chatCtrl.deleteSession);
chat.post('/quick',       aiLimiter, chatCtrl.quickQuestion);
router.use('/chat', chat);

// AQI & WEATHER (NEW)
const aqi = express.Router();
aqi.use(authenticate);
aqi.get('/',            aqiCtrl.getAQI);
aqi.post('/send-alert', aqiCtrl.sendAQIEmailAlert);
router.use('/aqi', aqi);

// PATHOLOGY SCANNER (NEW)
const pathology = express.Router();
pathology.use(authenticate);
pathology.post('/analyze',      upload.single('report'), aiLimiter, pathologyCtrl.analyzeReport);
pathology.post('/analyze-text', aiLimiter,               pathologyCtrl.analyzeText);
pathology.get('/',                                       pathologyCtrl.getReports);
pathology.get('/:id',                                    pathologyCtrl.getReport);
pathology.delete('/:id',                                 pathologyCtrl.deleteReport);
router.use('/pathology', pathology);

// HEALTH GUIDE (NEW)
const guide = express.Router();
guide.use(authenticate);
guide.get('/',              healthGuideCtrl.getDiseases);
guide.get('/personalized',  healthGuideCtrl.getPersonalizedGuide);
guide.get('/daily-tips',    aiLimiter, healthGuideCtrl.getDailyTips);
guide.get('/risk',          healthGuideCtrl.getRiskAssessment);
guide.get('/:id',           healthGuideCtrl.getDiseaseGuide);
router.use('/health-guide', guide);

router.get('/health', (_,res) => res.json({success:true,message:'CareSphere AI v2.0 🚀',timestamp:new Date()}));
module.exports = router;
