// src/pages/HealthDiaryPage.jsx — Clean Enterprise Health Diary & Symptom Logs
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookHeart, Plus, Mic, MicOff, Download, Activity, Stethoscope } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const SYMPTOM_NAMES = [
  'Headache','Fatigue','Nausea','Dizziness','Chest Pain','Shortness of Breath',
  'Back Pain','Joint Pain','Fever','Cough','Stomach Pain','Anxiety',
];

export default function HealthDiaryPage() {
  const [logs, setLogs]   = useState([]);
  const [tab, setTab]     = useState('log');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [form, setForm] = useState({
    symptoms: [],
    vitalSigns: { bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', temperature: '', oxygenLevel: '', weight: '', bloodSugar: '' },
    notes: '',
  });

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try { const { data } = await api.get('/health/logs?limit=10'); setLogs(data.logs || []); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  const toggleSymptom = (name) => {
    setForm(f => {
      const existing = f.symptoms.find(s => s.name === name);
      if (existing) return { ...f, symptoms: f.symptoms.filter(s => s.name !== name) };
      return { ...f, symptoms: [...f.symptoms, { name, severity: 5, duration: 'today' }] };
    });
  };

  const updateSeverity = (name, severity) => {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.map(s => s.name === name ? { ...s, severity: Number(severity) } : s),
    }));
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input not supported.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    if (isListening) { setIsListening(false); return; }
    setIsListening(true);
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setTranscript(t);
      setForm(f => ({ ...f, notes: f.notes + ' ' + t }));
      setIsListening(false);
    };
    rec.onerror  = () => setIsListening(false);
    rec.onend    = () => setIsListening(false);
    rec.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/health/log', {
        symptoms:   form.symptoms,
        vitalSigns: Object.fromEntries(
          Object.entries(form.vitalSigns).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])
        ),
        notes: form.notes,
      });
      toast.success('Health log saved');
      setForm({ symptoms: [], vitalSigns: { bloodPressureSystolic:'', bloodPressureDiastolic:'', heartRate:'', temperature:'', oxygenLevel:'', weight:'', bloodSugar:'' }, notes: '' });
      setTranscript('');
      fetchLogs();
      setTab('history');
    } catch { toast.error('Failed to save log.'); }
    finally { setLoading(false); }
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/health/report?days=30', { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `health-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF report downloaded');
    } catch { toast.error('Failed to generate report.'); }
    finally { setDownloading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookHeart className="w-5 h-5 text-blue-600" /> Health Diary & Symptom Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Record daily symptoms, vital sign telemetry, and export clinical PDF reports</p>
        </div>
        <button onClick={handleDownloadReport} disabled={downloading} className="btn-secondary">
          <Download className="w-3.5 h-3.5" /> {downloading ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {['log','history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 text-xs font-bold capitalize transition-colors border-b-2
              ${tab === t ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {t === 'log' ? 'New Symptom & Vital Entry' : 'Log History'}
          </button>
        ))}
      </div>

      {/* Log Form */}
      {tab === 'log' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Select Active Symptoms</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {SYMPTOM_NAMES.map(name => {
                const selected = form.symptoms.find(s => s.name === name);
                return (
                  <button key={name} type="button" onClick={() => toggleSymptom(name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border
                      ${selected ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-slate-50 border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {name}
                  </button>
                );
              })}
            </div>

            {form.symptoms.map(s => (
              <div key={s.name} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs mb-1.5">
                <span className="font-semibold text-slate-900 dark:text-white w-28">{s.name}</span>
                <span className="text-[11px] text-slate-400">Severity:</span>
                <input type="range" min="1" max="10" value={s.severity} onChange={e => updateSeverity(s.name, e.target.value)} className="flex-1 accent-blue-600" />
                <span className="font-bold text-blue-600 w-8">{s.severity}/10</span>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Vital Signs Telemetry</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key:'bloodPressureSystolic',  label:'BP Systolic (mmHg)' },
                { key:'bloodPressureDiastolic', label:'BP Diastolic (mmHg)' },
                { key:'heartRate',   label:'Heart Rate (bpm)' },
                { key:'temperature', label:'Temperature (°F)' },
                { key:'oxygenLevel', label:'O2 Saturation (%)' },
                { key:'bloodSugar',  label:'Blood Sugar (mg/dL)' },
              ].map(v => (
                <div key={v.key}>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">{v.label}</label>
                  <input type="number" step="0.1" className="input-field"
                    value={form.vitalSigns[v.key]}
                    onChange={e => setForm(f => ({ ...f, vitalSigns: { ...f.vitalSigns, [v.key]: e.target.value } }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Observations / Notes</h3>
              <button type="button" onClick={handleVoice} className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> : <Mic className="w-3.5 h-3.5" />}
                {isListening ? 'Listening...' : 'Dictate'}
              </button>
            </div>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Describe symptoms or observations..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-xs">
            {loading ? 'Saving...' : 'Save Health Entry'}
          </button>
        </form>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No diary records saved yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{new Date(log.logDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="text-[11px] text-slate-400">{new Date(log.logDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {log.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {log.symptoms.map(s => (
                      <span key={s.name} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium">
                        {s.name} ({s.severity}/10)
                      </span>
                    ))}
                  </div>
                )}
                {log.notes && <p className="text-slate-600 dark:text-slate-300">{log.notes}</p>}
                {log.aiSummary && <p className="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2 rounded">AI Summary: {log.aiSummary}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
