// src/pages/modules/WellnessSessionPage.jsx — Pre-Recorded Ambient & MP3 Guided Sessions
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, X, Clock, Sparkles, Music, Languages, Disc } from 'lucide-react';
import { speakText, stopSpeech, pauseSpeech, resumeSpeech } from '../../utils/speech';
import { playBell, startAmbient, stopAmbient } from '../../utils/ambientAudio';
import api from '../../services/api';

// 🌿 Minimal Guided Audio Sessions (English)
const AUDIO_SESSIONS_ENGLISH = [
  {
    type: 'mp3_guided',
    label: 'Saans Lo Shanti Ki (Pre-Recorded MP3)',
    duration: 5,
    desc: '🎵 Direct pre-recorded studio audio session: Saans Lo Shanti Ki (Authentic Meditation Track).',
    audioUrl: '/audio/Saans_Lo_Shanti_Ki.mp3',
    steps: [
      "Saans Lo Shanti Ki - Pre-recorded studio meditation audio playing.",
      "Rest comfortably, breathe deeply, and enjoy this calming track."
    ]
  },
  {
    type: 'guided_meditation',
    label: 'Inner Calm Meditation',
    duration: 5,
    desc: 'Pure audio-guided breath and body grounding session.',
    steps: [
      "Sit comfortably and gently close your eyes.",
      "Inhale slowly through your nose... and softly exhale.",
      "Drop your shoulders and release all neck tension.",
      "Feel the quiet stillness in your heart.",
      "Take one final deep breath... open your eyes with peace."
    ]
  },
  {
    type: 'mindfulness',
    label: 'Mindfulness & Gratitude',
    duration: 5,
    desc: 'Minimal sensory grounding and gratitude practice.',
    steps: [
      "Notice three peaceful sounds in your room.",
      "Feel the steady support beneath you.",
      "Think of one thing you are grateful for today.",
      "Let all busy thoughts float away like quiet clouds.",
      "Carry this gentle clarity into your day."
    ]
  },
  {
    type: 'sleep_meditation',
    label: 'Deep Sleep Relaxation',
    duration: 10,
    desc: 'Soft bedtime audio guide for deep restorative sleep.',
    steps: [
      "Lie down comfortably and dim the lights.",
      "Inhale for four seconds... hold... and slowly exhale.",
      "Relax your feet, stomach, and eyelids.",
      "Your day is complete. You are completely safe.",
      "Drift softly into peaceful, restorative sleep."
    ]
  },
  {
    type: 'breathing',
    label: '5-Min Box Breathing',
    duration: 5,
    desc: 'Rhythmic 4-4-4-4 breathing for instant calm.',
    steps: [
      "Inhale slowly... one, two, three, four.",
      "Hold your breath... one, two, three, four.",
      "Exhale softly... one, two, three, four.",
      "Hold empty... one, two, three, four.",
      "Notice how calm and steady your heart feels."
    ]
  },
  {
    type: 'stress_relief',
    label: 'Stress & Tension Release',
    duration: 5,
    desc: 'Minimal audio guide to release neck and shoulder stress.',
    steps: [
      "Roll your shoulders backwards gently three times.",
      "Tilt your head softly to the right... and left.",
      "Unclench your jaw and soften your forehead.",
      "Remind yourself: I am calm, safe, and at peace.",
      "Take a warm deep breath and smile."
    ]
  }
];

// 🇮🇳 Minimal Guided Audio Sessions (Hinglish)
const AUDIO_SESSIONS_HINGLISH = [
  {
    type: 'mp3_guided',
    label: 'Saans Lo Shanti Ki (Pre-Recorded MP3)',
    duration: 5,
    desc: '🎵 Direct studio pre-recorded audio session: Saans Lo Shanti Ki (Original MP3 Track).',
    audioUrl: '/audio/Saans_Lo_Shanti_Ki.mp3',
    steps: [
      "Saans Lo Shanti Ki - Studio pre-recorded audio track playing.",
      "Aaram se baithayein, lambi saans lein aur is shant sangeet ka anand lein."
    ]
  },
  {
    type: 'guided_meditation',
    label: 'Inner Calm Meditation (Hinglish)',
    duration: 5,
    desc: 'Deeply soothing Hinglish audio guide for mental clarity, calm breath & complete inner peace.',
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
    label: 'Mindfulness & Gratitude (Hinglish)',
    duration: 5,
    desc: 'Present moment grounding aur aabhar abhyas.',
    steps: [
      "Kamre ki teen shant aawazon ko sunein.",
      "Apni saans ki rhythm par dhyan lagayein.",
      "Aaj ki kisi ek achhi cheez ke liye shukriya kahein.",
      "Saari chintaon ko udte hue clouds ki tarah jaane dein.",
      "Is shaanti ko apne saath din bhar rakhein."
    ]
  },
  {
    type: 'sleep_meditation',
    label: 'Deep Sleep Release (Hinglish)',
    duration: 10,
    desc: 'Meethi neend ke liye soft audio relaxation.',
    steps: [
      "Bed par aaram se layt jayein aur lights dim kar lein.",
      "4 seconds saans andar lein... hold karein... aur slowly bahar chhod dein.",
      "Haath, paanv aur chehre ko bilkul halka hone dein.",
      "Aapka din poora ho chuka hai. Aap bilkul safe hain.",
      "Meethi aur gehri neend mein jaane dein."
    ]
  },
  {
    type: 'breathing',
    label: '5-Min Box Breathing (Hinglish)',
    duration: 5,
    desc: 'Instant stress relief ke liye rhythmic box breathing.',
    steps: [
      "Saans andar lein... ek, do, teen, char.",
      "Saans ko rokein... ek, do, teen, char.",
      "Saans bahar chhod dein... ek, do, teen, char.",
      "Khali rokein... ek, do, teen, char.",
      "Feel karein aapka heart kitna calm ho gaya hai."
    ]
  },
  {
    type: 'stress_relief',
    label: 'Stress & Tension Release (Hinglish)',
    duration: 5,
    desc: 'Gardan aur shoulders ke stress ko door karne ka guide.',
    steps: [
      "Shoulders ko peeche ki taraf slowly Teen baar roll karein.",
      "Head ko right aur left side softly tilt karein.",
      "Chehre ki saari tension ko release kar dein.",
      "Kahein: Main safe hoon, main shant hoon.",
      "Ek lambi saans lein aur muskuraayein."
    ]
  }
];

