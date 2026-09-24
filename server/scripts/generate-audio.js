// Generates two short, original WAV tunes into client/public/audio so the
// audio player works fully offline. Run once: node scripts/generate-audio.js
const fs = require('fs');
const path = require('path');

const RATE = 22050;

function tune(notes, noteSec) {
  const samples = [];
  for (const freq of notes) {
    const n = Math.floor(RATE * noteSec);
    for (let i = 0; i < n; i++) {
      const t = i / RATE;
      const env = Math.min(1, i / (RATE * 0.02)) * Math.exp(-3 * t / noteSec); // soft pluck
      const v = freq ? env * (0.6 * Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t)) : 0;
      samples.push(v * 0.5);
    }
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

// Simple pentatonic phrases (Hz). 0 = rest.
const A = [294, 330, 392, 440, 392, 330, 294, 0, 330, 392, 440, 523, 440, 392, 330, 0, 294, 330, 294, 0];
const B = [523, 440, 392, 440, 392, 330, 294, 0, 392, 330, 294, 262, 294, 0, 330, 294, 0, 0];

const out = path.join(__dirname, '..', '..', 'client', 'public', 'audio');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'sample-song.wav'), wav(tune(A, 0.4)));
fs.writeFileSync(path.join(out, 'sample-speech.wav'), wav(tune(B, 0.45)));
console.log('Wrote sample-song.wav and sample-speech.wav to', out);
