// controllers/medicineController.js — Medicine Management with AI/OCR
const { Medicine, Reminder, User } = require('../models');
const { asyncHandler, createError } = require('../middleware');
const aiService = require('../services/aiService');

/* ─── Get All Medicines ─── */
exports.getMedicines = asyncHandler(async (req, res) => {
  const { active } = req.query;
  const query = { userId: req.user._id };
  if (active !== undefined) query.isActive = active === 'true';

  const medicines = await Medicine.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: medicines.length, medicines });
});

/* ─── Get Single Medicine ─── */
exports.getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user._id });
  if (!medicine) throw createError('Medicine not found.', 404);
  res.json({ success: true, medicine });
});

/* ─── AI Lookup Medicine Uses & Negative Symptoms ─── */
exports.lookupMedicineInfo = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw createError('Medicine name is required.');

  try {
    const prompt = `As a clinical pharmacist, provide concise information for the medicine: "${name}"
Return ONLY raw valid JSON (no markdown tags):
{
  "uses": "1 concise sentence explaining main medical uses and indications",
  "negativeSymptoms": "1 concise sentence listing potential side effects, adverse reactions, or negative symptoms"
}`;

    const aiRes = await aiService.groqChat([{ role: 'user', content: prompt }], 'Clinical pharmacist. Return raw JSON only.');
    const cleaned = aiRes.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      success: true,
      name,
      uses: parsed.uses || `Used for therapeutic management related to ${name}.`,
      negativeSymptoms: parsed.negativeSymptoms || `Mild gastrointestinal discomfort, dizziness, or headache in rare cases.`
    });
  } catch (err) {
    res.json({
      success: true,
      name,
      uses: `Therapeutic treatment associated with ${name}.`,
      negativeSymptoms: `May cause mild dizziness, nausea, or allergic reaction in sensitive individuals.`
    });
  }
});

/* ─── Add Medicine ─── */
exports.addMedicine = asyncHandler(async (req, res) => {
  const data = { ...req.body, userId: req.user._id };
  if (req.file) data.prescriptionImageUrl = `/uploads/${req.user._id}/${req.file.filename}`;

  // Auto-fill uses and negativeSymptoms via AI if missing
  if ((!data.uses || !data.uses.trim()) || (!data.negativeSymptoms || !data.negativeSymptoms.trim())) {
    try {
      const prompt = `As a clinical pharmacist, provide concise information for the medicine "${data.name}":
Return ONLY valid JSON (no markdown):
{
  "uses": "1 concise sentence explaining main medical uses and indications",
  "negativeSymptoms": "1 concise sentence listing potential side effects or negative symptoms"
}`;
      const aiText = await aiService.groqChat([{ role: 'user', content: prompt }], 'Clinical pharmacist. Return raw JSON only.');
      const parsed = JSON.parse(aiText.replace(/```json|```/g, '').trim());
      if (parsed.uses && (!data.uses || !data.uses.trim())) data.uses = parsed.uses;
      if (parsed.negativeSymptoms && (!data.negativeSymptoms || !data.negativeSymptoms.trim())) data.negativeSymptoms = parsed.negativeSymptoms;
    } catch (_) {}
  }

  // Fallbacks if still empty
  if (!data.uses) data.uses = `Therapeutic management associated with ${data.name}.`;
  if (!data.negativeSymptoms) data.negativeSymptoms = `May cause mild dizziness, nausea, or fatigue.`;

  const medicine = await Medicine.create(data);

  // Auto-generate reminders for today + 7 days
  await generateReminders(medicine, req.user._id);

  // Award XP for adding medicine
  await awardXP(req.user._id, 5, 'Added new medicine');

  res.status(201).json({ success: true, message: 'Medicine added successfully.', medicine });
});

/* ─── Update Medicine ─── */
exports.updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!medicine) throw createError('Medicine not found.', 404);
  res.json({ success: true, message: 'Medicine updated.', medicine });
});

/* ─── Delete Medicine ─── */
exports.deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!medicine) throw createError('Medicine not found.', 404);
  await Reminder.deleteMany({ medicineId: req.params.id });
  res.json({ success: true, message: 'Medicine deleted.' });
});

