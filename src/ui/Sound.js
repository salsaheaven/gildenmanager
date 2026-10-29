// ============================================================
// SOUND – kleine Retro-Töne, direkt im Browser erzeugt (keine Sounddateien nötig)
// Je seltener ein Item, desto mehr und höhere Töne. Das ist gut fürs Belohnungsgefühl!
// ============================================================

const MUTE_KEY = 'gildenmanager-muted';

// Töne einer fröhlichen Tonleiter (Frequenzen in Hertz), von tief nach hoch
const NOTES = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093];

let audioContext = null;
let muted = loadMuted();

function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function getContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Spielt einen einzelnen Ton
// frequency = Tonhöhe, delay = Verzögerung in Sekunden, duration = Länge,
// waveType = Klangfarbe ('square' klingt typisch nach 8-Bit), volume = Lautstärke
function playTone(frequency, delay, duration, waveType = 'square', volume = 0.06) {
  if (muted) {
    return;
  }
  const context = getContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  const startTime = context.currentTime + delay;
  oscillator.type = waveType;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export const Sound = {
  isMuted() {
    return muted;
  },

  toggleMuted() {
    muted = !muted;
    try {
      localStorage.setItem(MUTE_KEY, String(muted));
    } catch (error) {
      // Nicht schlimm, dann merkt sich das Spiel die Einstellung eben nicht
    }
  },

  click() {
    playTone(880, 0, 0.05, 'square', 0.03);
  },

  coin() {
    playTone(988, 0, 0.06);
    playTone(1319, 0.06, 0.15);
  },

  boxArrived() {
    playTone(659, 0, 0.1);
    playTone(988, 0.1, 0.2);
  },

  // Kampf: kritischer Treffer (leise, damit es bei vielen Treffern nicht nervt)
  hit(crit) {
    playTone(crit ? 330 : 220, 0, 0.06, 'square', crit ? 0.035 : 0.02);
  },

  // Kampf: der Boss bereitet eine Mechanik vor
  warning() {
    playTone(440, 0, 0.12, 'sawtooth', 0.04);
    playTone(330, 0.13, 0.18, 'sawtooth', 0.04);
  },

  // Kampf: jemand fällt
  fall() {
    playTone(300, 0, 0.12, 'triangle', 0.06);
    playTone(180, 0.12, 0.25, 'triangle', 0.06);
  },

  // Level-Up: aufsteigende Fanfare mit Schlussakkord
  levelUp() {
    const melody = [0, 2, 4, 5];
    for (let i = 0; i < melody.length; i++) {
      playTone(NOTES[melody[i]], i * 0.09, 0.14, 'square', 0.05);
    }
    playTone(NOTES[5], 0.38, 0.6, 'triangle', 0.07);
    playTone(NOTES[7], 0.38, 0.6, 'triangle', 0.05);
    playTone(NOTES[9], 0.38, 0.6, 'square', 0.03);
  },

  // Rumpeln, während die Kiste wackelt. Wird zum Ende hin schneller und höher.
  shake(seconds) {
    let time = 0;
    let step = 0;
    while (time < seconds) {
      playTone(90 + step * 12, time, 0.07, 'triangle', 0.08);
      time += Math.max(0.05, 0.14 - step * 0.008);
      step++;
    }
  },

  // Die Kiste springt auf. rank = beste Seltenheit darin (0–5).
  boxOpen(rank) {
    playTone(150, 0, 0.35, 'sawtooth', 0.05);
    for (let i = 0; i <= rank + 1; i++) {
      playTone(NOTES[i * 2] || NOTES[NOTES.length - 1], 0.05 + i * 0.05, 0.25, 'square', 0.04);
    }
  },

  // Ein Item erscheint. Höhere Seltenheit = längere, höhere Tonfolge.
  itemReveal(rank) {
    for (let i = 0; i <= rank; i++) {
      playTone(NOTES[i + rank], i * 0.06, 0.18, 'square', 0.05);
    }
    if (rank >= 4) {
      // Episch und Legendär: zusätzlicher Akkord am Ende
      const end = (rank + 1) * 0.06;
      playTone(NOTES[rank + 2], end, 0.6, 'triangle', 0.07);
      playTone(NOTES[rank + 4], end, 0.6, 'triangle', 0.05);
    }
    if (rank === 5) {
      playTone(NOTES[10], (rank + 1) * 0.06 + 0.2, 0.9, 'square', 0.04);
    }
  },

  // Neu im Sammelbuch: helles Glockenspiel nach oben. improved = verbessert (etwas kürzer)
  collectionEntry(improved) {
    const melody = improved ? [4, 7] : [3, 5, 8];
    for (let i = 0; i < melody.length; i++) {
      playTone(NOTES[melody[i]], 0.35 + i * 0.08, 0.3, 'triangle', 0.07);
    }
  },

  // Eine Sammelbuch-Seite ist voll: kleine Fanfare
  collectionPage() {
    const melody = [2, 4, 6, 9];
    for (let i = 0; i < melody.length; i++) {
      playTone(NOTES[melody[i]], 0.6 + i * 0.1, 0.2, 'square', 0.05);
    }
    playTone(NOTES[10], 1.0, 0.8, 'triangle', 0.07);
  },
};
