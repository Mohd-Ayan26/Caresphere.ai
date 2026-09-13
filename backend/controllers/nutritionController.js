// controllers/nutritionController.js — Meals, Water, Nutrition Analytics
const { Meal, WaterLog, User } = require('../models');
const { asyncHandler, createError } = require('../middleware');
const aiService = require('../services/aiService');

/* ─── Log Meal ─── */
exports.addMeal = asyncHandler(async (req, res) => {
  const { mealType, name, foods, notes } = req.body;
  if (!mealType || !name) throw createError('Meal type and name required.');

  const parsedFoods = Array.isArray(foods) ? foods : (typeof foods === 'string' ? JSON.parse(foods) : []);

  // Calculate totals
  const totals = parsedFoods.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein:  acc.protein  + (f.protein  || 0),
    carbs:    acc.carbs    + (f.carbs    || 0),
    fat:      acc.fat      + (f.fat      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const mealData = {
    userId: req.user._id, mealType, name,
    foods:  parsedFoods,
    totalCalories: totals.calories,
    totalProtein:  totals.protein,
    totalCarbs:    totals.carbs,
    totalFat:      totals.fat,
    notes,
  };

  if (req.file) {
    mealData.imageUrl  = `/uploads/${req.user._id}/${req.file.filename}`;
    mealData.aiDetected = true;
  }

  const meal = await Meal.create(mealData);
  await awardXP(req.user._id, 5, 'Meal logged');

  res.status(201).json({ success: true, message: 'Meal logged.', meal });
});

/* ─── Get Today's Nutrition ─── */
exports.getTodayNutrition = asyncHandler(async (req, res) => {
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const meals = await Meal.find({
    userId:   req.user._id,
    mealDate: { $gte: today, $lt: tomorrow },
  }).sort({ mealDate: 1 });

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + m.totalCalories,
    protein:  acc.protein  + m.totalProtein,
    carbs:    acc.carbs    + m.totalCarbs,
    fat:      acc.fat      + m.totalFat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  res.json({ success: true, meals, totals });
});

/* ─── Nutrition History ─── */
exports.getNutritionHistory = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const from = new Date(); from.setDate(from.getDate() - days);

  const meals = await Meal.find({ userId: req.user._id, mealDate: { $gte: from } })
    .sort({ mealDate: -1 });

  res.json({ success: true, count: meals.length, meals });
});

/* ─── Log Water Intake ─── */
exports.logWater = asyncHandler(async (req, res) => {
  const { amount, unit } = req.body;
  if (!amount || amount <= 0) throw createError('Valid water amount required.');

  const log = await WaterLog.create({ userId: req.user._id, amount, unit: unit || 'ml' });

  // Check if daily goal met (2000ml)
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayLogs = await WaterLog.find({ userId: req.user._id, logDate: { $gte: today, $lt: tomorrow } });
  const totalMl = todayLogs.reduce((s, l) => s + (l.unit === 'ml' ? l.amount : l.amount * 1000), 0);

  if (totalMl >= 2000) await awardXP(req.user._id, 5, 'Daily water goal met');

  res.status(201).json({ success: true, message: 'Water intake logged.', log, totalToday: totalMl });
});

/* ─── Today's Water Summary ─── */
exports.getTodayWater = asyncHandler(async (req, res) => {
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const logs = await WaterLog.find({
    userId:  req.user._id,
    logDate: { $gte: today, $lt: tomorrow },
  }).sort({ logDate: 1 });

  const totalMl = logs.reduce((s, l) => s + (l.unit === 'ml' ? l.amount : l.amount * 1000), 0);

  res.json({ success: true, logs, totalMl, goal: 2000, percentage: Math.min(100, Math.round((totalMl / 2000) * 100)) });
});

/* ─── AI Diet Suggestions ─── */
exports.getDietSuggestions = asyncHandler(async (req, res) => {
  const { condition } = req.query;
  const conditions = req.user.medicalConditions || [];

  const suggestions = await aiService.getDietPlan(condition || conditions.join(', ') || 'general health');
  res.json({ success: true, suggestions });
});

/* ─── AI Food Recognition ─── */
exports.recognizeFood = asyncHandler(async (req, res) => {
  if (!req.file) throw createError('Please upload a food image.');
  const result = await aiService.recognizeFood(req.file.path);
  res.json({ success: true, result });
});

/* Helper to extract numeric portion multiplier from user text input */
function parsePortionMultiplier(portionStr) {
  if (!portionStr) return 1;
  const str = portionStr.toLowerCase().trim();
  
  // Check for weight/volume in grams or ml (e.g., "250g", "500 grams", "300 ml") -> base unit is 100g/100ml
  const gramMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams|ml|milliliters?)/);
  if (gramMatch) {
    const grams = parseFloat(gramMatch[1]);
    return grams > 0 ? grams / 100 : 1;
  }
  
  // Check for count/pieces (e.g., "3 eggs", "2 rotis", "4 pieces", "2.5 bowls")
  const countMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (countMatch) {
    const count = parseFloat(countMatch[1]);
    return count > 0 ? count : 1;
  }
  
  return 1;
}

