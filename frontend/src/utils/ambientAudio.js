// src/utils/ambientAudio.js — Calming Ambient Background Sounds & Meditation Bell
let audioCtx = null;
let ambientNodes = [];
let gainNode = null;

function getAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Play a soft meditation bell chime */
export function playBell() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);     // 528Hz — healing frequency
    osc.frequency.exponentialRampToValueAtTime(264, ctx.currentTime + 3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 3.5);
  } catch (_) {}
}

/** Start calming ambient background drone */
export function startAmbient() {
  try {
    stopAmbient();
    const ctx = getAudioContext();
    gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);
    gainNode.connect(ctx.destination);

    // Soft layered drone: 174Hz (relaxation) + 285Hz (healing)
    [174, 285].forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start();
      ambientNodes.push(osc);
    });
  } catch (_) {}
}

/** Stop ambient background */
export function stopAmbient() {
  try {
    ambientNodes.forEach(n => { try { n.stop(); n.disconnect(); } catch(_){} });
    ambientNodes = [];
    if (gainNode) { try { gainNode.disconnect(); } catch(_){} gainNode = null; }
  } catch (_) {}
}

/** Fade out ambient over 2 seconds */
export function fadeOutAmbient() {
  try {
    if (gainNode && audioCtx) {
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
      setTimeout(() => stopAmbient(), 2200);
    }
  } catch (_) { stopAmbient(); }
}
