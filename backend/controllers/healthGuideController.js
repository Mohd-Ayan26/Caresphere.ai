// controllers/healthGuideController.js — Disease-Based Health Guide
const { asyncHandler, createError } = require('../middleware');
const aiService = require('../services/aiService');

const DISEASES = {
  diabetes: {
    name:  'Diabetes (Type 2)',
    icon:  '🩸',
    color: '#3b82f6',
    riskFactors:  ['High blood sugar', 'Insulin resistance', 'Obesity', 'Sedentary lifestyle'],
    vitalsToWatch:['Fasting blood glucose (70–100 mg/dL)', 'HbA1c (below 5.7%)', 'Blood pressure', 'Cholesterol'],
    eatFoods:     ['Leafy greens (spinach, kale)', 'Whole grains (oats, quinoa)', 'Legumes (lentils, chickpeas)', 'Berries (blueberries, strawberries)', 'Fatty fish (salmon, mackerel)', 'Nuts and seeds', 'Avocado', 'Greek yogurt (unsweetened)'],
    avoidFoods:   ['White bread and white rice', 'Sugary drinks (soda, juice)', 'Processed snacks', 'Candy and sweets', 'Fried foods', 'Full-fat dairy (limit)', 'Alcohol', 'High-sodium foods'],
    exercises:    ['Walking 30 min/day', 'Swimming or water aerobics', 'Yoga or tai chi', 'Light resistance training', 'Chair exercises for elderly'],
    tips:         ['Check blood sugar twice daily', 'Take medications as prescribed', 'Eat at regular meal times', 'Wear diabetic footwear', 'Get regular eye exams', 'Stay hydrated (8 glasses/day)', 'Monitor feet for sores'],
    warning:      'If blood glucose exceeds 300 mg/dL or drops below 70 mg/dL, seek immediate medical care.',
  },
  hypertension: {
    name:  'High Blood Pressure (Hypertension)',
    icon:  '💓',
    color: '#ef4444',
    riskFactors:  ['High sodium diet', 'Stress', 'Obesity', 'Lack of exercise', 'Family history'],
    vitalsToWatch:['Blood pressure (below 120/80 mmHg)', 'Heart rate (60–100 bpm)', 'Weight'],
    eatFoods:     ['DASH diet foods', 'Bananas (potassium-rich)', 'Leafy greens', 'Berries', 'Beets', 'Oatmeal', 'Low-fat dairy', 'Garlic', 'Olive oil'],
    avoidFoods:   ['Table salt (limit to 1500mg/day)', 'Processed and canned foods', 'Red meat', 'Alcohol (limit)', 'Caffeine (limit)', 'Pickled foods', 'Full-fat cheese'],
    exercises:    ['Brisk walking 30 min/day', 'Swimming', 'Cycling', 'Yoga and deep breathing', 'Avoid heavy weightlifting'],
    tips:         ['Check BP twice daily', 'Take medications at same time daily', 'Manage stress with meditation', 'Maintain healthy weight', 'Quit smoking', 'Limit alcohol', 'Get adequate sleep (7–9 hrs)'],
    warning:      'Seek immediate care if BP exceeds 180/120 mmHg (hypertensive crisis).',
  },
  heart_disease: {
    name:  'Heart Disease',
    icon:  '❤️',
    color: '#dc2626',
    riskFactors:  ['High cholesterol', 'Hypertension', 'Diabetes', 'Smoking', 'Obesity', 'Family history'],
    vitalsToWatch:['Blood pressure', 'Cholesterol (Total below 200)', 'Heart rate', 'Oxygen levels (above 95%)'],
    eatFoods:     ['Omega-3 rich fish', 'Walnuts and almonds', 'Olive oil', 'Whole grains', 'Fruits and vegetables', 'Legumes', 'Low-fat proteins'],
    avoidFoods:   ['Trans fats (fried foods)', 'Saturated fats (red meat)', 'High-sodium foods', 'Sugary foods', 'Alcohol', 'Caffeine (limit)', 'Processed meats'],
    exercises:    ['Cardiac rehab walking', 'Light swimming', 'Yoga (gentle)', 'Stationary cycling', 'Breathing exercises — NO strenuous activity without doctor approval'],
    tips:         ['Take heart medications daily', 'Monitor pulse regularly', 'Avoid emotional stress', 'Sleep on your left side', 'Know CPR warning signs', 'Keep nitroglycerine handy if prescribed', 'Regular cardiologist visits'],
    warning:      'Call 911 for chest pain, left arm pain, or sudden shortness of breath.',
  },
  arthritis: {
    name:  'Arthritis',
    icon:  '🦴',
    color: '#8b5cf6',
    riskFactors:  ['Age over 65', 'Overweight', 'Previous joint injury', 'Female gender', 'Genetics'],
    vitalsToWatch:['Joint pain scale (1–10)', 'Morning stiffness duration', 'Range of motion'],
    eatFoods:     ['Fatty fish (anti-inflammatory)', 'Turmeric (curcumin)', 'Ginger', 'Berries', 'Broccoli', 'Walnuts', 'Olive oil', 'Low-fat dairy (calcium)'],
    avoidFoods:   ['Red meat (limit)', 'Refined carbohydrates', 'Fried foods', 'Sugary beverages', 'Alcohol', 'Gluten (if sensitive)', 'Nightshade vegetables (some patients)'],
    exercises:    ['Water aerobics (joint-friendly)', 'Tai chi', 'Gentle yoga', 'Range-of-motion exercises', 'Walking on soft surfaces', 'Avoid high-impact activities'],
    tips:         ['Apply warm compresses for stiffness', 'Use cold packs for acute pain', 'Rest painful joints', 'Use assistive devices', 'Maintain healthy weight', 'Physical therapy', 'Proper footwear'],
    warning:      'Seek care if joints become very swollen, warm, or red, or if you develop fever.',
  },
  asthma: {
    name:  'Asthma / COPD',
    icon:  '🫁',
    color: '#06b6d4',
    riskFactors:  ['Smoking', 'Air pollution', 'Allergens', 'Respiratory infections', 'Cold air'],
    vitalsToWatch:['Oxygen saturation (above 95%)', 'Peak flow meter readings', 'Breathing rate (12–20/min)'],
    eatFoods:     ['Vitamin D-rich foods', 'Apple (quercetin)', 'Ginger (anti-inflammatory)', 'Turmeric', 'Tomatoes (lycopene)', 'Bananas', 'Magnesium-rich foods'],
    avoidFoods:   ['Sulfite-containing foods (wine, dried fruits)', 'Processed meats', 'Dairy if sensitive', 'Eggs if allergic', 'Peanuts if allergic', 'Salt (limit)'],
    exercises:    ['Swimming (excellent for asthma)', 'Walking in clean air', 'Pursed-lip breathing exercises', 'Diaphragmatic breathing', 'Yoga (breathing focus)', 'Avoid cold weather exercise'],
    tips:         ['Always carry rescue inhaler', 'Know your triggers', 'Use air purifier indoors', 'Avoid smoke and strong odors', 'Check AQI before going outside', 'Get flu vaccine annually', 'Keep home dust-free'],
    warning:      'Seek emergency care if inhaler provides no relief or oxygen drops below 90%.',
  },
  osteoporosis: {
    name:  'Osteoporosis',
    icon:  '🦷',
    color: '#f59e0b',
    riskFactors:  ['Post-menopause', 'Low calcium intake', 'Vitamin D deficiency', 'Sedentary lifestyle'],
    vitalsToWatch:['Bone density (DEXA scan annually)', 'Calcium levels', 'Vitamin D levels'],
    eatFoods:     ['Dairy (milk, yogurt, cheese)', 'Sardines and salmon (bones)', 'Leafy greens (kale, bok choy)', 'Fortified cereals', 'Almonds', 'Beans and lentils', 'Tofu (calcium-set)'],
    avoidFoods:   ['Excessive caffeine', 'Alcohol', 'High sodium foods', 'Soft drinks (phosphoric acid)', 'Excessive protein', 'Vitamin A supplements (excess)'],
    exercises:    ['Weight-bearing walking', 'Stair climbing (carefully)', 'Strength training (light)', 'Balance exercises (reduce fall risk)', 'Tai chi', 'Yoga (modified)'],
    tips:         ['Take calcium (1200mg) + Vitamin D3 (800–1000 IU) daily', 'Fall-proof your home', 'Use non-slip mats', 'Good lighting everywhere', 'Hip protectors if at risk', 'Regular DEXA scans', 'Bisphosphonate medications if prescribed'],
    warning:      'Seek care immediately after any fall. Hip fractures are serious in elderly.',
  },
};

