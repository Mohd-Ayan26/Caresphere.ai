// src/pages/auth/LoginPage.jsx — Clean Enterprise Login Page
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Heart, Eye, EyeOff, Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import { loginUser } from '../../store/slices/authSlice';

export default function LoginPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading } = useSelector(s => s.auth);
  const [form, setForm]   = useState({ email: '', password: '' });
  const [show, setShow]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(loginUser(form));
    if (res.meta.requestStatus === 'fulfilled') navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <Heart className="w-7 h-7 text-white fill-white/20" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">CareSphere AI</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Clinical Support & Patient Health Telemetry</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter your credentials to access your clinical dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="input-field-icon"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field-icon"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Helper Notice */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> New users can create an account in 1 click below.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-xs font-bold shadow-md">
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Create Account
            </Link>
          </div>
        </motion.div>

        <p className="text-center text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">
            ← Back to CareSphere Home
          </Link>
        </p>
      </div>
    </div>
  );
}
