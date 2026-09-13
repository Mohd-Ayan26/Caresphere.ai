// src/components/common/DailyLoginBonusCard.jsx — 1-Time Redeemable Daily Login XP Bonus Widget
import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, Sparkles, Flame } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserLocal } from '../../store/slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DailyLoginBonusCard({ onClaimSuccess }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [streak, setStreak] = useState(user?.streak || 0);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { data } = await api.get('/gamification/progress');
      if (data?.progress) {
        setHasClaimedToday(data.progress.hasClaimedDailyBonusToday);
        setStreak(data.progress.streak || user?.streak || 0);
      }
    } catch (_) {}
  };

  const handleClaim = async () => {
    if (hasClaimedToday || claiming) return;
    setClaiming(true);
    try {
      const { data } = await api.post('/gamification/login-bonus');
      toast.success(data.message || '🎁 Daily Login XP Bonus Claimed!');
      setHasClaimedToday(true);
      setStreak(data.streak || streak);
      dispatch(updateUserLocal({ xp: data.xp, level: data.level, streak: data.streak }));
      if (onClaimSuccess) onClaimSuccess(data);
    } catch (err) {
      if (err.response?.data?.alreadyClaimed || err.response?.data?.hasClaimedDailyBonusToday) {
        setHasClaimedToday(true);
        toast(err.response?.data?.message || 'Daily login bonus already claimed today.', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.message || 'Could not claim daily bonus.');
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 shadow-sm ${
      hasClaimedToday 
        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
        : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border-blue-200 dark:border-blue-800/60'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            hasClaimedToday 
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' 
              : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md'
          }`}>
            {hasClaimedToday ? <CheckCircle className="w-5 h-5" /> : <Gift className="w-5 h-5 animate-bounce" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {hasClaimedToday ? 'Daily Login XP Bonus Claimed' : 'Daily Login XP Bonus Available'}
              </h3>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> {streak}-Day Streak
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {hasClaimedToday 
                ? "You have redeemed today's 1-time daily login reward points. Available again tomorrow!"
                : "Claim your daily login reward points (+20 XP). Available 1 time per day in games & XP sessions."
              }
            </p>
          </div>
        </div>

        <button
          onClick={handleClaim}
          disabled={hasClaimedToday || claiming}
          className={`shrink-0 text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            hasClaimedToday
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-600'
              : 'btn-primary shadow-sm hover:scale-105 active:scale-95'
          }`}
        >
          {claiming ? (
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
          ) : hasClaimedToday ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Redeemed Today (+20 XP)
            </>
          ) : (
            <>
              <Gift className="w-3.5 h-3.5" /> Claim Daily Bonus (+20 XP)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
