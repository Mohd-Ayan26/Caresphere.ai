// src/pages/modules/HealthGuidePage.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookHeart, ChevronRight, ChevronLeft, Star, Shield, Activity, Apple, X, Loader, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { cleanMarkdownText } from '../../utils/textFormatter';

const RISK_COLORS = {
  low:      'bg-green-100 text-green-700 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high:     'bg-red-100 text-red-700 border-red-200',
  critical: 'bg-red-200 text-red-800 border-red-400',
};

function DiseaseCard({ disease, onClick }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left card border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{disease.icon}</div>
          <div>
            <h3 className="font-bold text-gray-900">{disease.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {disease.vitalsCount} vitals to watch · {disease.tipsCount} daily tips
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </motion.button>
  );
}

function GuideDetail({ guide, id, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dailyTips, setDailyTips] = useState([]);
  const [loadingTips, setLoadingTips] = useState(false);

  useEffect(() => {
    loadDailyTips();
  }, [id]);

  const loadDailyTips = async () => {
    setLoadingTips(true);
    try {
      const { data } = await api.get(`/health-guide/daily-tips?disease=${guide.name}`);
      setDailyTips(data.tips || []);
    } catch { /* fallback to static tips from guide */ setDailyTips(guide.tips || []); }
    finally { setLoadingTips(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{guide.icon}</span>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{guide.name}</h2>
            <p className="text-sm text-gray-500">Personalized health guide</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { id: 'overview',  label: '📋 Overview'  },
          { id: 'diet',      label: '🥗 Diet Guide' },
          { id: 'exercise',  label: '🏃 Exercise'  },
          { id: 'tips',      label: '💡 Daily Tips' },
          { id: 'warning',   label: '⚠️ Warning Signs' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all border-2
              ${activeTab === t.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Vitals to Monitor
            </h3>
            <div className="space-y-2">
              {guide.vitalsToWatch.map((v, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{i+1}</div>
                  <p className="text-sm text-blue-800 font-medium">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" /> Risk Factors
            </h3>
            <div className="flex flex-wrap gap-2">
              {guide.riskFactors.map((r, i) => (
                <span key={i} className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full font-medium">{r}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Diet Guide */}
      {activeTab === 'diet' && (
        <div className="space-y-4">
          <div className="card border-2 border-green-100 bg-green-50">
            <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <Apple className="w-5 h-5" /> ✅ Foods to Eat
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {guide.eatFoods.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-green-800 bg-white rounded-xl p-2.5 border border-green-100">
                  <span className="text-green-500 font-bold">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
          <div className="card border-2 border-red-100 bg-red-50">
            <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
              <X className="w-5 h-5" /> ❌ Foods to Avoid
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {guide.avoidFoods.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-800 bg-white rounded-xl p-2.5 border border-red-100">
                  <span className="text-red-500 font-bold">✗</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercise */}
      {activeTab === 'exercise' && (
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            🏃 Safe Exercises for Your Condition
          </h3>
          {guide.exercises.map((ex, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{i+1}</div>
              <p className="text-sm text-blue-900 font-medium">{ex}</p>
            </motion.div>
          ))}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            ⚕️ Always consult your doctor before starting any new exercise program.
          </div>
        </div>
      )}

      {/* Daily Tips */}
      {activeTab === 'tips' && (
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> AI-Powered Daily Tips
          </h3>
          {loadingTips ? (
            <div className="py-8 text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Generating personalized tips…</p>
            </div>
          ) : (
            dailyTips.map((tip, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-800">{cleanMarkdownText(tip)}</p>
              </motion.div>
            ))
          )}
          <button onClick={loadDailyTips} disabled={loadingTips}
            className="btn-secondary w-full text-sm">
            🔄 Refresh Tips
          </button>
        </div>
      )}

      {/* Warning Signs */}
      {activeTab === 'warning' && (
        <div className="space-y-4">
          <div className="card border-2 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-red-800">⚠️ Warning — Seek Immediate Help If:</h3>
            </div>
            <p className="text-sm text-red-700 leading-relaxed font-medium">{guide.warning}</p>
          </div>
          <div className="card bg-gradient-to-br from-gray-800 to-gray-900 text-white border-0">
            <h3 className="font-bold text-white mb-3">🚨 Emergency Numbers</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Emergency',      number: '911'  },
                { label: 'Poison Control', number: '1-800-222-1222' },
                { label: 'Crisis Line',    number: '988'  },
                { label: 'Non-emergency',  number: '311'  },
              ].map(e => (
                <a key={e.label} href={`tel:${e.number}`}
                  className="bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-all">
                  <p className="text-xs text-gray-400">{e.label}</p>
                  <p className="font-bold text-white">{e.number}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function HealthGuidePage() {
  const { user } = useSelector(s => s.auth);
  const [diseases, setDiseases]           = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [personalGuides, setPersonalGuides] = useState([]);
  const [riskData, setRiskData]           = useState(null);
  const [loading, setLoading]             = useState(false);
  const [tab, setTab]                     = useState('all');

  useEffect(() => {
    fetchDiseases();
    fetchPersonalized();
    fetchRisk();
  }, []);

  const fetchDiseases = async () => {
    setLoading(true);
    try { const { data } = await api.get('/health-guide'); setDiseases(data.diseases || []); }
    catch { toast.error('Failed to load guides.'); }
    finally { setLoading(false); }
  };

  const fetchPersonalized = async () => {
    try { const { data } = await api.get('/health-guide/personalized'); setPersonalGuides(data.guides || []); }
    catch { /* silent */ }
  };

  const fetchRisk = async () => {
    try { const { data } = await api.get('/health-guide/risk'); setRiskData(data.riskAssessment); }
    catch { /* silent */ }
  };

  const openGuide = async (id) => {
    try {
      const { data } = await api.get(`/health-guide/${id}`);
      setSelectedGuide(data.guide);
      setSelectedId(id);
    } catch { toast.error('Failed to load guide.'); }
  };

  if (selectedId && selectedGuide) {
    return (
      <div className="max-w-4xl mx-auto">
        <GuideDetail guide={selectedGuide} id={selectedId} onBack={() => { setSelectedId(null); setSelectedGuide(null); }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl p-7 text-white">
        <h1 className="font-display text-2xl mb-1 flex items-center gap-2">
          <BookHeart className="w-7 h-7" /> Disease Health Guide
        </h1>
        <p className="text-teal-100 text-sm">Personalized guides, diet plans, and lifestyle tips for your conditions.</p>
      </div>

      {/* Risk Assessment Card */}
      {riskData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`card border-2 ${RISK_COLORS[riskData.overallRisk]}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Your Risk Assessment
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Based on your profile conditions and age</p>
            </div>
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full border capitalize ${RISK_COLORS[riskData.overallRisk]}`}>
              {riskData.overallRisk} risk
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {riskData.riskFactors.map((f, i) => (
              <span key={i} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full">{f}</span>
            ))}
          </div>
          {riskData.recommendations?.length > 0 && (
            <div className="mt-3 space-y-1">
              {riskData.recommendations.slice(0,2).map((r, i) => (
                <p key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500" /> {r}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'personalized', label: `⭐ My Conditions (${personalGuides.length})` },
          { id: 'all',          label: '📚 All Guides' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all border-2
              ${tab === t.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Personalized */}
      {tab === 'personalized' && (
        <div className="space-y-3">
          {personalGuides.length === 0 ? (
            <div className="card text-center py-12">
              <BookHeart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No conditions set in your profile.</p>
              <p className="text-gray-400 text-sm mt-1">Add your medical conditions in Profile → Medical tab to see personalized guides.</p>
            </div>
          ) : (
            personalGuides.map(g => (
              <DiseaseCard key={g.id} disease={g} onClick={() => openGuide(g.id)} />
            ))
          )}
        </div>
      )}

      {/* All Guides */}
      {tab === 'all' && (
        <div className="space-y-3">
          {loading ? (
            [1,2,3,4].map(i => <div key={i} className="card h-20 shimmer" />)
          ) : (
            diseases.map(d => (
              <DiseaseCard key={d.id} disease={d} onClick={() => openGuide(d.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