/* ─── OCR Prescription Scan (preview only — no DB write) ─── */
exports.scanPrescription = asyncHandler(async (req, res) => {
  if (!req.file) throw createError('Please upload a prescription image.');

  const imageUrl = `/uploads/${req.user._id}/${req.file.filename}`;
  const rawText  = req.body.rawText || '';

  // Fallback to reading file as text ONLY if it's a PDF
  let ocrText = rawText;
  if (!ocrText && req.file && req.file.path.toLowerCase().endsWith('.pdf')) {
    try {
      const fs = require('fs');
      const buf = fs.readFileSync(req.file.path);
      const str = buf.toString('utf8').replace(/[^\x20-\x7E]/g, ' ').trim();
      if (str.length > 30) ocrText = str.slice(0, 3000);
    } catch (_) {}
  }

  const extracted = await aiService.parsePrescriptionWithGroq(ocrText, req.file?.path);
  const finalOcrText = extracted.ocrText || ocrText;

  res.json({
    success:  true,
    message:  `Prescription scanned. ${extracted.medicines?.length || 0} medicine(s) detected.`,
    extracted,
    imageUrl,
    ocrText: finalOcrText ? finalOcrText.slice(0, 1000) : null,
  });
});

/* ─── Get Today's Reminders ─── */
exports.getTodayReminders = asyncHandler(async (req, res) => {
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const reminders = await Reminder.find({
    userId: req.user._id,
    scheduledTime: { $gte: today, $lt: tomorrow },
  }).populate('medicineId', 'name dosage unit color instructions').sort({ scheduledTime: 1 });

  res.json({ success: true, count: reminders.length, reminders });
});

/* ─── Mark Reminder as Taken/Missed ─── */
exports.updateReminderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['taken', 'missed', 'snoozed'].includes(status)) throw createError('Invalid status.');

  const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
  if (!reminder) throw createError('Reminder not found.', 404);

  reminder.status = status;
  if (status === 'taken') {
    reminder.takenAt = new Date();
    await awardXP(req.user._id, 10, 'Medicine taken');
  }
  await reminder.save();

  res.json({ success: true, message: `Reminder marked as ${status}.`, reminder });
});

/* ─── Compliance Report ─── */
exports.getComplianceReport = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = new Date(); from.setDate(from.getDate() - days);

  const reminders = await Reminder.find({
    userId: req.user._id,
    scheduledTime: { $gte: from },
  }).populate('medicineId', 'name');

  const total  = reminders.length;
  const taken  = reminders.filter(r => r.status === 'taken').length;
  const missed = reminders.filter(r => r.status === 'missed').length;
  const rate   = total ? Math.round((taken / total) * 100) : 0;

  // Group by medicine
  const byMedicine = {};
  reminders.forEach(r => {
    const name = r.medicineId?.name || 'Unknown';
    if (!byMedicine[name]) byMedicine[name] = { taken: 0, missed: 0, pending: 0 };
    byMedicine[name][r.status] = (byMedicine[name][r.status] || 0) + 1;
  });

  res.json({ success: true, report: { total, taken, missed, complianceRate: rate, byMedicine, days } });
});

/* ─── AI Medicine Explanation ─── */
exports.explainMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user._id });
  if (!medicine) throw createError('Medicine not found.', 404);

  const explanation = await aiService.explainMedicine(medicine);
  res.json({ success: true, explanation });
});

/* ─── Helper: Generate reminders ─── */
async function generateReminders(medicine, userId) {
  try {
    const times = medicine.times?.length ? medicine.times : ['08:00'];
    const reminders = [];
    const days = 30;

    for (let d = 0; d < days; d++) {
      for (const timeStr of times) {
        const [h, m] = timeStr.split(':').map(Number);
        const dt = new Date();
        dt.setDate(dt.getDate() + d);
        dt.setHours(h, m, 0, 0);
        reminders.push({ userId, medicineId: medicine._id, scheduledTime: dt, status: 'pending' });
      }
    }
    await Reminder.insertMany(reminders, { ordered: false });
  } catch (e) {
    console.error('Reminder generation error:', e.message);
  }
}

/* ─── Helper: Award XP ─── */
async function awardXP(userId, amount, reason) {
  try {
    const user = await User.findById(userId);
    user.xp += amount;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save({ validateBeforeSave: false });
  } catch (e) {
    console.error('XP award error:', e.message);
  }
}

