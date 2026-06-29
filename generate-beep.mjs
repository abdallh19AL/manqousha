import fs from "fs";

// Generate a WAV file with a beep alarm pattern
const sampleRate = 44100;
const duration = 1.5; // seconds for one loop cycle
const numSamples = Math.floor(sampleRate * duration);

// Beep pattern: 3 beeps (880Hz) then silence, designed to loop seamlessly
const beepFreq = 880;
const beepDuration = 0.2; // each beep 200ms
const gapDuration = 0.1;  // gap between beeps

function sampleAt(t) {
  // t is time in seconds within the cycle
  const cycle = beepDuration + gapDuration;
  const beepIndex = Math.floor(t / cycle);
  const posInCycle = t - beepIndex * cycle;
  // Only first 3 beeps, rest of the 1.5s is silence (creates rhythm when looped)
  if (beepIndex < 3 && posInCycle < beepDuration) {
    // Envelope to avoid clicks
    const env = Math.min(1, Math.min(posInCycle, beepDuration - posInCycle) * 50);
    return Math.sin(2 * Math.PI * beepFreq * t) * 0.6 * env;
  }
  return 0;
}

// Build PCM 16-bit data
const buffer = Buffer.alloc(44 + numSamples * 2);
// WAV header
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);  // PCM
buffer.writeUInt16LE(1, 22);  // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(numSamples * 2, 40);

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const sample = Math.max(-1, Math.min(1, sampleAt(t)));
  buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
}

fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/order-alarm.wav", buffer);
console.log("✅ Created public/order-alarm.wav", (buffer.length / 1024).toFixed(1), "KB");