/* ─── Get All Diseases ─── */
exports.getDiseases = asyncHandler(async (req, res) => {
  const list = Object.entries(DISEASES).map(([id, d]) => ({
    id, name: d.name, icon: d.icon, color: d.color,
    vitalsCount: d.vitalsToWatch.length,
    tipsCount:   d.tips.length,
  }));
  res.json({ success: true, diseases: list });
});

/* ─── Get Disease Guide ─── */
exports.getDiseaseGuide = asyncHandler(async (req, res) => {
  const id = req.params.id?.toLowerCase().replace('-', '_');
  const guide = DISEASES[id];
  if (!guide) throw createError(`Guide for "${req.params.id}" not found.`, 404);
  res.json({ success: true, id, guide });
});

/* ─── Personalized Guide based on user's conditions ─── */
exports.getPersonalizedGuide = asyncHandler(async (req, res) => {
  const conditions = req.user.medicalConditions || [];
  if (conditions.length === 0) {
    return res.json({ success: true, guides: [], message: 'No medical conditions set in your profile. Update your profile to get personalized guides.' });
  }

  const guides = [];
  for (const condition of conditions) {
    const key = Object.keys(DISEASES).find(k =>
      condition.toLowerCase().includes(k.replace('_', ' '))
      || k.replace('_', ' ').includes(condition.toLowerCase().slice(0, 6))
    );
    if (key) guides.push({ id: key, ...DISEASES[key] });
  }

  res.json({ success: true, conditions, guides });
});

