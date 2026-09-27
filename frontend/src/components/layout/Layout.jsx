// src/components/layout/Layout.jsx — Professional, Clean Enterprise Layout
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Pill, Heart, Salad, AlertTriangle,
  BookHeart, Gamepad2, Bot, User, LogOut, Bell,
  Menu, X, Sun, Moon, ZoomIn, Contrast, Volume2, VolumeX,
  ChevronRight, Wind, Brain, Activity, Navigation,
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import {
  toggleSidebar, closeSidebar, toggleDarkMode,
  toggleHighContrast, toggleLargeFont, toggleVoice, markAllRead,
} from '../../store/slices/uiSlice';
import { getSocket } from '../../services/socket';

// Live Global Emergency Listener & Popup Modal
function GlobalEmergencyListener({ user }) {
  const [activeSOS, setActiveSOS] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleSOS = (data) => {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
      setActiveSOS(data);
    };

    user.linkedPatients?.forEach((patientId) => {
      socket.on(`emergency:${patientId}`, handleSOS);
    });
    socket.on(`emergency:${user._id}`, handleSOS);

    return () => {
      user.linkedPatients?.forEach((patientId) => {
        socket.off(`emergency:${patientId}`, handleSOS);
      });
      socket.off(`emergency:${user._id}`, handleSOS);
    };
  }, [user]);

  if (!activeSOS) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md animate-pulse">
      <div className="bg-white dark:bg-slate-900 border-2 border-rose-600 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/50">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md animate-bounce">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">🚨 EMERGENCY SOS ALERT!</h2>
              <p className="text-xs text-rose-600 font-semibold">Immediate Assistance Requested</p>
            </div>
          </div>
          <button onClick={() => setActiveSOS(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong>Message:</strong> {activeSOS.message || 'Patient pressed the emergency SOS button!'}
          </p>
          {activeSOS.location && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Navigation className="w-4 h-4" />
              <span>
                Coordinates: {activeSOS.location.lat?.toFixed(4)}, {activeSOS.location.lng?.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {activeSOS.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activeSOS.location.lat},${activeSOS.location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md"
            >
              <Navigation className="w-4 h-4" /> Get Directions
            </a>
          )}
          <button
            onClick={() => setActiveSOS(null)}
            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center"
          >
            Acknowledge / Close
          </button>
        </div>
      </div>
    </div>
  );
}

const navItems = [
  { path: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/medicines',    icon: Pill,            label: 'Medicines' },
  { path: '/wellness',     icon: Heart,           label: 'Wellness & Sessions' },
  { path: '/nutrition',    icon: Salad,           label: 'Nutrition' },
  { path: '/emergency',    icon: AlertTriangle,   label: 'Emergency SOS' },
  { path: '/health-diary', icon: BookHeart,       label: 'Health Diary' },
  { path: '/aqi',          icon: Wind,            label: 'Air Quality' },
  { path: '/gamification', icon: Gamepad2,        label: 'Games & XP' },
  { path: '/chat',         icon: Bot,             label: 'AI Assistant' },
];

export default function Layout({ children }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useSelector(s => s.auth);
  const { sidebarOpen, darkMode, highContrast, largeFont, voiceEnabled, unreadCount } = useSelector(s => s.ui);

  useEffect(() => { dispatch(closeSidebar()); }, [location.pathname, dispatch]);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };
  const activeItem   = navItems.find(n => location.pathname === n.path);

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Live SOS Emergency Listener */}
      <GlobalEmergencyListener user={user} />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => dispatch(closeSidebar())} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col w-64
        ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}
        border-r transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">CareSphere</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Healthcare Portal</p>
            </div>
          </Link>
          <button onClick={() => dispatch(closeSidebar())} className="lg:hidden p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className={`mx-3 mt-3 p-3 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user?.role || 'Patient'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Lv.{user?.level || 1}</span>
            </div>
          </div>
          <div className="mt-2.5 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(user?.xp || 0) % 100}%` }} />
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                    : `${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Accessibility Quick Actions */}
        <div className={`mx-3 mb-2 p-2.5 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Accessibility</p>
          <div className="grid grid-cols-4 gap-1">
            {[
              { icon: darkMode ? Sun : Moon, action: toggleDarkMode,     active: darkMode,     tip: 'Theme'     },
              { icon: Contrast,              action: toggleHighContrast, active: highContrast, tip: 'Contrast'  },
              { icon: ZoomIn,               action: toggleLargeFont,    active: largeFont,    tip: 'Font Size' },
              { icon: voiceEnabled ? Volume2 : VolumeX, action: toggleVoice, active: voiceEnabled, tip: 'Voice' },
            ].map(({ icon: Icon, action, active, tip }, i) => (
              <button key={i} onClick={() => dispatch(action())} title={tip}
                className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200/60 dark:border-slate-600'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <Link to="/profile" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            <User className="w-4 h-4 text-slate-400" /> Account Settings
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 w-full transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-6 border-b flex-shrink-0
          ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => dispatch(toggleSidebar())}
              className={`p-2 rounded-lg transition-colors lg:hidden ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">{activeItem?.label || 'CareSphere AI'}</h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric', year:'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => dispatch(markAllRead())}
              className={`relative p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-700 ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>
            <Link to="/emergency" className="bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-rose-700 transition-colors shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5" /> Emergency SOS
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className={`flex-1 overflow-y-auto ${darkMode ? 'bg-slate-950' : 'bg-slate-50/50'}`}>
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
