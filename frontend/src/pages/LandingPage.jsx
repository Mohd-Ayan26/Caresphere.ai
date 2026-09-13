// src/pages/LandingPage.jsx — Professional Enterprise Healthcare Landing Page
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Pill, Brain, Salad, ShieldAlert, BookOpen,
  Gamepad2, Bot, ArrowRight, CheckCircle, Users,
  Activity, Shield, Check, Lock, Mic, Globe2, Sparkles,
} from 'lucide-react';

const features = [
  { icon: Pill,        title: 'Medication Management', desc: 'Automated schedules, prescription scanning, and compliance logging.' },
  { icon: Brain,       title: 'Mental Wellness',       desc: 'Guided meditation, mood tracking, and mental health telemetry.' },
  { icon: Salad,       title: 'Nutrition Tracking',    desc: 'AI meal parsing, daily calorie metrics, and hydration monitoring.' },
  { icon: ShieldAlert, title: 'Emergency SOS',         desc: 'One-click SOS triggers, contact notifications, and location sharing.' },
  { icon: BookOpen,    title: 'Health Diary',          desc: 'Symptom tracking, vital sign logs, and exportable PDF summaries.' },
  { icon: Gamepad2,    title: 'Gamification & XP',     desc: 'Daily health tasks, streak metrics, and wellness achievement rewards.' },
  { icon: Bot,         title: 'AI Health Assistant',   desc: 'Groq AI clinical guidance, voice narration, and multilingual Q&A.' },
  { icon: Activity,    title: 'Health Telemetry',      desc: 'Real-time AQI reports, weather advisories, and wellness stats.' },
];

const stats = [
  { value: '99.8%', label: 'Uptime Reliability' },
  { value: '24/7',  label: 'AI Guidance'       },
  { value: '100%',  label: 'Accessibility'     },
  { value: 'HIPAA', label: 'Conscious Design'  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">CareSphere</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login"
              className="text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors">
              Sign In
            </Link>
            <Link to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-white border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60 mb-6">
                <Shield className="w-3.5 h-3.5" /> Enterprise AI Healthcare Platform
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-none mb-6">
                Intelligent healthcare for dignified living.
              </h1>
              <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                CareSphere integrates medication schedules, AI health assistance, emergency response, and wellness tracking into a clean, accessible platform designed for patients and caregivers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
                  Create Account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" /> Sign In
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Comprehensive Medical Modules</h2>
            <p className="text-slate-500 text-sm">
              Purpose-built tools empowering patients with independence and giving caregivers peace of mind.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-6 hover:border-blue-500 transition-all shadow-xs">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accessibility & Safety Section */}
      <section className="py-16 bg-slate-900 text-white border-t border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Designed for Universal Accessibility
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            CareSphere includes native support for high-contrast modes, scalable font controls, text-to-speech narration, and full keyboard navigation.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {['High Contrast', 'Large Font Scaling', 'Voice Narration', 'Multilingual AI', 'Live Emergency SOS', 'Caregiver Alerts'].map((tag, i) => (
              <span key={i} className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3.5 py-1.5 rounded-md font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-900">CareSphere Healthcare Systems</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 CareSphere AI. Clean, secure, and accessible medical software.</p>
        </div>
      </footer>
    </div>
  );
}
