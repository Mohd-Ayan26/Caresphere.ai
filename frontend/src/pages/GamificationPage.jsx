// src/pages/GamificationPage.jsx — Clean Enterprise Health Goals & Gamification
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Target, Users, Gift } from 'lucide-react';
import api from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserLocal } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

import DailyLoginBonusCard from '../components/common/DailyLoginBonusCard';

export default function GamificationPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [progress, setProgress]       = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges]   = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tab, setTab]                 = useState('overview');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [p, c, l] = await Promise.all([
        api.get('/gamification/progress'),
        api.get('/gamification/challenges'),
        api.get('/gamification/leaderboard'),
      ]);
      setProgress(p.data.progress);
      setAchievements(p.data.achievements || []);
      setChallenges(c.data.challenges || []);
      setLeaderboard(l.data.leaderboard || []);
    } catch { /* silent */ }
  };

  const xp     = progress?.xp     || user?.xp     || 0;
  const level  = progress?.level  || user?.level  || 1;
  const streak = progress?.streak || user?.streak || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-blue-600" /> Patient Engagement & XP
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Earn health points, complete adherence targets, and reach health milestones</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span>Level {level}</span>
          <span>·</span>
          <span>{xp} XP</span>
          <span>·</span>
          <span>{streak} Day Streak</span>
        </div>
      </div>

      {/* 1-Time Redeem Daily Login Bonus Card */}
      <DailyLoginBonusCard onClaimSuccess={fetchAll} />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {['overview','challenges','achievements','leaderboard'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 text-xs font-bold capitalize transition-colors border-b-2
              ${tab === t ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview Grid */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { action: 'Take Medication', xp: '+10 XP' },
            { action: 'Log Water Goal',  xp: '+5 XP'  },
            { action: 'Mindfulness',     xp: '+15 XP' },
            { action: 'Daily Login',     xp: '+10 XP' },
            { action: 'Mood Assessment', xp: '+5 XP'  },
            { action: 'Write Journal',   xp: '+8 XP'  },
            { action: 'Log Symptoms',    xp: '+5 XP'  },
            { action: 'Complete Target', xp: '+30 XP' },
          ].map((r, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{r.action}</p>
              <p className="text-sm font-bold text-blue-600 mt-1">{r.xp}</p>
            </div>
          ))}
        </div>
      )}

      {/* Challenges */}
      {tab === 'challenges' && (
        <div className="space-y-3">
          {challenges.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No active challenges.</p>
          ) : (
            challenges.map(c => (
              <div key={c._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">{c.title}</h3>
                  <span className="font-bold text-blue-600">+{c.xpReward} XP</span>
                </div>
                <p className="text-slate-400">{c.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Achievements */}
      {tab === 'achievements' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {achievements.map((a, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs text-xs">
              <p className="font-bold text-slate-900 dark:text-white">{a.title}</p>
              <p className="text-slate-400 mt-0.5">{a.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 shadow-xs text-xs">
          {leaderboard.map((u, i) => (
            <div key={i} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-400 w-4">{i + 1}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{u.name}</span>
              </div>
              <span className="font-bold text-blue-600">{u.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
