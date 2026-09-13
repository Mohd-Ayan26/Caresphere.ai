// src/pages/EmergencyPage.jsx — Clean Enterprise Emergency SOS
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, Plus, Trash2, Shield, Navigation } from 'lucide-react';
import api from '../services/api';
import { emitSOS } from '../services/socket';
import toast from 'react-hot-toast';

export default function EmergencyPage() {
  const { user } = useSelector(s => s.auth);
  const [contacts, setContacts]     = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [location, setLocation]     = useState(null);
  const [sosActive, setSosActive]   = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [countdown, setCountdown]   = useState(0);
  const [form, setForm]             = useState({ name: '', phone: '', relation: '', email: '', isPrimary: false });

  useEffect(() => {
    fetchContacts();
    fetchAlerts();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setLocation({ lat: 40.7128, lng: -74.0060 })
      );
    }
  }, []);

  const fetchContacts = async () => {
    try { const { data } = await api.get('/emergency/contacts'); setContacts(data.contacts); }
    catch { /* silent */ }
  };

  const fetchAlerts = async () => {
    try { const { data } = await api.get('/emergency/alerts'); setAlerts(data.alerts.slice(0, 5)); }
    catch { /* silent */ }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      await api.post('/emergency/contacts', form);
      toast.success('Emergency contact added');
      setShowAdd(false);
      setForm({ name: '', phone: '', relation: '', email: '', isPrimary: false });
      fetchContacts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add contact'); }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Remove this emergency contact?')) return;
    try { await api.delete(`/emergency/contacts/${id}`); fetchContacts(); toast.success('Contact removed'); }
    catch { toast.error('Failed to remove contact.'); }
  };

  const triggerSOS = useCallback(async () => {
    if (sosActive) return;
    setSosActive(true);
    for (let i = 5; i > 0; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(0);
    try {
      await api.post('/emergency/sos', {
        location,
        message: `SOS from ${user?.name}! Emergency assistance needed!`,
      });
      emitSOS(user?._id, location);
      toast.error('SOS Alert Sent! Help is on the way.', { duration: 8000 });
      fetchAlerts();
    } catch { toast.error('SOS failed to send.'); }
  }, [sosActive, location, user]);

  const cancelSOS = () => { setSosActive(false); setCountdown(0); };

  const medicalCard = {
    name:       user?.name,
    dob:        user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A',
    blood:      user?.bloodGroup || 'Unknown',
    conditions: user?.medicalConditions?.join(', ') || 'None',
    allergies:  user?.allergies?.join(', ')         || 'None',
    medicines:  user?.currentMedications?.join(', ')|| 'None',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" /> Emergency SOS Response
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">One-tap emergency alert dispatch, contacts & medical ID</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-danger">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </div>

      {/* SOS Trigger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-xs text-center">
        <AnimatePresence mode="wait">
          {sosActive ? (
            <div className="flex flex-col items-center gap-4">
              {countdown > 0 ? (
                <>
                  <div className="w-32 h-32 bg-rose-600 text-white rounded-full flex flex-col items-center justify-center shadow-lg animate-pulse">
                    <p className="text-4xl font-bold">{countdown}</p>
                    <p className="text-[11px] uppercase tracking-wider font-semibold">Dispatching SOS</p>
                  </div>
                  <button onClick={cancelSOS} className="btn-secondary">Cancel SOS</button>
                </>
              ) : (
                <>
                  <div className="w-32 h-32 bg-rose-600 text-white rounded-full flex flex-col items-center justify-center shadow-lg">
                    <AlertTriangle className="w-10 h-10 mb-1" />
                    <p className="text-xs font-bold uppercase tracking-wider">SOS Sent</p>
                  </div>
                  <button onClick={() => setSosActive(false)} className="btn-secondary">Acknowledge / Reset</button>
                </>
              )}
            </div>
          ) : (
            <div>
              <button onClick={triggerSOS} className="w-36 h-36 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex flex-col items-center justify-center mx-auto shadow-md transition-all active:scale-95">
                <AlertTriangle className="w-10 h-10 mb-1" />
                <span className="text-xl font-bold tracking-wider">SOS</span>
                <span className="text-[10px] uppercase font-semibold text-rose-200 mt-0.5">Press to trigger</span>
              </button>
              <p className="text-xs text-slate-400 mt-4 font-medium">Will dispatch location alerts to {contacts.length} registered contacts</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Location */}
      {location && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Navigation className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Active Location Telemetry</p>
              <p className="text-[11px] text-slate-400">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">Live GPS</span>
        </div>
      )}

      {/* Contacts Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Emergency Contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No contacts added.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {contacts.map(c => (
              <div key={c._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</p>
                    {c.isPrimary && <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">Primary</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{c.relation}</p>
                  <a href={`tel:${c.phone}`} className="text-xs font-semibold text-blue-600 hover:underline mt-1 block">{c.phone}</a>
                </div>
                <button onClick={() => handleDeleteContact(c._id)} className="text-slate-400 hover:text-rose-600 p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical Card */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Patient Emergency Medical Card</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div><p className="text-[11px] text-slate-400">Name</p><p className="font-semibold">{medicalCard.name}</p></div>
          <div><p className="text-[11px] text-slate-400">Blood Group</p><p className="font-semibold">{medicalCard.blood}</p></div>
          <div><p className="text-[11px] text-slate-400">Date of Birth</p><p className="font-semibold">{medicalCard.dob}</p></div>
          <div><p className="text-[11px] text-slate-400">Conditions</p><p className="font-semibold">{medicalCard.conditions}</p></div>
          <div><p className="text-[11px] text-slate-400">Allergies</p><p className="font-semibold">{medicalCard.allergies}</p></div>
          <div><p className="text-[11px] text-slate-400">Medications</p><p className="font-semibold">{medicalCard.medicines}</p></div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add Emergency Contact</h2>
              <form onSubmit={handleAddContact} className="space-y-3">
                <input required className="input-field" placeholder="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <input required type="tel" className="input-field" placeholder="Phone Number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                <input required className="input-field" placeholder="Relationship (e.g. Spouse, Son, Doctor)" value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))} />
                <input type="email" className="input-field" placeholder="Email Address" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-danger flex-1">Save Contact</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
