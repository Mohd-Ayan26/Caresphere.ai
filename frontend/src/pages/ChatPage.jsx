// src/pages/ChatPage.jsx — Clean Enterprise AI Assistant with Voice Input & Output Selection
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bot, Send, Mic, MicOff, Volume2, VolumeX, Plus, Shield, Settings2, Square } from 'lucide-react';
import { sendChatMessage, fetchChatSessions, addLocalMessage, clearChat } from '../store/slices/chatSlice';
import { speakText, stopSpeech } from '../utils/speech';
import api from '../services/api';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  'What medications should I avoid with blood pressure pills?',
  'How can I improve my sleep quality naturally?',
  'What are early signs of low blood sugar?',
  'Give me guidelines for daily hydration',
];

/** Formats AI response content cleanly into human-friendly paragraphs and bold text without raw signs like ** */
function FormattedMessage({ content, isUser }) {
  if (!content) return null;
  if (isUser) {
    return <p className="leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-0.5" />;

        // Strip leading header symbols like ###
        let cleanLine = trimmed.replace(/^#+\s*/, '');

        // Check for bullet list item or numbered item
        const isBullet = /^[•\-*]\s+/.test(cleanLine) || /^\d+\.\s+/.test(cleanLine);
        const bulletPrefix = cleanLine.match(/^\d+\.\s+/)?.[0] || '• ';
        cleanLine = cleanLine.replace(/^[•\-*]\s+/, '').replace(/^\d+\.\s+/, '');

        // Parse inline **bold** into <strong> and strip raw **
        const parts = [];
        const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
        let match;
        let lastIndex = 0;
        let keyIdx = 0;

        while ((match = regex.exec(cleanLine)) !== null) {
          if (match.index > lastIndex) {
            parts.push(cleanLine.substring(lastIndex, match.index));
          }
          const token = match[0];
          if (token.startsWith('**') && token.endsWith('**')) {
            parts.push(
              <strong key={keyIdx++} className="font-bold text-slate-900 dark:text-white">
                {token.slice(2, -2)}
              </strong>
            );
          } else if (token.startsWith('*') && token.endsWith('*')) {
            parts.push(
              <em key={keyIdx++} className="italic text-slate-700 dark:text-slate-300">
                {token.slice(1, -1)}
              </em>
            );
          }
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < cleanLine.length) {
          parts.push(cleanLine.substring(lastIndex));
        }

        const lineNodes = parts.length > 0 ? parts : cleanLine.replace(/\*\*/g, '');

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1">
              <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">{bulletPrefix}</span>
              <span>{lineNodes}</span>
            </div>
          );
        }

        return <p key={lIdx}>{lineNodes}</p>;
      })}
    </div>
  );
}

