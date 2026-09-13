// src/pages/DashboardPage.jsx — Professional Enterprise Dashboard
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Pill, Heart, Salad, AlertTriangle, BookHeart, Gamepad2,
  Bot, CheckCircle, Clock, Droplets, Activity, ArrowRight,
  ChevronRight, Wind, Brain, Shield,
} from 'lucide-react';
import { fetchDashboardStats } from '../store/slices/authSlice';
import { fetchTodayReminders } from '../store/slices/medicineSlice';
import { fetchTodayWater } from '../store/slices/nutritionSlice';
import AQIModule from './modules/AQIModule';

const modules = [
  { path: '/medicines',   icon: Pill,          label: 'Medicines',           desc: 'Reminders & adherence tracking' },
  { path: '/wellness',    icon: Heart,         label: 'Wellness & Sessions', desc: 'Pre-recorded audio, mood & journaling' },
  { path: '/nutrition',   icon: Salad,         label: 'Nutrition',           desc: 'Meal tracking & hydration' },
  { path: '/emergency',   icon: AlertTriangle, label: 'Emergency SOS',       desc: 'Immediate contact alerts' },
  { path: '/health-diary',icon: BookHeart,     label: 'Health Diary',        desc: 'Vitals & symptom logs' },
  { path: '/aqi',         icon: Wind,          label: 'Air Quality',         desc: 'Environmental health advisories' },
  { path: '/gamification',icon: Gamepad2,      label: 'Health Goals',        desc: 'Achievements & daily streak' },
  { path: '/chat',        icon: Bot,           label: 'AI Assistant',        desc: 'Voice & text health guidance' },
];

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user, dashboardStats } = useSelector(s => s.auth);
  const { reminders }  = useSelector(s => s.medicine);
  const { waterData }  = useSelector(s => s.nutrition);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchTodayReminders());
    dispatch(fetchTodayWater());
  }, [dispatch]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const pending  = reminders.filter(r => r.status === 'pending');
  const taken    = reminders.filter(r => r.status === 'taken').length;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium mb-3">
            <Shield className="w-3.5 h-3.5" /> CareSphere Patient Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {pending.length > 0
              ? `You have ${pending.length} pending medication schedule item${pending.length > 1 ? 's' : ''} for today.`
              : 'All scheduled medications for today have been completed.'}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 max-w-md">
            <div>
              <p className="text-lg font-bold text-white">{user?.xp || 0} XP</p>
              <p className="text-xs text-slate-400 font-medium">Total XP</p>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <p className="text-lg font-bold text-white">Lv. {user?.level || 1}</p>
              <p className="text-xs text-slate-400 font-medium">Level</p>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <p className="text-lg font-bold text-white">{user?.streak || 0} Days</p>
              <p className="text-xs text-slate-400 font-medium">Active Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Medications" value={reminders.length} sub={`${taken} completed`} icon={Pill} />
        <StatCard label="30-Day Adherence" value={`${dashboardStats?.complianceRate??0}%`} sub="Target: >90%" icon={CheckCircle} />
        <StatCard label="Water Intake" value={`${Math.round((waterData?.totalMl||0)/100)/10}L`} sub={`${waterData?.percentage||0}% of daily goal`} icon={Droplets} />
        <StatCard label="Mood Score" value={dashboardStats?.avgMoodScore??'—'} sub="Daily average /10" icon={Heart} />
      </div>

      {/* AQI Widget & Schedule */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AQI Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Wind className="w-4 h-4 text-blue-600" /> Air Quality Advisory
            </h2>
            <Link to="/aqi" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Full Telemetry <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <AQIModule compact={true} />
        </div>

        {/* Schedule Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Medication Schedule
            </h2>
            <Link to="/medicines" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Manage All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            {reminders.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No medications scheduled for today.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {reminders.slice(0, 4).map((r) => (
                  <div key={r._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${r.status==='taken'?'bg-emerald-500':r.status==='missed'?'bg-rose-500':'bg-blue-600'}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{r.medicineId?.name||'Medication'}</p>
                        <p className="text-[11px] text-slate-400">
                          {r.medicineId?.dosage} {r.medicineId?.unit} · {new Date(r.scheduledTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                      r.status==='taken' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      r.status==='missed'? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Healthcare Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.path} to={m.path}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{m.label}</h3>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{m.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/chat"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-500 transition-all shadow-sm flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">AI Health Assistant</h3>
            <p className="text-[11px] text-slate-400">Ask questions about symptoms or medications</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link to="/emergency"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-rose-500 transition-all shadow-sm flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Emergency Contacts</h3>
            <p className="text-[11px] text-slate-400">Manage SOS contacts & dispatch alerts</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