/* ─────────────────────────────────────────────────────────────────────
   SMART PRESCRIPTION SCAN — Full Pipeline:
   1. OCR (file text extraction)
   2. Groq AI structured parsing
   3. Auto-create Medicine records
   4. Auto-generate Reminder schedule (duration-aware)
   5. Send confirmation email
   6. Return full schedule preview
───────────────────────────────────────────────────────────────────── */
exports.smartScanAndSchedule = asyncHandler(async (req, res) => {
  const imageUrl  = req.file ? `/uploads/${req.user._id}/${req.file.filename}` : null;
  const rawText   = req.body.rawText || '';
  const dryRun    = req.body.dryRun === 'true'; // preview without saving

  if (!req.file && !rawText && !req.body.confirmedMedicines) {
    throw createError('Please upload a prescription file or provide prescription text.');
  }

  /* ── Step 1: Extract text from uploaded file (PDF only fallback) ── */
  let ocrText = rawText;
  if (!ocrText && req.file && req.file.path.toLowerCase().endsWith('.pdf')) {
    try {
      const fs  = require('fs');
      const buf = fs.readFileSync(req.file.path);
      const str = buf.toString('utf8').replace(/[^\x20-\x7E]/g, ' ').trim();
      if (str.length > 30) ocrText = str.slice(0, 4000);
    } catch (_) {}
  }

  /* ── Step 2: Check for confirmed payload or AI-powered structured parsing ── */
  let medicinesToProcess = [];
  if (req.body.confirmedMedicines) {
    try {
      medicinesToProcess = typeof req.body.confirmedMedicines === 'string'
        ? JSON.parse(req.body.confirmedMedicines)
        : req.body.confirmedMedicines;
    } catch (_) {}
  }

  let extracted = null;
  if (!medicinesToProcess.length) {
    extracted = await aiService.parsePrescriptionWithGroq(ocrText, req.file?.path);
    medicinesToProcess = extracted.medicines || [];
  } else {
    extracted = { medicines: medicinesToProcess };
  }

  if (!medicinesToProcess?.length) {
    return res.status(200).json({
      success: false,
      message: 'No medicines could be detected. Please enter details manually or try a clearer image.',
      extracted,
      imageUrl,
    });
  }

  if (dryRun) {
    // Return preview without saving to DB
    return res.json({
      success:  true,
      dryRun:   true,
      message:  `Preview: ${medicinesToProcess.length} medicine(s) detected. Confirm to create schedule.`,
      extracted: { ...extracted, medicines: medicinesToProcess },
      imageUrl,
      schedule: buildSchedulePreview(medicinesToProcess),
    });
  }

  /* ── Step 3 & 4: Create medicines + generate reminders ── */
  const created = [];
  const errors  = [];

  for (const m of medicinesToProcess) {
    if (!m.name?.trim()) continue;

    try {
      // Parse duration into days (e.g. "30 days", "2 weeks", "1 month")
      const durationDays = parseDurationToDays(m.duration);

      // Normalize reminder times
      const times = normalizeTimes(m.times, m.frequency);

      const medicine = await Medicine.create({
        userId:       req.user._id,
        name:         m.name.trim(),
        genericName:  m.genericName || '',
        dosage:       m.dosage      || '1',
        unit:         normalizeUnit(m.unit),
        frequency:    m.frequency   || 'once daily',
        times,
        startDate:    new Date(),
        endDate:      durationDays ? addDays(new Date(), durationDays) : undefined,
        instructions: m.instructions || '',
        uses:         m.uses         || `Therapeutic treatment associated with ${m.name}`,
        negativeSymptoms: m.negativeSymptoms || `May cause mild dizziness, nausea, or fatigue in rare cases`,
        prescribedBy: extracted.prescribedBy || '',
        ocrExtracted: true,
        prescriptionImageUrl: imageUrl,
        isActive:     true,
      });

      /* ── Generate reminders for the entire duration ── */
      const reminderDocs = [];
      const totalDays    = durationDays || 30;

      for (let d = 0; d < totalDays; d++) {
        for (const timeStr of times) {
          const [h, min] = timeStr.split(':').map(Number);
          const dt = new Date();
          dt.setDate(dt.getDate() + d);
          dt.setHours(h, min, 0, 0);
          
          reminderDocs.push({
            userId:        req.user._id,
            medicineId:    medicine._id,
            scheduledTime: dt,
            status:        'pending',
          });
        }
      }

      let remindersCreated = 0;
      if (reminderDocs.length > 0) {
        await Reminder.insertMany(reminderDocs, { ordered: false });
        remindersCreated = reminderDocs.length;
      }

      created.push({
        medicine,
        durationDays: totalDays,
        reminderTimes: times,
        remindersCreated,
        nextReminder: reminderDocs[0]?.scheduledTime || null,
        schedulePreview: buildDayPreview(times, Math.min(totalDays, 7)),
      });

    } catch (e) {
      console.error(`Failed to create medicine "${m.name}":`, e.message);
      errors.push({ name: m.name, error: e.message });
    }
  }

  /* ── Step 5: Award XP ── */
  const xpEarned = created.length * 10 + 5; // 10 per medicine + 5 for scanning
  await awardXP(req.user._id, xpEarned, 'Smart prescription scan');

  /* ── Step 6: Send confirmation email (non-blocking) ── */
  try {
    const { sendPrescriptionConfirmation } = require('../services/notificationService');
    sendPrescriptionConfirmation(req.user, { created, extracted, imageUrl })
      .catch(e => console.error('Prescription email error:', e.message));
  } catch (_) {}

  const totalReminders = created.reduce((s, c) => s + c.remindersCreated, 0);

  res.status(201).json({
    success: true,
    message: `✅ ${created.length} medicine(s) scheduled! ${totalReminders} reminders created automatically.`,
    summary: {
      medicinesCreated: created.length,
      totalReminders,
      xpEarned,
      errors: errors.length > 0 ? errors : undefined,
    },
    extracted,
    created,
    imageUrl,
  });
});

