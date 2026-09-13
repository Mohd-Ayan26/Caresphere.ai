// src/pages/NutritionPage.jsx — Clean Enterprise Nutrition Telemetry & Formatted AI Diet Plans
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Salad, Droplets, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { fetchTodayNutrition, addMeal, fetchTodayWater, logWater } from '../store/slices/nutritionSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const WATER_AMOUNTS = [150, 200, 250, 300, 500];

/** Helper to parse bold/italic formatting in inline text */
function parseInline(str) {
  if (!str) return '';
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let match;
  let lastIndex = 0;
  let keyIdx = 0;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={keyIdx++} className="font-bold text-slate-900 dark:text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={keyIdx++} className="italic text-slate-500 dark:text-slate-400">{token.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts.length > 0 ? parts : str;
}

/** Formats Markdown tables, headers, lists, and advice blocks into clean HTML */
function DietPlanFormatter({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Table parsing
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const row = lines[i].trim();
        if (!row.includes('---')) {
          const cells = row.split('|').slice(1, -1).map(c => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(1);
        blocks.push({ type: 'table', header, body });
      }
      continue;
    }

    if (line === '---') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.replace('### ', '') });
      i++;
      continue;
    }

    if (line.startsWith('## ') || line.startsWith('# ')) {
      blocks.push({ type: 'h2', text: line.replace(/^#+\s*/, '') });
      i++;
      continue;
    }

    if (line.startsWith('* ') || line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- '))) {
        items.push(lines[i].trim().replace(/^[*|-]\s*/, ''));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    if (line) {
      blocks.push({ type: 'p', text: line });
    }
    i++;
  }

  return (
    <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'hr') {
          return <hr key={idx} className="my-4 border-slate-200 dark:border-slate-800" />;
        }
        if (block.type === 'h3') {
          return (
            <h3 key={idx} className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mt-4 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {parseInline(block.text)}
            </h3>
          );
        }
        if (block.type === 'h2') {
          return (
            <h2 key={idx} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-2">
              {parseInline(block.text)}
            </h2>
          );
        }
        if (block.type === 'table') {
          return (
            <div key={idx} className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold">
                    {block.header.map((cell, cIdx) => (
                      <th key={cIdx} className="p-2.5 font-semibold uppercase text-[11px] tracking-wider">
                        {parseInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {block.body.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 text-slate-700 dark:text-slate-300">
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={idx} className="space-y-1.5 pl-2 my-2">
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{parseInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'p') {
          const isItalicNote = block.text.startsWith('*') && block.text.endsWith('*');
          if (isItalicNote) {
            return (
              <p key={idx} className="text-[11px] italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/50 my-2">
                {parseInline(block.text.slice(1, -1))}
              </p>
            );
          }
          return <p key={idx} className="my-1">{parseInline(block.text)}</p>;
        }
        return null;
      })}
    </div>
  );
}

export default function NutritionPage() {
  const dispatch = useDispatch();
  const { meals, totals, waterData } = useSelector(s => s.nutrition);
  const [tab, setTab]                 = useState('today');
  const [showMealForm, setShowMealForm] = useState(false);
  const [dietSuggestions, setDietSuggestions] = useState('');
  const [loadingDiet, setLoadingDiet]   = useState(false);
  const [aiEstimating, setAiEstimating] = useState(false);
  const [aiBreakdown, setAiBreakdown]   = useState('');
  const [form, setForm]                 = useState({ mealType: 'breakfast', name: '', quantity: '1 serving', calories: '', protein: '', carbs: '', fat: '' });

  useEffect(() => {
    dispatch(fetchTodayNutrition());
    dispatch(fetchTodayWater());
  }, [dispatch]);

  const handleAiEstimate = async () => {
    if (!form.name || !form.name.trim()) {
      toast.error('Please enter an item name first.');
      return;
    }
    setAiEstimating(true);
    try {
      const { data } = await api.post('/nutrition/estimate-calories', {
        name: form.name,
        quantity: form.quantity || '1 serving'
      });

      if (data.estimated) {
        setForm(f => ({
          ...f,
          calories: data.estimated.calories || '',
          protein: data.estimated.protein || '',
          carbs: data.estimated.carbs || '',
          fat: data.estimated.fat || ''
        }));
        if (data.estimated.summary) {
          setAiBreakdown(data.estimated.summary);
        }
        toast.success(`✨ Groq AI calculated nutrients for ${data.portion || 'portion'} of ${form.name}`);
      }
    } catch (_) {
      toast.error('AI estimation failed. You can enter values manually.');
    } finally {
      setAiEstimating(false);
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('mealType', form.mealType);
    fd.append('name', form.name);
    fd.append('foods', JSON.stringify([{
      name: form.name + (form.quantity ? ` (${form.quantity})` : ''),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      quantity: 1, unit: 'serving',
    }]));
    await dispatch(addMeal(fd));
    setShowMealForm(false);
    setForm({ mealType: 'breakfast', name: '', quantity: '1 serving', calories: '', protein: '', carbs: '', fat: '' });
    setAiBreakdown('');
  };

  const handleWaterLog = async (ml) => {
    await dispatch(logWater({ amount: ml, unit: 'ml' }));
    dispatch(fetchTodayWater());
    toast.success(`+${ml}ml logged`);
  };

  const fetchDietSuggestions = async () => {
    setLoadingDiet(true);
    try {
      const { data } = await api.get('/nutrition/diet-suggestions');
      setDietSuggestions(data.suggestions);
    } catch { toast.error('Could not load suggestions.'); }
    finally { setLoadingDiet(false); }
  };

  const waterPct = waterData?.percentage || 0;
  const goalCals = 2000;
  const calsPct  = Math.min(100, Math.round(((totals?.calories || 0) / goalCals) * 100));

  const mealsByType = MEAL_TYPES.reduce((acc, t) => {
    acc[t] = meals.filter(m => m.mealType === t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Salad className="w-5 h-5 text-blue-600" /> Nutrition & Hydration Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Meal tracking, macronutrient summary & daily fluid intake</p>
        </div>
        <button onClick={() => setShowMealForm(true)} className="btn-primary">
          <Plus className="w-3.5 h-3.5" /> Log Meal Entry
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calories</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{Math.round(totals?.calories || 0)} <span className="text-xs text-slate-400 font-normal">/ {goalCals}</span></p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protein</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{Math.round(totals?.protein || 0)}g</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Carbs</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{Math.round(totals?.carbs || 0)}g</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hydration</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{Math.round((waterData?.totalMl || 0) / 100) / 10}L <span className="text-xs text-slate-400 font-normal">/ 2.0L</span></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {['today','water','diet-ai'].map(t => (
          <button key={t} onClick={() => { setTab(t); if (t==='diet-ai' && !dietSuggestions) fetchDietSuggestions(); }}
            className={`pb-2.5 text-xs font-bold capitalize transition-colors border-b-2
              ${tab === t ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {t === 'today' ? 'Meals' : t === 'water' ? 'Hydration' : 'AI Diet Plan'}
          </button>
        ))}
      </div>

      {/* TODAY'S MEALS */}
      {tab === 'today' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-900 dark:text-white">Daily Calorie Progress</span>
              <span className="text-slate-400">{calsPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${calsPct}%` }} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {MEAL_TYPES.map(type => (
              <div key={type} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider capitalize">{type}</h3>
                  <span className="text-xs font-bold text-blue-600">
                    {mealsByType[type].reduce((s, m) => s + (m.totalCalories || 0), 0)} kcal
                  </span>
                </div>
                {mealsByType[type].length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2">No items logged</p>
                ) : (
                  mealsByType[type].map(m => (
                    <div key={m._id} className="py-1.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
                        <p className="text-[11px] text-slate-400">P:{m.totalProtein}g C:{m.totalCarbs}g F:{m.totalFat}g</p>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{m.totalCalories} kcal</span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WATER TAB */}
      {tab === 'water' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
          <div className="text-center max-w-sm mx-auto">
            <Droplets className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hydration Target: 2,000 ml</h2>
            <p className="text-xs text-slate-400 mt-1">Logged today: {waterData?.totalMl || 0} ml ({waterPct}%)</p>
          </div>

          <div className="grid grid-cols-5 gap-2 max-w-lg mx-auto">
            {WATER_AMOUNTS.map(ml => (
              <button key={ml} onClick={() => handleWaterLog(ml)}
                className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 transition-colors text-center">
                <p className="text-xs font-bold text-blue-600">+{ml}ml</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI DIET PLAN */}
      {tab === 'diet-ai' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> AI Dietary & Nutritional Protocol
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Personalized clinical diet plan based on your medical profile</p>
            </div>
            <button onClick={fetchDietSuggestions} disabled={loadingDiet} className="btn-secondary py-1.5 px-3">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDiet ? 'animate-spin' : ''}`} /> Regenerate
            </button>
          </div>

          {loadingDiet ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-medium">Analyzing health metrics and generating diet plan...</p>
            </div>
          ) : dietSuggestions ? (
            <DietPlanFormatter text={dietSuggestions} />
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 mb-3">No diet plan generated yet for your current profile.</p>
              <button onClick={fetchDietSuggestions} className="btn-primary mx-auto">
                Generate AI Diet Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Meal Modal */}
      {showMealForm && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setShowMealForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Log Meal Item</span>
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Calorie Auto-Fill
                </span>
              </h2>
              <form onSubmit={handleAddMeal} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <select className="input-field" value={form.mealType} onChange={e => setForm(f => ({ ...f, mealType: e.target.value }))}>
                    {MEAL_TYPES.map(t => <option key={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Item Name</label>
                  <input
                    required
                    className="input-field"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Paneer Butter Masala, Oats, Apple"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Quantity / Weight Consumed</label>
                    <button
                      type="button"
                      onClick={handleAiEstimate}
                      disabled={aiEstimating || !form.name.trim()}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-40"
                    >
                      <Sparkles className={`w-3 h-3 ${aiEstimating ? 'animate-spin' : ''}`} />
                      {aiEstimating ? 'AI Estimating...' : 'AI Calculate Portion Nutrients'}
                    </button>
                  </div>
                  <input
                    className="input-field"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    onBlur={() => { if (form.name.trim()) handleAiEstimate(); }}
                    placeholder="e.g. 200 grams, 2 pieces, 1 bowl, 250 ml"
                  />
                </div>

                {aiBreakdown && (
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>AI Portion Breakdown:</strong> {aiBreakdown}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Calories (kcal)</label>
                    <input type="number" min="0" className="input-field" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} placeholder="e.g. 350" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Protein (g)</label>
                    <input type="number" min="0" className="input-field" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} placeholder="e.g. 15" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Carbs (g)</label>
                    <input type="number" min="0" className="input-field" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} placeholder="e.g. 45" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Fat (g)</label>
                    <input type="number" min="0" className="input-field" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} placeholder="e.g. 10" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowMealForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Save Entry</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