function AudioPlayerModal({ session, lang = 'hi-IN', onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying]         = useState(false);
  const [ambientOn, setAmbientOn]     = useState(!session.audioUrl);
  const [speechOn, setSpeechOn]       = useState(!session.audioUrl);
  const [completed, setCompleted]     = useState(false);

  // MP3 Audio Player states
  const audioRef                      = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);

  const isMp3Mode = Boolean(session.audioUrl);
  const totalSteps = session.steps ? session.steps.length : 1;

  useEffect(() => {
    playBell();
    if (!isMp3Mode && ambientOn) startAmbient();

    if (isMp3Mode && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      playStep(0);
    }

    return () => {
      stopSpeech();
      stopAmbient();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [session.audioUrl]);

  const playStep = (stepIdx) => {
    if (stepIdx >= totalSteps) {
      setCompleted(true);
      setPlaying(false);
      playBell();
      stopAmbient();
      api.post('/wellness/meditation', { type: session.type === 'breathing' ? 'breathing' : 'meditation', duration: session.duration }).catch(() => {});
      return;
    }

    setCurrentStep(stepIdx);
    setPlaying(true);

    const stepText = session.steps[stepIdx];
    if (speechOn) {
      speakText(stepText, { lang, isMeditation: true, rate: 0.95 });
    }
  };

  const handleNextStep = () => {
    if (currentStep + 1 < totalSteps) {
      playStep(currentStep + 1);
    } else {
      setCompleted(true);
      setPlaying(false);
      playBell();
      stopAmbient();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      playStep(currentStep - 1);
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
      speakText(session.steps[currentStep], { lang, isMeditation: true, rate: 0.95 });
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
          
          {/* HTML5 Audio Element for MP3 direct playback */}
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
                api.post('/wellness/meditation', { type: 'meditation', duration: session.duration }).catch(() => {});
              }}
            />
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                {isMp3Mode ? <Disc className="w-4 h-4 text-white animate-spin-slow" /> : <Brain className="w-4 h-4 text-white" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{session.label}</h3>
                <p className="text-[10px] text-slate-400">
                  {isMp3Mode ? 'Pre-Recorded Studio Audio MP3' : `Step ${currentStep + 1} of ${totalSteps}`}
                </p>
              </div>
            </div>

            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sound Visualizer & Guidance Display */}
          <div className="p-8 flex flex-col items-center justify-center space-y-6 text-center min-h-[260px] bg-gradient-to-b from-slate-900 to-slate-950">
            
            {/* Animated Sound Wave Graphic */}
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

            {/* Content Display */}
            {completed ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Audio Session Completed (+15 XP)</h3>
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

                {/* Progress Bar & Seek */}
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
                    Step {currentStep + 1} / {totalSteps}
                  </span>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Controls Footer */}
          <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col space-y-4">
            
            {/* Main Player Buttons */}
            <div className="flex items-center justify-between">
              {!isMp3Mode ? (
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0 || completed}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold disabled:opacity-30 hover:bg-slate-800"
                >
                  Previous
                </button>
              ) : (
                <div className="w-16" />
              )}

              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
              >
                {playing ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              {!isMp3Mode ? (
                <button
                  onClick={handleNextStep}
                  disabled={completed}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white disabled:opacity-30"
                >
                  {currentStep + 1 === totalSteps ? 'Finish' : 'Next'}
                </button>
              ) : (
                <div className="w-16" />
              )}
            </div>

            {/* Audio Toggles (Ambient Music / Voice Narration) */}
            {!isMp3Mode && (
              <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-900 text-xs">
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

export default function WellnessSessionPage() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionLang, setSessionLang]         = useState('hinglish');

  const activeSessions = sessionLang === 'hinglish' ? AUDIO_SESSIONS_HINGLISH : AUDIO_SESSIONS_ENGLISH;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" /> Pre-Recorded Sound Guided Sessions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Studio MP3 pre-recorded tracks & minimal step-by-step audio guidance</p>
        </div>

        {/* Language Selector */}
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
      </div>

      {/* Grid of Minimal Audio Sessions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeSessions.map((s) => (
          <div key={s.type + s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  {s.audioUrl ? <Disc className="w-4 h-4 text-blue-600 animate-spin-slow" /> : <Brain className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {s.duration} mins
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">{s.label}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
            </div>

            <button
              onClick={() => setSelectedSession(s)}
              className="btn-primary w-full justify-center py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> {s.audioUrl ? 'Play Studio MP3' : 'Play Audio Guidance'}
            </button>
          </div>
        ))}
      </div>

      {selectedSession && (
        <AudioPlayerModal
          session={selectedSession}
          lang={sessionLang === 'hinglish' ? 'hi-IN' : 'en-IN'}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