/* ─── Helper: Parse duration string to days ─── */
function parseDurationToDays(duration) {
  if (!duration) return 30;
  const str = duration.toLowerCase().trim();
  const num = parseInt(str);
  if (isNaN(num)) return 30;
  if (str.includes('week'))  return num * 7;
  if (str.includes('month')) return num * 30;
  if (str.includes('year'))  return num * 365;
  return num; // assume days
}

/* ─── Helper: Normalize reminder times from frequency ─── */
function normalizeTimes(times, frequency) {
  if (Array.isArray(times) && times.length > 0) {
    return times.map(t => {
      if (typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t)) return t;
      return '08:00';
    });
  }
  const freq = (frequency || '').toLowerCase();
  if (freq.includes('once') || freq.includes('1'))          return ['08:00'];
  if (freq.includes('twice') || freq.includes('2'))         return ['08:00', '20:00'];
  if (freq.includes('thrice') || freq.includes('3'))        return ['08:00', '14:00', '20:00'];
  if (freq.includes('four') || freq.includes('4'))          return ['08:00', '12:00', '18:00', '22:00'];
  if (freq.includes('every 8'))                             return ['06:00', '14:00', '22:00'];
  if (freq.includes('every 6'))                             return ['06:00', '12:00', '18:00', '00:00'];
  if (freq.includes('every 12'))                            return ['08:00', '20:00'];
  if (freq.includes('bedtime') || freq.includes('night'))   return ['22:00'];
  if (freq.includes('morning'))                             return ['08:00'];
  if (freq.includes('afternoon'))                           return ['14:00'];
  if (freq.includes('breakfast'))                           return ['08:30'];
  if (freq.includes('lunch'))                               return ['13:00'];
  if (freq.includes('dinner'))                              return ['19:00'];
  if (freq.includes('meals') || freq.includes('food'))      return ['08:00', '13:00', '19:00'];
  return ['08:00'];
}

/* ─── Helper: Normalize unit ─── */
function normalizeUnit(unit) {
  if (!unit) return 'mg';
  const u = unit.toLowerCase().trim();
  if (u.includes('tablet') || u.includes('tab'))  return 'tablets';
  if (u.includes('capsule') || u.includes('cap')) return 'capsules';
  if (u.includes('ml'))   return 'ml';
  if (u.includes('drop')) return 'drops';
  if (u.includes('unit')) return 'units';
  if (u.includes('mg'))   return 'mg';
  return 'mg';
}

/* ─── Helper: Add days to date ─── */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/* ─── Helper: Build human-readable schedule preview ─── */
function buildSchedulePreview(medicines) {
  return medicines.map(m => {
    const times = normalizeTimes(m.times, m.frequency);
    const days  = parseDurationToDays(m.duration);
    return {
      name:      m.name,
      dosage:    `${m.dosage || '1'} ${normalizeUnit(m.unit)}`,
      times,
      frequency: m.frequency || 'once daily',
      duration:  `${days} days`,
      totalDoses: times.length * days,
    };
  });
}

/* ─── Helper: Build day-by-day preview for first N days ─── */
function buildDayPreview(times, days) {
  const preview = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(new Date(), d);
    preview.push({
      date:  date.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }),
      times: times.map(t => ({ time: t, status: 'pending' })),
    });
  }
  return preview;
}