/* ─── AI Auto Calorie & Macro Estimator by Item Name & Quantity/Weight ─── */
exports.estimateCalories = asyncHandler(async (req, res) => {
  const { name, quantity } = req.body;
  if (!name || !name.trim()) throw createError('Food item name is required.');

  const portion = quantity && quantity.trim() ? quantity.trim() : '1 serving';
  const mult = parsePortionMultiplier(portion);

  // Format full combined meal text (e.g., "2 servings/plates of rice with dal" or "250g of rice with dal")
  const hasUnit = /\b(g|gram|grams|ml|milliliter|milliliters|serving|servings|plate|plates|bowl|bowls|cup|cups|piece|pieces|slice|slices)\b/i.test(portion);
  const fullText = hasUnit ? `${portion} of ${name}` : `${portion} servings/plates of ${name}`;

  let estimated = null;
  try {
    const prompt = `You are an expert clinical dietitian AI. Calculate exact, portion-scaled nutritional values for this meal:
Full Meal Description: "${fullText}" (Food Item: "${name}", Quantity / Weight Consumed: "${portion}")

IMPORTANT INSTRUCTIONS:
1. You MUST calculate calories, protein (g), carbs (g), and fat (g) for the ENTIRE full meal specified ("${fullText}").
2. Interpret numeric quantities in context (e.g. quantity "${portion}" of "${name}" means ${portion} full servings/plates/bowls of ${name}, so multiply 1 serving by ${mult || portion}).
3. Example reference: 1 plate of Rice with Dal is approx 320 kcal. Therefore, 2 plates/servings of Rice with Dal MUST equal approx 640 total kcal, 23g protein, 128g carbs.
4. Output MUST be ONLY valid JSON matching this exact structure (no markdown tags, no extra text):
{"calories": number, "protein": number, "carbs": number, "fat": number, "summary": "Sentence explaining nutrients calculated specifically for ${fullText}"}`;

    const aiText = await aiService.groqChat([{ role: 'user', content: prompt }], 'Expert clinical nutritionist AI. Return raw JSON only.');
    const cleaned = aiText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed.calories === 'number') {
      estimated = {
        calories: Math.round(parsed.calories),
        protein: Math.round((parsed.protein || 0) * 10) / 10,
        carbs: Math.round((parsed.carbs || 0) * 10) / 10,
        fat: Math.round((parsed.fat || 0) * 10) / 10,
        summary: parsed.summary || `Nutritional estimate for ${fullText}`
      };
    }
  } catch (err) {
    console.error('AI estimate fallback used:', err.message);
  }

  // Fallback if AI estimate returned null or failed parsing
  if (!estimated) {
    const lower = name.toLowerCase();
    let baseCals = 150, baseP = 5, baseC = 20, baseF = 5;

    if (lower.includes('rice with dal') || lower.includes('dal rice') || lower.includes('dal chawal') || lower.includes('chawal dal')) {
      baseCals = 320; baseP = 11.5; baseC = 64; baseF = 2; // per plate/serving
    } else if (lower.includes('roti with sabzi') || lower.includes('chapati sabzi')) {
      baseCals = 250; baseP = 8; baseC = 38; baseF = 7;
    } else if (lower.includes('egg')) {
      baseCals = 70; baseP = 6; baseC = 0.5; baseF = 5; // per egg
    } else if (lower.includes('roti') || lower.includes('chapati')) {
      baseCals = 80; baseP = 3; baseC = 15; baseF = 1.5; // per roti
    } else if (lower.includes('paneer')) {
      baseCals = 265; baseP = 18; baseC = 3; baseF = 20; // per 100g
    } else if (lower.includes('rice') || lower.includes('chawal') || lower.includes('biryani')) {
      baseCals = 130; baseP = 3; baseC = 28; baseF = 1; // per 100g
    } else if (lower.includes('chicken')) {
      baseCals = 165; baseP = 31; baseC = 0; baseF = 3.6; // per 100g
    } else if (lower.includes('apple') || lower.includes('fruit') || lower.includes('banana')) {
      baseCals = 95; baseP = 0.5; baseC = 25; baseF = 0.3; // per fruit
    } else if (lower.includes('dal') || lower.includes('lentil')) {
      baseCals = 120; baseP = 8; baseC = 18; baseF = 2; // per 100g/bowl
    } else if (lower.includes('oatmeal') || lower.includes('oats')) {
      baseCals = 150; baseP = 5; baseC = 27; baseF = 2.5; // per serving/100g
    }

    estimated = {
      calories: Math.round(baseCals * mult),
      protein: Math.round(baseP * mult * 10) / 10,
      carbs: Math.round(baseC * mult * 10) / 10,
      fat: Math.round(baseF * mult * 10) / 10,
      summary: `Estimated ~${Math.round(baseCals * mult)} kcal for ${fullText} (${mult > 1 ? mult + 'x portion scale' : 'standard portion'})`
    };
  }

  res.json({ success: true, name, portion: fullText, estimated });
});

async function awardXP(userId, amount) {
  try {
    const user = await User.findById(userId);
    user.xp += amount;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save({ validateBeforeSave: false });
  } catch (_) {}
}
