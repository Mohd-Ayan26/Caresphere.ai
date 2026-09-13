// src/pages/ProfilePage.jsx — Clean Enterprise Profile & Settings
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Phone, Heart, Shield, Contrast, ZoomIn, Volume2, Moon, Save, Lock, Activity, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { updateProfile } from '../store/slices/authSlice';
import { toggleDarkMode, toggleHighContrast, toggleLargeFont, toggleVoice } from '../store/slices/uiSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

const CONDITIONS = [
  'Diabetes','Hypertension','Heart Disease','Arthritis','Asthma',
  'COPD','Kidney Disease','Osteoporosis','Depression',
];

const ALLERGIES = [
  'Penicillin','Aspirin','Ibuprofen','Sulfa Drugs','Codeine',
  'Latex','Shellfish','Nuts','Dairy','Gluten',
];

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(s => s.auth);
  const { darkMode, highContrast, largeFont, voiceEnabled } = useSelector(s => s.ui);

  const [tab, setTab] = useState('personal');
  const [form, setForm] = useState({
    name:        user?.name        || '',
    phone:       user?.phone       || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    gender:      user?.gender      || '',
    bloodGroup:  user?.bloodGroup  || '',
    address:     user?.address     || '',
    medicalConditions: user?.medicalConditions || [],
    allergies:         user?.allergies         || [],
    preferredLanguage: user?.preferredLanguage || 'en',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [caregiverEmail, setCaregiverEmail] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleArrayItem = (key, item) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(item) ? f[key].filter(i => i !== item) : [...f[key], item],
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
      else if (v) fd.append(k, v);
    });
    await dispatch(updateProfile(fd));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match.'); return; }
    try {
      await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password.'); }
  };

  const handleLinkCaregiver = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/link-caregiver', { caregiverEmail });
      toast.success('Caregiver linked');
      setCaregiverEmail('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to link caregiver.'); }
  };

  const tabs = [
    { id: 'personal',  label: 'Personal Info' },
    { id: 'medical',   label: 'Medical Info' },
    { id: 'security',  label: 'Security' },
    { id: 'access',    label: 'Accessibility' },
    { id: 'caregiver', label: 'Caregiver Link' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Patient Profile & Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage personal demographics, medical history & account preferences</p>
        </div>
        <div className="text-xs text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Level {user?.level || 1} Patient · {user?.xp || 0} XP
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`pb-2.5 text-xs font-bold capitalize transition-colors border-b-2
              ${tab === t.id ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {tab === 'personal' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Demographic Details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
              <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number</label>
              <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Date of Birth</label>
              <input type="date" className="input-field" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Blood Group</label>
              <select className="input-field" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Language</label>
              <select className="input-field" value={form.preferredLanguage} onChange={e => set('preferredLanguage', e.target.value)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            Save Demographics
          </button>
        </form>
      )}

      {/* Medical Info */}
      {tab === 'medical' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Pre-existing Medical Conditions</h3>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <button key={c} type="button" onClick={() => toggleArrayItem('medicalConditions', c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                    ${form.medicalConditions.includes(c) ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-slate-50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Allergies</h3>
            <div className="flex flex-wrap gap-2">
              {ALLERGIES.map(a => (
                <button key={a} type="button" onClick={() => toggleArrayItem('allergies', a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                    ${form.allergies.includes(a) ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-slate-50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            Save Medical History
          </button>
        </form>
      )}

      {/* Security */}
      {tab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Change Account Password</h2>
          <input type="password" required className="input-field" placeholder="Current Password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
          <input type="password" required minLength={6} className="input-field" placeholder="New Password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
          <input type="password" required minLength={6} className="input-field" placeholder="Confirm New Password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
          <button type="submit" className="btn-primary w-full py-2.5">Update Password</button>
        </form>
      )}

      {/* Accessibility */}
      {tab === 'access' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Accessibility Controls</h2>
          {[
            { label: 'Dark Theme',      desc: 'Reduces screen glare', active: darkMode, action: toggleDarkMode },
            { label: 'High Contrast',  desc: 'Enhances text visibility', active: highContrast, action: toggleHighContrast },
            { label: 'Large Font Scaling', desc: 'Enlarges interface text', active: largeFont, action: toggleLargeFont },
            { label: 'Voice Narration',  desc: 'Enables text-to-speech', active: voiceEnabled, action: toggleVoice },
          ].map(({ label, desc, active, action }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{label}</p>
                <p className="text-[11px] text-slate-400">{desc}</p>
              </div>
              <button onClick={() => dispatch(action())} className={`px-3 py-1 rounded text-[11px] font-bold ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {active ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Caregiver Link */}
      {tab === 'caregiver' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Caregiver Integration</h2>
          <form onSubmit={handleLinkCaregiver} className="space-y-3">
            <input type="email" required className="input-field" placeholder="Caregiver Email Address" value={caregiverEmail} onChange={e => setCaregiverEmail(e.target.value)} />
            <button type="submit" className="btn-primary w-full py-2.5">Link Caregiver</button>
          </form>
        </div>
      )}
    </div>
  );
}
