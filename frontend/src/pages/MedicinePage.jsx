// src/pages/MedicinePage.jsx — Clean Enterprise Medication Management & Bill Scanner
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Plus, CheckCircle, Clock, Upload, X, Loader, Sparkles,
  ChevronDown, ChevronUp, Bell, ShieldCheck, Trash2, Receipt, AlertCircle, Edit3,
  Target, ShieldAlert, AlertTriangle
} from 'lucide-react';
import {
  fetchMedicines, fetchTodayReminders, addMedicine, deleteMedicine,
  markReminderStatus, fetchComplianceReport,
} from '../store/slices/medicineSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

const DOSE_SIZES = [
  { label: 'Full Tablet (1.0)', val: '1.0' },
  { label: 'Half Tablet (0.5)', val: '0.5' },
  { label: 'Quarter Tablet (0.25)', val: '0.25' },
  { label: '1.5 Tablets', val: '1.5' },
  { label: '2.0 Tablets', val: '2.0' },
];

/** 12-Hour Time Converter (e.g., "14:00" -> "2:00 PM") */
function format12Hour(timeStr) {
  if (!timeStr) return '';
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
}

/** Bullet Point Formatter for Uses and Negative Symptoms */
function BulletList({ text }) {
  if (!text) return null;
  const items = text.split(/[•\n]/).map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  if (items.length <= 1) return <span>{text}</span>;
  return (
    <ul className="space-y-1 mt-1">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-1.5 leading-tight">
          <span className="shrink-0 font-bold opacity-70">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ComplianceBar({ rate }) {
  const color = rate >= 80 ? 'bg-emerald-600' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-600';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full ${color} rounded-full`} />
      </div>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-9">{rate}%</span>
    </div>
  );
}

/** Smart Medicine Bill / Invoice Reader Modal */
function SmartScanModal({ onClose, onSuccess }) {
  const dispatch                  = useDispatch();
  const [step, setStep]           = useState('upload'); // 'upload' | 'preview' | 'result'
  const [inputMode, setInputMode] = useState('image'); // 'image' | 'text'
  const [file, setFile]           = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [rawText, setRawText]     = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editedMeds, setEditedMeds] = useState([]);
  const [extractedOcrText, setExtractedOcrText] = useState('');
  const [showOcrText, setShowOcrText] = useState(true);
  const [finalData, setFinalData] = useState(null);
  const fileRef = useRef();

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    const r = new FileReader();
    r.onload = e => setImgPreview(e.target.result);
    r.readAsDataURL(f);
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const fd = new FormData();
      if (inputMode === 'image' && file) fd.append('prescription', file);
      if (rawText) fd.append('rawText', rawText);
      fd.append('dryRun', 'true');

      const { data } = await api.post('/medicines/smart-scan', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!data.extracted?.medicines?.length) {
        toast.error('No medicines detected in bill. Try manual input mode.');
        return;
      }

      setExtractedOcrText(data.extracted?.ocrText || data.ocrText || '');

      setEditedMeds(data.extracted.medicines.map(m => ({
        _sel: true,
        name: m.name || '',
        dosage: m.dosage || '1.0',
        doseFraction: m.dosage?.includes('0.5') ? '0.5' : '1.0',
        unit: m.unit || 'tablets',
        frequency: m.frequency || 'once daily',
        timesPerDay: m.times?.length || 1,
        times: m.times?.length ? m.times : ['08:00'],
        duration: m.duration || '30 days',
        uses: m.uses || `Therapeutic treatment associated with ${m.name || 'medicine'}`,
        negativeSymptoms: m.negativeSymptoms || `May cause mild dizziness or nausea in rare cases`,
      })));
      setStep('preview');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bill scan failed.');
    } finally { setScanning(false); }
  };

  const handleConfirm = async () => {
    const selected = editedMeds.filter(m => m._sel);
    if (!selected.length) { toast.error('Please acknowledge at least one medicine to schedule.'); return; }
    setConfirming(true);
    try {
      const confirmText = selected.map(m =>
        `${m.name} ${m.dosage} ${m.unit || 'tablets'} (${m.frequency}) at ${m.times.map(format12Hour).join(', ')} x ${m.duration || '30 days'}`
      ).join('\n');

      const fd = new FormData();
      if (inputMode === 'image' && file) fd.append('prescription', file);
      fd.append('rawText', confirmText);
      fd.append('confirmedMedicines', JSON.stringify(selected));
      fd.append('dryRun', 'false');

      const { data } = await api.post('/medicines/smart-scan', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFinalData(data);
      setStep('result');
      toast.success('Medicines scheduled & Calendar Event (.ics) attached to email!');
      dispatch(fetchMedicines());
      dispatch(fetchTodayReminders());
      dispatch(fetchComplianceReport());
      onSuccess && onSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create schedule.');
    } finally { setConfirming(false); }
  };

  const upd = (idx, key, val) => {
    setEditedMeds(prev => prev.map((m, i) => {
      if (i !== idx) return m;
      const updated = { ...m, [key]: val };
      if (key === 'timesPerDay') {
        const count = parseInt(val) || 1;
        const defaultTimes = ['08:00', '14:00', '18:00', '22:00'];
        updated.times = defaultTimes.slice(0, count);
        updated.frequency = count === 1 ? 'once daily' : count === 2 ? 'twice daily' : count === 3 ? 'thrice daily' : 'four times daily';
      }
      return updated;
    }));
  };

  const updTime = (medIdx, timeIdx, timeVal) => {
    setEditedMeds(prev => prev.map((m, i) => {
      if (i !== medIdx) return m;
      const newTimes = [...m.times];
      newTimes[timeIdx] = timeVal;
      return { ...m, times: newTimes };
    }));
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Medicine Bill AI Reader</h2>
                <p className="text-[11px] text-slate-400">Step {step === 'upload' ? 1 : step === 'preview' ? 2 : 3} of 3 — {step === 'upload' ? 'Upload Bill' : step === 'preview' ? 'Verify & Acknowledge Scanned Items' : 'Schedule Complete'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {step === 'upload' && (
              <div className="space-y-4">
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
                  <button onClick={() => setInputMode('image')}
                    className={`flex-1 py-2 rounded-md transition-colors ${inputMode === 'image' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
                    Upload Medicine Bill / Receipt
                  </button>
                  <button onClick={() => setInputMode('text')}
                    className={`flex-1 py-2 rounded-md transition-colors ${inputMode === 'text' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
                    Bill Text Input
                  </button>
                </div>

                {inputMode === 'image' && (
                  <>
                    <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                      onChange={e => pickFile(e.target.files[0])} />
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
                      onClick={() => fileRef.current?.click()}
                      className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                        ${dragOver ? 'border-blue-500 bg-blue-50/50' : file ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                      {file ? (
                        <div>
                          {imgPreview?.startsWith('data:image') && (
                            <img src={imgPreview} alt="Bill Preview" className="max-h-36 mx-auto rounded-lg mb-2 object-contain" />
                          )}
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> {file.name}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">Click or drop pharmacy bill / cash memo here</p>
                          <p className="text-[11px] text-slate-400">Supports JPG, PNG, PDF receipts (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {inputMode === 'text' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Medicine Bill Details</label>
                    <textarea value={rawText} onChange={e => setRawText(e.target.value)}
                      rows={5} className="input-field font-mono text-xs"
                      placeholder={`Paracetamol 500mg 2 times a day (half tablet) x 10 days\nAspirin 75mg 1 time a day x 30 days`} />
                  </div>
                )}
              </div>
            )}

            {/* AI STRUCTURED READING & ACKNOWLEDGMENT */}
            {step === 'preview' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Scanned Medicines ({editedMeds.length} Items Detected)</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold">Review Uses, Side Effects & 12h Timings</span>
                </div>

                <div className="space-y-3">
                  {editedMeds.map((m, idx) => (
                    <div key={idx} className={`p-4 border rounded-xl space-y-3 text-xs transition-colors ${m._sel ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 opacity-60'}`}>
                      
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={m._sel} onChange={e => upd(idx, '_sel', e.target.checked)} className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                        <input className="input-field flex-1 font-bold" value={m.name || ''} onChange={e => upd(idx, 'name', e.target.value)} placeholder="Medicine Name" />
                      </div>

                      {m._sel && (
                        <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Tablet / Dose Fraction</label>
                              <select className="input-field py-1.5" value={m.dosage} onChange={e => upd(idx, 'dosage', e.target.value)}>
                                {DOSE_SIZES.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                                <option value="1.0">1.0 Full Tablet</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Times per Day</label>
                              <select className="input-field py-1.5" value={m.timesPerDay || m.times?.length || 1} onChange={e => upd(idx, 'timesPerDay', e.target.value)}>
                                <option value="1">1 time a day (Once)</option>
                                <option value="2">2 times a day (Twice)</option>
                                <option value="3">3 times a day (Thrice)</option>
                                <option value="4">4 times a day (4x)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Duration</label>
                              <input className="input-field py-1.5" value={m.duration || '30 days'} onChange={e => upd(idx, 'duration', e.target.value)} placeholder="30 days" />
                            </div>
                          </div>

                          {/* Uses & Negative Symptoms Read by AI */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50">
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block mb-0.5">🎯 Uses Read:</span>
                              <input className="bg-transparent text-[11px] text-emerald-900 dark:text-emerald-200 w-full outline-none" value={m.uses || ''} onChange={e => upd(idx, 'uses', e.target.value)} placeholder="Medical Uses" />
                            </div>
                            <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50">
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase block mb-0.5">🛡️ Side Effects Read:</span>
                              <input className="bg-transparent text-[11px] text-rose-900 dark:text-rose-200 w-full outline-none" value={m.negativeSymptoms || ''} onChange={e => upd(idx, 'negativeSymptoms', e.target.value)} placeholder="Negative Symptoms" />
                            </div>
                          </div>

                          {/* Specific Reminder Times in 12-Hour format */}
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Reminder Timing(s) (12h format)</label>
                            <div className="flex flex-wrap gap-2">
                              {(m.times || ['08:00']).map((tVal, tIdx) => (
                                <div key={tIdx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-[10px] font-medium text-slate-400">Dose {tIdx + 1}:</span>
                                  <input type="time" className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                                    value={tVal} onChange={e => updTime(idx, tIdx, e.target.value)} />
                                  <span className="text-[11px] font-bold text-blue-600">({format12Hour(tVal)})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 'result' && finalData && (
              <div className="space-y-3 text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Medicine Schedule Created</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">{finalData.message}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">
                  <Bell className="w-3.5 h-3.5" /> 📅 Calendar Event (.ics) attached to confirmation email!
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            {step === 'upload' && (
              <>
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleScan} disabled={scanning || (inputMode === 'image' && !file) || (inputMode === 'text' && !rawText.trim())} className="btn-primary flex-1">
                  {scanning ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Scan Medicine Bill'}
                </button>
              </>
            )}
            {step === 'preview' && (
              <>
                <button onClick={() => setStep('upload')} className="btn-secondary flex-1">Back</button>
                <button onClick={handleConfirm} disabled={confirming} className="btn-primary flex-1">
                  {confirming ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Acknowledge & Confirm Schedule'}
                </button>
              </>
            )}
            {step === 'result' && (
              <button onClick={onClose} className="btn-primary flex-1">Close</button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function MedicinePage() {
  const dispatch = useDispatch();
  const { medicines, reminders } = useSelector(s => s.medicine);
  const [tab, setTab]           = useState('today');
  const [showScan, setShowScan] = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const [form, setForm]         = useState({
    name: '',
    doseFraction: '1.0',
    unit: 'tablets',
    timesPerDay: '1',
    times: ['08:00'],
    durationDays: '30',
    instructions: '',
    uses: '',
    negativeSymptoms: '',
  });

  useEffect(() => {
    dispatch(fetchMedicines());
    dispatch(fetchTodayReminders());
  }, [dispatch]);

  const handleTaken = async (id) => {
    await dispatch(markReminderStatus({ id, status: 'taken' }));
  };

  const handleDeleteMedicine = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} and all its scheduled reminders?`)) return;
    await dispatch(deleteMedicine(id));
    dispatch(fetchTodayReminders());
  };

  const handleAiLookupInfo = async () => {
    if (!form.name || !form.name.trim()) {
      toast.error('Please enter a medication name first.');
      return;
    }
    setLookingUp(true);
    try {
      const { data } = await api.post('/medicines/lookup-info', { name: form.name });
      if (data.uses || data.negativeSymptoms) {
        setForm(p => ({
          ...p,
          uses: data.uses || p.uses,
          negativeSymptoms: data.negativeSymptoms || p.negativeSymptoms
        }));
        toast.success(`✨ Auto-filled uses & side effects for ${form.name}`);
      }
    } catch (_) {
      toast.error('Could not auto-fetch info. You can enter details manually.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('dosage', form.doseFraction);
    fd.append('unit', form.unit);
    fd.append('frequency', form.timesPerDay === '1' ? 'once daily' : form.timesPerDay === '2' ? 'twice daily' : form.timesPerDay === '3' ? 'thrice daily' : 'four times daily');
    fd.append('duration', `${form.durationDays} days`);
    fd.append('times', JSON.stringify(form.times));
    fd.append('instructions', form.instructions);
    fd.append('uses', form.uses);
    fd.append('negativeSymptoms', form.negativeSymptoms);

    const res = await dispatch(addMedicine(fd));
    if (res.meta.requestStatus === 'fulfilled') {
      setShowAdd(false);
      dispatch(fetchTodayReminders());
      setForm({ name: '', doseFraction: '1.0', unit: 'tablets', timesPerDay: '1', times: ['08:00'], durationDays: '30', instructions: '', uses: '', negativeSymptoms: '' });
    }
  };

  const updateFormTimesPerDay = (countStr) => {
    const count = parseInt(countStr) || 1;
    const defaultTimes = ['08:00', '14:00', '18:00', '22:00'];
    setForm(p => ({
      ...p,
      timesPerDay: countStr,
      times: defaultTimes.slice(0, count),
    }));
  };

  const updateFormTimeValue = (idx, timeVal) => {
    setForm(p => {
      const newTimes = [...p.times];
      newTimes[idx] = timeVal;
      return { ...p, times: newTimes };
    });
  };

  const pending = reminders.filter(r => r.status === 'pending');
  const taken   = reminders.filter(r => r.status === 'taken');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" /> Medication Directory & Schedule Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Automated 12h medicine schedules, bill AI reader & medication uses & negative symptoms directory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScan(true)} className="btn-primary">
            <Receipt className="w-3.5 h-3.5" /> Scan Medicine Bill
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-secondary">
            <Plus className="w-3.5 h-3.5" /> Add Medication
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Doses</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{taken.length}</p>
          <p className="text-xs text-slate-400 mt-1">Recorded today</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Doses</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{pending.length}</p>
          <p className="text-xs text-slate-400 mt-1">Scheduled for today</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {['today', 'medicines'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 text-xs font-bold capitalize transition-colors border-b-2
              ${tab === t ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {t === 'today' ? "Today's Schedule" : 'Medication Directory'}
          </button>
        ))}
      </div>

      {/* TODAY TAB (12-Hour Format) */}
      {tab === 'today' && (
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center py-10">
              <Pill className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">No medications scheduled for today</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
              {reminders.map((r) => (
                <div key={r._id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${r.status === 'taken' ? 'bg-emerald-500' : r.status === 'missed' ? 'bg-rose-500' : 'bg-blue-600'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{r.medicineId?.name || 'Medication'}</p>
                      <p className="text-[11px] text-slate-400">
                        Dose: {r.medicineId?.dosage} {r.medicineId?.unit || 'tablets'} · Scheduled: <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(r.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {r.status === 'pending' ? (
                      <button onClick={() => handleTaken(r._id)} className="btn-success">
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Taken
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 capitalize">{r.status}</span>
                    )}

                    <button
                      onClick={() => handleDeleteMedicine(r.medicineId?._id || r.medicineId, r.medicineId?.name || 'this medicine')}
                      title="Delete Medicine"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIRECTORY TAB WITH USES AND NEGATIVE SYMPTOMS */}
      {tab === 'medicines' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center py-10">
              <Pill className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">No active medicines added yet.</p>
            </div>
          ) : (
            medicines.map((m) => (
              <div key={m._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-blue-600" /> {m.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Dose: {m.dosage} {m.unit || 'tablets'} · {m.frequency}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteMedicine(m._id, m.name)}
                      title="Delete Medicine"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scheduled 12-Hour Timings */}
                  {m.times?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.times.map((t, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 border border-blue-200/50 dark:border-blue-900/50">
                          <Clock className="w-3 h-3 text-blue-600" /> {format12Hour(t)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Primary Medical Uses */}
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Uses / Indications
                    </div>
                    <div className="text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
                      <BulletList text={m.uses || `Used for therapeutic treatment associated with ${m.name}.`} />
                    </div>
                  </div>

                  {/* Negative Symptoms & Adverse Effects */}
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                      <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Negative Symptoms / Side Effects
                    </div>
                    <div className="text-[11px] text-rose-900 dark:text-rose-200 font-medium">
                      <BulletList text={m.negativeSymptoms || `May cause mild dizziness, nausea, or headache in rare cases.`} />
                    </div>
                  </div>

                  {m.instructions && <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800 p-2 rounded">Instructions: {m.instructions}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MANUAL ADD MEDICATION MODAL (With AI Uses & Negative Symptoms Lookup) */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-600" /> Add New Medication
              </h2>
              <form onSubmit={handleAddManual} className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-400">Medication Name *</label>
                    <button
                      type="button"
                      onClick={handleAiLookupInfo}
                      disabled={lookingUp || !form.name.trim()}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-40"
                    >
                      <Sparkles className={`w-3 h-3 ${lookingUp ? 'animate-spin' : ''}`} />
                      {lookingUp ? 'AI Looking up...' : 'AI Fetch Uses & Side Effects'}
                    </button>
                  </div>
                  <input
                    required
                    className="input-field"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    onBlur={() => { if (form.name.trim() && !form.uses) handleAiLookupInfo(); }}
                    placeholder="e.g. Paracetamol, Metformin, Amlodipine"
                  />
                </div>

                {/* Uses Input */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Uses / Primary Purpose</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    value={form.uses}
                    onChange={e => setForm(p => ({ ...p, uses: e.target.value }))}
                    placeholder="e.g. Lowers blood pressure and protects heart health"
                  />
                </div>

                {/* Negative Symptoms Input */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Negative Symptoms / Side Effects</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    value={form.negativeSymptoms}
                    onChange={e => setForm(p => ({ ...p, negativeSymptoms: e.target.value }))}
                    placeholder="e.g. Dizziness, dry cough, fatigue, mild swelling"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Dose / Tablet Size</label>
                    <select className="input-field" value={form.doseFraction} onChange={e => setForm(p => ({ ...p, doseFraction: e.target.value }))}>
                      {DOSE_SIZES.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Unit</label>
                    <select className="input-field" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                      <option value="tablets">Tablets</option>
                      <option value="capsules">Capsules</option>
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="drops">drops</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Times per Day</label>
                    <select className="input-field" value={form.timesPerDay} onChange={e => updateFormTimesPerDay(e.target.value)}>
                      <option value="1">1 time a day (Once)</option>
                      <option value="2">2 times a day (Twice)</option>
                      <option value="3">3 times a day (Thrice)</option>
                      <option value="4">4 times a day (4x)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Duration (Days)</label>
                    <input type="number" min="1" className="input-field" value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))} placeholder="30" />
                  </div>
                </div>

                {/* Specific Reminder Timings with 12h preview */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase">Reminder Timings (12h format)</label>
                  <div className="flex flex-wrap gap-2">
                    {form.times.map((tVal, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] font-semibold text-slate-500">Dose {idx + 1}:</span>
                        <input type="time" className="bg-transparent font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                          value={tVal} onChange={e => updateFormTimeValue(idx, e.target.value)} />
                        <span className="text-[11px] font-bold text-blue-600">({format12Hour(tVal)})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Instructions / Notes</label>
                  <input className="input-field" value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="e.g. Take after meals with water" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Save Medication</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {showScan && <SmartScanModal onClose={() => setShowScan(false)} onSuccess={() => { dispatch(fetchMedicines()); dispatch(fetchTodayReminders()); }} />}
    </div>
  );
}
