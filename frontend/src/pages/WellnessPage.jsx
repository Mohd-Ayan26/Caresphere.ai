// src/pages/WellnessPage.jsx — Integrated 5-Minute Wellness, Guided Sessions & AI Summary Hub
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Plus, Brain, X, Play, Pause, RotateCcw,
  Volume2, VolumeX, CheckCircle, Clock, Sparkles, Music,
  Languages, Disc, Wind, Smile, Radio, Bot, ShieldCheck
} from 'lucide-react';
import { logMood, fetchMoodHistory, logMeditation } from '../store/slices/wellnessSlice';
import { speakText, stopSpeech, pauseSpeech, resumeSpeech } from '../utils/speech';
import { playBell, startAmbient, stopAmbient } from '../utils/ambientAudio';
import api from '../services/api';

import DailyLoginBonusCard from '../components/common/DailyLoginBonusCard';

const MOODS = [
  { value: 'great',    score: 10, label: 'Great',    color: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { value: 'good',     score: 7,  label: 'Good',     color: 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
  { value: 'okay',     score: 5,  label: 'Okay',     color: 'border-slate-400 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'sad',      score: 3,  label: 'Sad',      color: 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
  { value: 'terrible', score: 1,  label: 'Terrible', color: 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
];

// 🌿 5-Minute Guided Audio Sessions (English)
const AUDIO_SESSIONS_ENGLISH = [
  {
    type: 'mp3_guided',
    label: 'Saans Lo Shanti Ki (Pre-Recorded MP3)',
    duration: 5,
    desc: '🎵 Direct 5-minute pre-recorded studio audio session: Saans Lo Shanti Ki.',
    audioUrl: '/audio/Saans_Lo_Shanti_Ki.mp3',
    steps: [
      "Saans Lo Shanti Ki - Pre-recorded studio meditation audio playing.",
      "Rest comfortably, breathe deeply, and enjoy this calming track."
    ]
  },
  {
    type: 'guided_meditation',
    label: '5-Min Inner Calm Meditation',
    duration: 5,
    desc: '5-minute audio-guided breath awareness & body grounding session.',
    steps: [
      "Welcome to your 5-minute Inner Calm Meditation. Sit comfortably, support your back, and softly close your eyes.",
      "Inhale slowly and deeply through your nose... hold gently... and softly exhale through your mouth.",
      "Allow your shoulders to drop away from your ears, letting go of any tension you carried today.",
      "Feel the natural coolness of your breath as it enters... and gentle warmth as you exhale.",
      "Visualize sitting beside a quiet, crystal-clear lake. Every soft breeze brings deep stillness to your heart.",
      "Take one last nourishing breath... and open your eyes with a peaceful smile, carrying this calm into your day."
    ]
  },
  {
    type: 'mindfulness',
    label: '5-Min Mindfulness & Gratitude',
    duration: 5,
    desc: '5-minute sensory grounding & gratitude reflection.',
    steps: [
      "Welcome to your 5-minute Mindfulness Practice. Find a quiet position and take a grounding breath.",
      "Bring your gentle attention to three quiet sounds around you right now.",
      "Feel the steady, unshakeable support of the chair or bed beneath you.",
      "Think of one simple thing in your life you feel truly grateful for today.",
      "Allow all busy thoughts to float away like soft clouds across a clear blue sky.",
      "Return your focus to your breath, centered, relaxed, and fully present."
    ]
  },
  {
    type: 'sleep_meditation',
    label: '5-Min Deep Sleep Relaxation',
    duration: 5,
    desc: '5-minute bedtime audio relaxation for deep sleep.',
    steps: [
      "Welcome to your 5-minute Bedtime Sleep Relaxation. Lie down comfortably and dim all lights.",
      "Take a slow, deep breath in for four seconds... hold gently... and release for six seconds.",
      "Feel a wave of soothing warmth flowing down through your feet, legs, and lower back.",
      "Soften your jaw, unclench your teeth, and let your eyelids become delightfully heavy.",
      "Your work for today is finished. You are safe, peaceful, and unburdened.",
      "Drift softly into deep, restorative, uninterrupted sleep."
    ]
  },
  {
    type: 'breathing',
    label: '5-Min Box Breathing Protocol',
    duration: 5,
    desc: '5-minute rhythmic 4-4-4-4 box breathing for instant calm.',
    steps: [
      "Welcome to the 5-Minute Box Breathing Protocol. Sit upright and empty your lungs.",
      "Inhale slowly through your nose... one, two, three, four.",
      "Hold your breath gently... one, two, three, four.",
      "Exhale slowly through your mouth... one, two, three, four.",
      "Hold empty... one, two, three, four.",
      "Repeat: Inhale 2, 3, 4... Hold 2, 3, 4... Exhale 2, 3, 4... Hold 2, 3, 4. Notice your steady, calm pulse."
    ]
  },
  {
    type: 'stress_relief',
    label: '5-Min Stress & Tension Release',
    duration: 5,
    desc: '5-minute audio guide to release neck & shoulder stress.',
    steps: [
      "Welcome to your 5-minute Stress Release Session. Let's melt away physical and mental tension.",
      "Gently roll your shoulders backward in slow, soothing circles... three times.",
      "Tilt your head softly to the right... hold for five seconds... then gently to the left.",
      "Place your hand over your chest, feeling the calm rhythm of your heart.",
      "Remind yourself: I am safe. I am calm. My body is resilient and at peace.",
      "Take a deep, cleansing exhale and release all lingering stress."
    ]
  }
];

// 🇮🇳 5-Minute Guided Audio Sessions (Hinglish)
const AUDIO_SESSIONS_HINGLISH = [
  {
    type: 'mp3_guided',
    label: 'Saans Lo Shanti Ki (Pre-Recorded MP3)',
    duration: 5,
    desc: '🎵 Direct 5-minute studio pre-recorded audio session: Saans Lo Shanti Ki.',
    audioUrl: '/audio/Saans_Lo_Shanti_Ki.mp3',
    steps: [
      "Saans Lo Shanti Ki - Studio pre-recorded audio track playing.",
      "Aaram se baithayein, lambi saans lein aur is shant sangeet ka anand lein."
    ]
  },
  {
    type: 'guided_meditation',
    label: '5-Min Inner Calm Meditation (Hinglish)',
    duration: 5,
    desc: '5-minute soothing Hinglish audio guide for mental clarity, body relaxation & inner peace.',
    steps: [
      "Hello... Abhi ke liye, bas sab kuch side mein rakh dijiye. Jo bhi thoughts hain, jo bhi kaam pending hai, unhe kuch der ke liye pause kar dijiye. Aaram se baith jaiye, apni back ko comfortable rakhiye, aur apne shoulders ko relax hone dijiye. Ab dheere se apni aankhein band kijiye. Ek gehri saans lijiye... Saans andar... Aur dheere se bahar chhodiye... Saans andar... Aur dheere se bahar.",
      "Ab apna attention sirf apni breathing par le aaiye. Kuch change karne ki zaroorat nahi hai. Bas notice kijiye... Hawa andar aa rahi hai, aur hawa bahar ja rahi hai. Har breath ke saath apne body ko thoda aur relax hone dijiye. Agar mind mein koi thought aaye, use rokne ki koshish mat kijiye. Bas us thought ko notice kijiye, aur gently apna attention wapas breathing par le aaiye. Aapko abhi kuch achieve nahi karna hai. Aapko kahin jaana nahi hai. Bas is moment mein rehna hai.",
      "Ab apne shoulders par dhyaan dijiye. Kya wahan thoda tension hai? Agar hai, toh use dheere se release kijiye. Apne shoulders ko halka mehsoos kijiye. Ab apne face ko relax kijiye... Jaw ko loose hone dijiye... Forehead ko relax kijiye... Aur aankhon ke aas-paas ki muscles ko bhi soft hone dijiye. Ab apne poore body ko feel kijiye. Aap safe hain. Aap yahan hain. Aur iss waqt, aapko bas rest karne ki permission hai. Ek deep breath lijiye, aur saari unnecessary tension ko exhale ke saath bahar jaane dijiye.",
      "Ab apne mind mein ek simple thought rakhiye... Main theek hoon. Phir dheere se kahiye... Mujhe har cheez abhi solve nahi karni hai. Aur... Main ek waqt mein sirf ek cheez par focus karunga. Aapke thoughts aayenge, kabhi past ke, kabhi future ke, lekin aapko unke saath jaana zaroori nahi hai. Unhe aane dijiye, aur jaane dijiye... Jaise aasman mein clouds aate hain, aur dheere-dheere nikal jaate hain. Aap bas observe kar rahe hain. Aap calm hain.",
      "Ab ek baar phir apni breathing ko notice kijiye. Ek deep breath andar lijiye... Aur slowly bahar chhodiye. Apne body ko feel kijiye, apne surroundings ko notice kijiye. Aur jab aap ready hon, dheere se apni aankhein khol dijiye. Apne saath iss calm feeling ko lekar jaiye. Yaad rakhiye... Aapko har waqt perfect rehne ki zaroorat nahi hai. Kabhi-kabhi, bas rukna, saans lena, aur khud ko thoda time dena hi kaafi hota hai. Take a deep breath... And gently return to your day. Aap shaant hain. Aap present hain. Aur aap theek hain."
    ]
  },
  {
    type: 'mindfulness',
    label: '5-Min Mindfulness & Gratitude (Hinglish)',
    duration: 5,
    desc: '5-minute Hinglish present moment grounding & shukriya abhyas.',
    steps: [
      "Swagat hai aapka 5-minute Mindfulness session mein. Apni back ko support dein.",
      "Kamre ki teen shant aawazon par apna dhyan lagayein.",
      "Apne neeche ke steady support ko feel karein.",
      "Aaj ki kisi ek pyaari cheez ke liye dil se shukriya kahein.",
      "Saari chintaon ko udte hue clouds ki tarah aage badhne dein.",
      "Is shaanti ko apne saath din bhar rakhein."
    ]
  },
  {
    type: 'sleep_meditation',
    label: '5-Min Deep Sleep Release (Hinglish)',
    duration: 5,
    desc: '5-minute Hinglish soft bedtime relaxation for deep sleep.',
    steps: [
      "Swagat hai aapke 5-minute Bedtime Sleep Relaxation mein. Bed par aaram se layt jayein.",
      "4 seconds saans andar lein... hold karein... aur slowly bahar chhod dein.",
      "Paanv, stomach aur lower back ko bed par deep sink hone dein.",
      "Chehre ki tension release karein aur eyelids ko bhaari hone dein.",
      "Aapka din poora ho chuka hai. Aap bilkul safe aur shant hain.",
      "Meethi aur gehri neend mein jaane dein."
    ]
  },
  {
    type: 'breathing',
    label: '5-Min Box Breathing (Hinglish)',
    duration: 5,
    desc: '5-minute 4-4-4-4 rhythmic box breathing in Hinglish.',
    steps: [
      "Swagat hai 5-minute Box Breathing Protocol mein. Seedhe baith jayein.",
      "Saans andar lein... ek, do, teen, char.",
      "Saans ko rokein... ek, do, teen, char.",
      "Saans bahar chhod dein... ek, do, teen, char.",
      "Khali rokein... ek, do, teen, char.",
      "Feel karein aapka heart kitna calm aur steady ho gaya hai."
    ]
  },
  {
    type: 'stress_relief',
    label: '5-Min Stress & Tension Release (Hinglish)',
    duration: 5,
    desc: '5-minute Hinglish neck & shoulder stress release session.',
    steps: [
      "Swagat hai aapke 5-minute Stress Release Session mein. Aaiye stress release karte hain.",
      "Shoulders ko peeche ki taraf slowly teen baar roll karein.",
      "Head ko right aur left side softly tilt karein.",
      "Chehre ki saari tension ko release kar dein.",
      "Kahein: Main safe hoon, main shant hoon, mera sharir strong hai.",
      "Ek lambi, gehri saans lein aur muskuraayein."
    ]
  }
];

function AudioPlayerModal({ session, lang = 'hi-IN', onClose, onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying]         = useState(false);
  const [ambientOn, setAmbientOn]     = useState(!session.audioUrl);
  const [speechOn, setSpeechOn]       = useState(!session.audioUrl);
  const [completed, setCompleted]     = useState(false);

  const autoTimerRef                  = useRef(null);
  const audioRef                      = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);

  const isMp3Mode = Boolean(session.audioUrl);
  const totalSteps = session.steps ? session.steps.length : 1;

  const clearAutoTimer = () => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  };

  useEffect(() => {
    playBell();
    if (!isMp3Mode && ambientOn) startAmbient();

    if (isMp3Mode && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      playStep(0);
    }

    return () => {
      clearAutoTimer();
      stopSpeech();
      stopAmbient();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [session.audioUrl]);

  const playStep = (stepIdx) => {
    clearAutoTimer();

    if (stepIdx >= totalSteps) {
      setCompleted(true);
      setPlaying(false);
      playBell();
      stopAmbient();
      onFinish?.();
      return;
    }

    setCurrentStep(stepIdx);
    setPlaying(true);

    const stepText = session.steps[stepIdx];
    if (speechOn) {
      speakText(stepText, {
        lang,
        isMeditation: true,
        rate: 0.95,
        onEnd: () => {
          autoTimerRef.current = setTimeout(() => {
            playStep(stepIdx + 1);
          }, 2500);
        }
      });
    } else {
      autoTimerRef.current = setTimeout(() => {
        playStep(stepIdx + 1);
      }, 5000);
    }
  };

  const togglePlay = () => {
    if (isMp3Mode && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
      return;
    }

    if (playing) {
      setPlaying(false);
      clearAutoTimer();
      pauseSpeech();
    } else {
      setPlaying(true);
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
        resumeSpeech();
      } else {
        playStep(currentStep);
      }
    }
  };

  const toggleAmbient = () => {
    if (ambientOn) {
      setAmbientOn(false);
      stopAmbient();
    } else {
      setAmbientOn(true);
      startAmbient();
    }
  };

  const toggleSpeech = () => {
    if (speechOn) {
      setSpeechOn(false);
      stopSpeech();
    } else {
      setSpeechOn(true);
      playStep(currentStep);
    }
  };

  const formatSecs = (s) => {
    if (isNaN(s) || s < 0) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-white">
          
          {isMp3Mode && (
            <audio
              ref={audioRef}
              src={session.audioUrl}
              onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
              onEnded={() => {
                setCompleted(true);
                setPlaying(false);
                playBell();
                onFinish?.();
              }}
            />
          )}

          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                {isMp3Mode ? <Disc className="w-4 h-4 text-white animate-spin-slow" /> : <Brain className="w-4 h-4 text-white" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{session.label}</h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  {isMp3Mode ? 'Pre-Recorded Studio Audio MP3 (5 Mins)' : <><Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> 5-Min Continuous Auto Audio Guide</>}
                </p>
              </div>
            </div>

            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8 flex flex-col items-center justify-center space-y-6 text-center min-h-[260px] bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="flex items-center gap-1.5 h-10">
              {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7, 0.9, 0.4].map((height, i) => (
                <motion.div
                  key={i}
                  animate={playing ? { height: [`${height * 12}px`, `${height * 36}px`, `${height * 12}px`] } : { height: '12px' }}
                  transition={{ repeat: Infinity, duration: 1.1 + i * 0.1, ease: 'easeInOut' }}
                  className="w-1.5 bg-blue-500 rounded-full"
                />
              ))}
            </div>

            {completed ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">5-Min Audio Session Completed (+15 XP)</h3>
                <p className="text-xs text-slate-400">Rest peacefully in this calm state.</p>
              </div>
            ) : isMp3Mode ? (
              <div className="space-y-3 px-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-400 text-xs font-semibold">
                  <Disc className="w-3.5 h-3.5" /> Playing Studio MP3 Audio
                </div>
                <p className="text-sm font-medium text-blue-100 leading-snug">
                  “Saans Lo Shanti Ki — Authentic Guided Meditation Track”
                </p>

                <div className="w-full max-w-xs mx-auto space-y-1.5 pt-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentTime(val);
                      if (audioRef.current) audioRef.current.currentTime = val;
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{formatSecs(currentTime)}</span>
                    <span>{formatSecs(duration)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-2 px-4"
                >
                  <p className="text-lg font-semibold text-blue-100 leading-snug">
                    “{session.steps[currentStep]}”
                  </p>
                  <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block pt-2">
                    Step {currentStep + 1} of {totalSteps} (Auto Advancing)
                  </span>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col space-y-4 items-center">
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-xl transition-transform active:scale-95"
              title={playing ? 'Pause Audio' : 'Resume Audio'}
            >
              {playing ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>

            {!isMp3Mode && (
              <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-900 text-xs w-full">
                <button
                  onClick={toggleAmbient}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-colors ${
                    ambientOn ? 'bg-blue-950 border-blue-800 text-blue-400' : 'border-slate-800 text-slate-500'
                  }`}
                >
                  <Music className="w-3 h-3" /> Ambient Sound {ambientOn ? 'On' : 'Off'}
                </button>

                <button
                  onClick={toggleSpeech}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-colors ${
                    speechOn ? 'bg-blue-950 border-blue-800 text-blue-400' : 'border-slate-800 text-slate-500'
                  }`}
                >
                  {speechOn ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  Voice Guide {speechOn ? 'On' : 'Off'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default function WellnessPage() {
  const dispatch = useDispatch();
  const { moodLogs, loading } = useSelector(s => s.wellness);
  const { user } = useSelector(s => s.auth);

  // Tabs: 'guided', 'mood', 'ai_summary'
  const [tab, setTab]                   = useState('guided');
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodNote, setMoodNote]         = useState('');

  // Guided Session states
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionLang, setSessionLang]         = useState('hinglish');

  // AI Summary state
  const [aiSummary, setAiSummary]             = useState(null);
  const [summaryLoading, setSummaryLoading]   = useState(false);

  useEffect(() => {
    dispatch(fetchMoodHistory(30));
  }, [dispatch]);

  const loadAiSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get('/wellness/ai-summary');
      if (res.data?.summary) {
        setAiSummary(res.data.summary);
      }
    } catch (_) {
      setAiSummary({
        userName: user?.name || 'User',
        latestMood: moodLogs[0]?.mood || 'calm',
        avgScore: 8.0,
        analysis: `Hello ${user?.name || 'User'}. Taking 5 minutes for guided breath awareness today maintains strong mental resilience, releases shoulder tension, and fosters peace.`,
        recommendation: "Listen to the 5-Min Inner Calm Meditation or Saans Lo Shanti Ki audio session today.",
        updatedAt: new Date().toISOString()
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'ai_summary' && !aiSummary) {
      loadAiSummary();
    }
  }, [tab]);

  const handleLogMood = async () => {
    if (!selectedMood) return;
    await dispatch(logMood({ mood: selectedMood.value, moodScore: selectedMood.score, note: moodNote }));
    setSelectedMood(null);
    setMoodNote('');
  };

  const handleMeditationFinish = async (type = 'meditation', duration = 5) => {
    await dispatch(logMeditation({ type, duration: 5 }));
  };

  const activeSessions = sessionLang === 'hinglish' ? AUDIO_SESSIONS_HINGLISH : AUDIO_SESSIONS_ENGLISH;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-blue-600" /> Wellness & Guided Sessions Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">5-minute pre-recorded audio tracks, guided meditation, daily mood logging & AI wellness summary</p>
        </div>

        {tab === 'guided' && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-sm">
            <Languages className="w-4 h-4 text-blue-600 ml-1" />
            <button
              onClick={() => setSessionLang('hinglish')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                sessionLang === 'hinglish' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🇮🇳 Hinglish
            </button>
            <button
              onClick={() => setSessionLang('english')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                sessionLang === 'english' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        )}
      </div>

      {/* 1-Time Redeem Daily Login Bonus Banner */}
      <DailyLoginBonusCard />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {[
          { id: 'guided',     label: '5-Min Guided Audio Sessions', icon: Brain },
          { id: 'mood',       label: 'Mood Tracker',                icon: Smile },
          { id: 'ai_summary', label: 'AI Wellness Summary',         icon: Sparkles },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5
                ${tab === t.id ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Guided Audio Sessions Tab */}
      {tab === 'guided' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSessions.map((s) => (
            <div key={s.type + s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                    {s.audioUrl ? <Disc className="w-4 h-4 text-blue-600 animate-spin-slow" /> : <Brain className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 5 mins
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{s.label}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
              </div>

              <button
                onClick={() => setSelectedSession(s)}
                className="btn-primary w-full justify-center py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> {s.audioUrl ? 'Play Studio MP3 (5m)' : 'Play 5-Min Audio Guidance'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. Mood Tracker Tab */}
      {tab === 'mood' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Daily Mood Assessment</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setSelectedMood(m)}
                  className={`p-3 rounded-lg border text-center transition-colors text-xs font-semibold
                    ${selectedMood?.value === m.value ? m.color + ' border-2' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}>
                  {m.label} ({m.score}/10)
                </button>
              ))}
            </div>
            {selectedMood && (
              <div className="mt-3 space-y-2">
                <textarea value={moodNote} onChange={e => setMoodNote(e.target.value)}
                  placeholder="Add optional notes regarding your mood..."
                  rows={2} className="input-field resize-none text-xs" />
                <button onClick={handleLogMood} className="btn-primary w-full">
                  Submit Mood Assessment ({selectedMood.label})
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Recent Assessments</h3>
            {moodLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No mood records stored.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {moodLogs.slice(0, 5).map((log, i) => (
                  <div key={log._id || i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white capitalize">{log.mood}</span>
                      <span className="text-slate-400 ml-2">Score: {log.moodScore}/10</span>
                      {log.note && <p className="text-slate-500 mt-0.5">{log.note}</p>}
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(log.logDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. AI Summary Tab */}
      {tab === 'ai_summary' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> AI Wellness Intelligence
              </div>
              <button
                onClick={loadAiSummary}
                disabled={summaryLoading}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
                Refresh AI Summary
              </button>
            </div>

            {summaryLoading ? (
              <div className="py-8 text-center space-y-2">
                <Bot className="w-8 h-8 text-blue-400 animate-bounce mx-auto" />
                <p className="text-xs text-slate-300">Analyzing recent wellness data & emotional assessments...</p>
              </div>
            ) : aiSummary ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white">Daily Wellness Assessment Summary</h3>
                  <p className="text-xs text-blue-200 mt-1 leading-relaxed">{aiSummary.analysis}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> AI Personal Guidance
                  </p>
                  <p className="text-xs text-slate-100">{aiSummary.recommendation}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 py-4">Click refresh to load your personalized AI wellness summary.</p>
            )}
          </div>
        </div>
      )}

      {/* Audio Modal */}
      {selectedSession && (
        <AudioPlayerModal
          session={selectedSession}
          lang={sessionLang === 'hinglish' ? 'hi-IN' : 'en-IN'}
          onClose={() => setSelectedSession(null)}
          onFinish={() => handleMeditationFinish(selectedSession.type, selectedSession.duration)}
        />
      )}
    </div>
  );
}
