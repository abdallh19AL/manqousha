import fs from "fs";

// Generates a seamlessly-looping, near-silent WAV used only to keep the
// admin tab "audible" to the browser. This is NOT true digital silence:
// Chrome's tab-audio detector (the one that exempts a tab from background
// timer/task throttling and tab freezing) measures actual output
// amplitude. A truly silent buffer produces zero output no matter what
// `volume` is set to on the <audio> element, so it would still get
// throttled. Instead this encodes a real tone at ~2% amplitude — far
// below the threshold of human audibility, especially once the element's
// `volume` is also set low (e.g. 0.02) — so there is genuine non-zero
// signal for the browser's audibility heuristic to detect.
const sampleRate = 44100;
const freq = 440;
const amplitude = 0.02; // ~2% full scale
const targetDuration = 2; // seconds
const cycles = Math.round(freq * targetDuration); // integer cycle count
                    // => waveform is back at 0 and rising at the loop
                    // point, so looping produces no click/pop
const duration = cycles / freq;
const numSamples = Math.round(sampleRate * duration);

const buffer = Buffer.alloc(44 + numSamples * 2);
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
  const sample = Math.sin(2 * Math.PI * freq * t) * amplitude;
  buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
}

fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/keepalive.wav", buffer);
console.log("Created public/keepalive.wav", (buffer.length / 1024).toFixed(1), "KB,", duration.toFixed(3), "s loop");