/* ─── AI-Powered Daily Health Tips ─── */
exports.getDailyTips = asyncHandler(async (req, res) => {
  const { disease } = req.query;
  const conditions  = req.user.medicalConditions || [];
  const target      = disease || conditions[0] || 'general elderly health';

  try {
    const tips = await aiService.getDailyHealthTips(target, req.user);
    res.json({ success: true, disease: target, tips });
  } catch (e) {
    // Fallback static tips
    res.json({
      success: true,
      disease: target,
      tips: [
        '💊 Take all medications on schedule — consistency is key.',
        '🚶 Walk for 15–30 minutes daily if weather permits.',
        '💧 Drink 8 glasses of water throughout the day.',
        '🧘 Practice 5 minutes of deep breathing after waking up.',
        '🥗 Eat a rainbow of vegetables for balanced nutrition.',
        '😴 Aim for 7–8 hours of quality sleep.',
        '🤝 Stay socially connected — call a friend or family member.',
        '📋 Keep a health diary to track symptoms and vitals.',
      ],
    });
  }
});

/* ─── Get Risk Assessment ─── */
exports.getRiskAssessment = asyncHandler(async (req, res) => {
  const conditions = req.user.medicalConditions || [];
  const age = req.user.dateOfBirth
    ? Math.floor((Date.now() - new Date(req.user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const riskFactors   = [];
  const recommendations = [];
  let   overallRisk   = 'low';

  if (age && age >= 70)           { riskFactors.push('Age 70+');      overallRisk = 'moderate'; }
  if (conditions.length >= 3)     { riskFactors.push('Multiple conditions'); overallRisk = 'high'; }
  if (conditions.includes('Heart Disease')) { riskFactors.push('Cardiac risk'); overallRisk = 'high'; }
  if (conditions.includes('Diabetes') && conditions.includes('Hypertension'))
                                   { riskFactors.push('Metabolic syndrome combination'); overallRisk = 'high'; }

  if (riskFactors.length === 0)    riskFactors.push('No major risk factors identified');

  if (overallRisk === 'high') {
    recommendations.push('Schedule a comprehensive health checkup immediately');
    recommendations.push('Ensure all emergency contacts are updated in the app');
    recommendations.push('Review all medications with your doctor');
  } else {
    recommendations.push('Continue regular medication compliance');
    recommendations.push('Maintain daily wellness logging');
    recommendations.push('Schedule routine checkups every 3–6 months');
  }

  res.json({
    success: true,
    riskAssessment: {
      overallRisk,
      riskFactors,
      recommendations,
      conditions,
      age,
      assessedAt: new Date(),
    },
  });
});
