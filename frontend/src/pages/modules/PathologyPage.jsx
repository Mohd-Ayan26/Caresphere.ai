// src/pages/modules/PathologyPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Upload, FileText, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Trash2, Eye, Loader, Plus, X
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RISK_STYLES = {
  low:      { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100'  },
  moderate: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100' },
  critical: { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    badge: 'bg-red-100'    },
};

const STATUS_STYLES = {
  normal:   'bg-green-100 text-green-700',
  high:     'bg-red-100 text-red-700',
  low:      'bg-blue-100 text-blue-700',
  critical: 'bg-red-200 text-red-800 font-bold animate-pulse',
};

function ReportCard({ report, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const s = RISK_STYLES[report.riskLevel] || RISK_STYLES.low;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`card border-2 ${s.border} ${s.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.badge}`}>
            <FlaskConical className={`w-5 h-5 ${s.text}`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{report.reportType || 'Blood Test'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(report.reportDate).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}
            </p>
            {report.abnormalValues?.length > 0 && (
              <p className={`text-xs font-semibold mt-1 ${s.text}`}>
                ⚠️ {report.abnormalValues.length} abnormal value(s) detected
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${s.badge} ${s.text}`}>
            {report.riskLevel} risk
          </span>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 hover:bg-white rounded-lg transition-all">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          <button onClick={() => onDelete(report._id)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-all">
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {report.summary && (
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{report.summary}</p>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-4 overflow-hidden">

            {/* Values Table */}
            {report.values?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-2">Test Results</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 rounded-lg">
                        <th className="text-left p-2 pl-3 rounded-l-lg text-xs text-gray-500 font-semibold">Test</th>
                        <th className="text-left p-2 text-xs text-gray-500 font-semibold">Value</th>
                        <th className="text-left p-2 text-xs text-gray-500 font-semibold">Normal Range</th>
                        <th className="text-left p-2 rounded-r-lg text-xs text-gray-500 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.values.map((v, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="p-2 pl-3 font-medium text-gray-800">{v.name}</td>
                          <td className="p-2 font-bold text-gray-900">{v.value} {v.unit}</td>
                          <td className="p-2 text-gray-500 text-xs">{v.normalRange}</td>
                          <td className="p-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[v.status] || 'bg-gray-100 text-gray-600'}`}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI Insights */}
            {report.aiInsights && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <h4 className="font-semibold text-indigo-800 text-sm mb-1 flex items-center gap-1.5">
                  🤖 AI Health Insights
                </h4>
                <p className="text-sm text-indigo-700 leading-relaxed">{report.aiInsights}</p>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-2">Recommendations</h4>
                <div className="space-y-2">
                  {report.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              ⚕️ <strong>Disclaimer:</strong> AI analysis is for informational purposes only. Always consult your healthcare provider for medical interpretation.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PathologyPage() {
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tab, setTab]             = useState('scan');
  const [rawText, setRawText]     = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/pathology');
      setReports(data.reports || []);
    } catch { toast.error('Failed to load reports.'); }
    finally { setLoading(false); }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP, or PDF files allowed.'); return;
    }
    setAnalyzing(true);
    const fd = new FormData();
    fd.append('report', file);
    try {
      const { data } = await api.post('/pathology/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(data.message);
      setReports(prev => [data.report, ...prev]);
      setTab('history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Please try manual text entry.');
    } finally { setAnalyzing(false); }
  };

  const handleTextAnalyze = async () => {
    if (!rawText.trim()) { toast.error('Please enter your report text.'); return; }
    setAnalyzing(true);
    try {
      const { data } = await api.post('/pathology/analyze-text', { text: rawText, reportType: 'Blood Test' });
      toast.success('Report analyzed successfully!');
      setReports(prev => [data.report, ...prev]);
      setRawText('');
      setTab('history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed.');
    } finally { setAnalyzing(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/pathology/${id}`);
      setReports(prev => prev.filter(r => r._id !== id));
      toast.success('Report deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-7 text-white">
        <h1 className="font-display text-2xl mb-1 flex items-center gap-2">
          <FlaskConical className="w-7 h-7" /> Pathology Report Scanner
        </h1>
        <p className="text-violet-100 text-sm">
          Upload your blood test or lab report — AI extracts values, detects abnormalities, and provides health insights.
        </p>
        <div className="flex gap-6 mt-4">
          <div><p className="text-2xl font-bold">{reports.length}</p><p className="text-violet-200 text-xs">Reports Analyzed</p></div>
          <div><p className="text-2xl font-bold">{reports.filter(r => r.riskLevel !== 'low').length}</p><p className="text-violet-200 text-xs">Require Attention</p></div>
          <div><p className="text-2xl font-bold">{reports.reduce((s,r) => s + (r.abnormalValues?.length||0), 0)}</p><p className="text-violet-200 text-xs">Abnormal Values Found</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{id:'scan', label:'📤 Upload Report'}, {id:'text', label:'✍️ Enter Text'}, {id:'history', label:`📋 History (${reports.length})`}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all border-2
              ${tab === t.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {tab === 'scan' && (
        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !analyzing && fileRef.current?.click()}
            className={`card border-2 border-dashed transition-all cursor-pointer text-center py-14
              ${dragOver ? 'border-violet-400 bg-violet-50' : 'border-gray-300 hover:border-violet-300 hover:bg-violet-50'}`}>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => handleImageUpload(e.target.files[0])} />
            {analyzing ? (
              <div>
                <Loader className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                <p className="font-semibold text-gray-800 text-lg">AI Analyzing Your Report…</p>
                <p className="text-gray-500 text-sm mt-1">Extracting values and detecting abnormalities</p>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-violet-600" />
                </div>
                <p className="font-bold text-gray-800 text-lg mb-1">Drop your report here</p>
                <p className="text-gray-500 text-sm">or click to browse files</p>
                <p className="text-gray-400 text-xs mt-3">Supports JPG, PNG, WEBP, PDF • Max 10MB</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '🔍', title: 'OCR Extraction', desc: 'Automatically reads text from uploaded reports' },
              { icon: '🤖', title: 'AI Analysis',    desc: 'Groq AI interprets values and flags abnormalities' },
              { icon: '📧', title: 'Email Alert',    desc: 'Sends you an email if abnormal values are detected' },
            ].map((f, i) => (
              <div key={i} className="card text-center border border-violet-100 bg-violet-50 p-4">
                <div className="text-3xl mb-2">{f.icon}</div>
                <h4 className="font-bold text-gray-900 text-sm">{f.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Input Tab */}
      {tab === 'text' && (
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" /> Enter Report Values Manually
          </h2>
          <p className="text-sm text-gray-500">
            Paste or type your pathology report values. Include test names, values, units, and normal ranges.
          </p>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={12}
            placeholder={`Example:\n\nHemoglobin: 11.2 g/dL (Normal: 12-17)\nFasting Glucose: 128 mg/dL (Normal: 70-100)\nTotal Cholesterol: 245 mg/dL (Normal: <200)\nLDL: 158 mg/dL (Normal: <100)\nHDL: 42 mg/dL (Normal: >60)\nTriglycerides: 198 mg/dL (Normal: <150)\nCreatinine: 1.1 mg/dL (Normal: 0.6-1.2)`}
            className="input-field resize-none font-mono text-sm"
          />
          <button onClick={handleTextAnalyze} disabled={analyzing || !rawText.trim()} className="btn-primary w-full py-3">
            {analyzing
              ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing…</>
              : <><FlaskConical className="w-4 h-4" /> Analyze Report</>}
          </button>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="card h-28 shimmer" />)
          ) : reports.length === 0 ? (
            <div className="card text-center py-12">
              <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No reports analyzed yet.</p>
              <p className="text-gray-400 text-sm mt-1">Upload your first pathology report to get started.</p>
              <button onClick={() => setTab('scan')} className="btn-primary mt-4 px-6 text-sm">
                <Upload className="w-4 h-4" /> Upload Report
              </button>
            </div>
          ) : (
            reports.map(r => <ReportCard key={r._id} report={r} onDelete={handleDelete} />)
          )}
        </div>
      )}
    </div>
  );
}