export default function ChatPage() {
  const dispatch  = useDispatch();
  const { messages, sessions, loading, currentSession } = useSelector(s => s.chat);
  const { user }  = useSelector(s => s.auth);
  const { voiceEnabled } = useSelector(s => s.ui);

  const [input, setInput]               = useState('');
  const [isListening, setListening]     = useState(false);
  const [ttsEnabled, setTtsEnabled]     = useState(voiceEnabled);
  const [voiceAccent, setVoiceAccent]   = useState('en-IN');
  const [showSessions, setShowSessions] = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const bottomRef = useRef(null);
  const recRef    = useRef(null);

  useEffect(() => { dispatch(fetchChatSessions()); }, [dispatch]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Voice speech synthesis
  const speak = (text, msgIdx = null) => {
    if (!ttsEnabled) return;
    const cleanSpeech = (text || '').replace(/\*\*/g, '').replace(/\*/g, '');
    setIsSpeaking(true);
    setSpeakingMsgIdx(msgIdx);
    speakText(cleanSpeech, {
      lang: voiceAccent,
      rate: 0.95,
      pitch: 1.0,
      onEnd: () => {
        setIsSpeaking(false);
        setSpeakingMsgIdx(null);
      }
    });
  };

  const handleStopSpeak = () => {
    stopSpeech();
    setIsSpeaking(false);
    setSpeakingMsgIdx(null);
  };

  // Voice Microphone Dictation (Continuous Speech to Text)
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recRef.current) {
        recRef.current.shouldStop = true;
        recRef.current.stop();
      }
      setListening(false);
      toast('Microphone stopped', { icon: '🎙️' });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening across pauses
    recognition.interimResults = true; // Show live interim transcript
    recognition.lang = voiceAccent === 'hi-IN' ? 'hi-IN' : 'en-IN';
    recognition.shouldStop = false;

    let finalTranscript = input;

    recognition.onstart = () => {
      setListening(true);
      toast('Continuous Microphone Active — speak freely', { icon: '🎙️' });
    };

    recognition.onresult = (e) => {
      let interim = '';
      let currentFinal = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          currentFinal += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (currentFinal) {
        finalTranscript = (finalTranscript ? finalTranscript + ' ' : '') + currentFinal.trim();
      }
      setInput(finalTranscript + (interim ? ' ' + interim : ''));
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return; // Ignore silent pauses
      console.warn('Speech recognition error:', e.error);
    };

    recognition.onend = () => {
      // If user hasn't explicitly clicked stop, keep microphone listening continuously
      if (recRef.current && !recRef.current.shouldStop) {
        try { recognition.start(); } catch { setListening(false); }
      } else {
        setListening(false);
      }
    };

    recRef.current = recognition;
    recognition.start();
  };

  const handleSend = async (text) => {
    handleStopSpeak();
    if (recRef.current) {
      recRef.current.shouldStop = true;
      try { recRef.current.stop(); } catch { /* silent */ }
      setListening(false);
    }
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    dispatch(addLocalMessage({ role: 'user', content: msg, timestamp: new Date() }));
    const res = await dispatch(sendChatMessage({ message: msg, sessionId: currentSession }));
    if (res.payload?.response && ttsEnabled) speak(res.payload.response, messages.length + 1);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const loadSession = async (id) => {
    try {
      const { data } = await api.get(`/chat/sessions/${id}`);
      dispatch({ type: 'chat/setSession', payload: data.session });
      setShowSessions(false);
    } catch { toast.error('Failed to load session.'); }
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] flex gap-4 max-w-6xl mx-auto">
      {/* Session History Sidebar */}
      {showSessions && (
        <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-sm flex-shrink-0">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Conversation History</h3>
            <button onClick={() => dispatch(clearChat())} className="text-blue-600 text-[11px] font-semibold hover:underline">New</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => (
              <div key={s._id} onClick={() => loadSession(s._id)} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{s.sessionTitle || 'Chat'}</p>
                <p className="text-[10px] text-slate-400">{new Date(s.updatedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">CareSphere AI Clinical Assistant</h2>
              <p className="text-[11px] text-slate-400">Groq AI Powered · 24/7 Clinical Support</p>
            </div>
          </div>

          {/* Voice Controls Toolbar */}
          <div className="flex items-center gap-2 text-xs font-medium">
            {/* Voice Accent Dropdown */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={voiceAccent}
                onChange={e => setVoiceAccent(e.target.value)}
                className="bg-transparent border-none text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="en-IN">🇮🇳 Indian English</option>
                <option value="hi-IN">🇮🇳 Hindi (hi-IN)</option>
                <option value="en-US">🇺🇸 US English</option>
              </select>
            </div>

            {/* Stop Speaking Button */}
            {isSpeaking && (
              <button
                onClick={handleStopSpeak}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs animate-pulse hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                title="Stop Voice Speech"
              >
                <Square className="w-3 h-3 fill-current" /> Stop Speaking
              </button>
            )}

            {/* Mute/Unmute Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) handleStopSpeak();
                setTtsEnabled(!ttsEnabled);
              }}
              title={ttsEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
              className={`p-1.5 rounded-lg border transition-colors ${
                ttsEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button onClick={() => setShowSessions(!showSessions)} className="btn-secondary py-1.5 px-3">History</button>
            <button onClick={() => dispatch(clearChat())} className="btn-primary py-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {messages.length === 0 && (
            <div className="text-center py-12 max-w-lg mx-auto">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Hello, {user?.name?.split(' ')[0]}</h3>
              <p className="text-slate-400 text-xs mb-6">Ask questions regarding medications, schedules, wellness recommendations, or symptoms.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => handleSend(p)} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-lg text-slate-700 dark:text-slate-300 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 relative group ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700'
              }`}>
                <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px]">
                  <span className={msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>

                  {msg.role !== 'user' && (
                    isSpeaking && (speakingMsgIdx === i || speakingMsgIdx === null) ? (
                      <button
                        onClick={handleStopSpeak}
                        className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-bold transition-colors animate-pulse"
                        title="Stop Voice Speech"
                      >
                        <Square className="w-3 h-3 fill-current" /> Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => speak(msg.content, i)}
                        className="text-slate-400 hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors"
                        title="Replay Voice Guidance"
                      >
                        <Volume2 className="w-3 h-3" /> Replay
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && <p className="text-slate-400 italic">CareSphere AI is thinking...</p>}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar with Microphone Dictation */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            
            {/* Dictation Mic Button */}
            <button
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 animate-pulse'
                  : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak to AI (Dictation)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isListening ? 'Listening to your voice...' : 'Type your medical query or click mic to dictate...'}
              rows={1}
              className="flex-1 border-none outline-none text-xs bg-transparent text-slate-900 dark:text-white resize-none"
            />

            <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="btn-primary p-2 rounded-lg">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
