// src/utils/speech.js — Clean & Natural Speed Text-to-Speech Engine with Completion Callbacks

let cachedVoices = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Finds the highest-quality natural human voice with an Indian Accent (en-IN / hi-IN).
 */
export function getNaturalIndianVoice(lang = 'en-IN') {
  const voices = cachedVoices.length > 0 ? cachedVoices : loadVoices();
  if (!voices || voices.length === 0) return null;

  const msNaturalIndian = voices.find(v =>
    (v.lang === 'en-IN' || v.lang === 'hi-IN' || v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN')) &&
    (v.name.includes('Natural') || v.name.includes('Online'))
  );
  if (msNaturalIndian) return msNaturalIndian;

  const googleIndian = voices.find(v =>
    (v.lang === 'en-IN' || v.lang === 'hi-IN' || v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN')) &&
    v.name.toLowerCase().includes('google')
  );
  if (googleIndian) return googleIndian;

  const indianVoiceNames = ['neerja', 'prabhat', 'veena', 'ravi', 'rishi', 'sangeeta', 'heera', 'kavya', 'kalpana'];
  const namedIndian = voices.find(v =>
    (v.lang.includes('IN') || v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN')) &&
    indianVoiceNames.some(name => v.name.toLowerCase().includes(name))
  );
  if (namedIndian) return namedIndian;

  const anyIndian = voices.find(v =>
    v.lang === 'en-IN' || v.lang === 'hi-IN' || v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN') || v.lang.includes('IN')
  );
  if (anyIndian) return anyIndian;

  const naturalFallback = voices.find(v => v.name.includes('Natural') || v.name.toLowerCase().includes('google'));
  if (naturalFallback) return naturalFallback;

  return voices.find(v => v.lang.startsWith('en')) || voices[0];
}

/**
 * Cleans text for speech narration: strips out timestamps, stage directions, and structural markdown.
 */
function cleanTextForSpeech(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/###\s*\d+:\d+[\s\S]*?(?=\n|$)/g, '') // Strip timestamp section titles like ### 0:00 – 2:00
    .replace(/\*?\([^)]*\)\*?/g, '')               // Strip stage directions like *(Speak slowly)* or (Soft tone)
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/---/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\|/g, ' ')
    .replace(/^\s*[-•]\s*/gm, '')                   // Strip bullet points
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fast & Natural Web Speech API synthesis.
 */
function speakWebSpeech(text, { rate = 1.05, pitch = 1.0, isMeditation = false, onEnd } = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // Split into natural sentences (max 180 chars) for fluid, non-blocking speech
  const chunks = cleanText.match(/[^.!?\n]+[.!?\n]+/g) || [cleanText];
  const bestIndianVoice = getNaturalIndianVoice('en-IN');

  setTimeout(() => {
    chunks.forEach((chunkText, i) => {
      const trimmed = chunkText.trim();
      if (!trimmed || trimmed.length < 2) return;

      const utterance = new SpeechSynthesisUtterance(trimmed);

      if (bestIndianVoice) {
        utterance.voice = bestIndianVoice;
        utterance.lang = bestIndianVoice.lang || 'en-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.rate = isMeditation ? 0.98 : rate;
      utterance.pitch = isMeditation ? 0.98 : pitch;
      utterance.volume = 1.0;

      if (i === 0) {
        utterance.onstart = () => {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        };
      }

      if (i === chunks.length - 1 && onEnd) {
        utterance.onend = () => {
          onEnd();
        };
      }

      window.speechSynthesis.speak(utterance);
    });
  }, 10);
}

/**
 * Main Speak API — Instant clean speech with natural human speed & completion handling.
 */
export async function speakText(text, options = {}) {
  stopSpeech();
  speakWebSpeech(text, options);
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function pauseSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}
