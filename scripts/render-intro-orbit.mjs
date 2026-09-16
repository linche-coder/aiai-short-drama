// Original deterministic synthesis. No recordings, samples, or old intro audio.
// Requires ffmpeg on PATH; run: node scripts/render-intro-orbit.mjs
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const timeline = JSON.parse(fs.readFileSync('src/motion/introTimeline.json', 'utf8'));
const rate = 48000;
const folder = 'public/assets/audio';
fs.mkdirSync(folder, { recursive: true });
fs.mkdirSync('docs/intro-orbit', { recursive: true });
const TAU = Math.PI * 2;
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function synth(short) {
  const duration = (short ? timeline.shortAudio : timeline.audioDuration) / 1000;
  const length = Math.round(rate * duration);
  const channels = [new Float64Array(length), new Float64Array(length)];
  let seed = 9122026;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2147483648 - 1);
  const hit = short ? .018 : timeline.gather / 1000;
  let airLow = 0, airHigh = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    // Soft tactile click, with rounded onset and no hard transient.
    let core = .15 * Math.sin(TAU * (470 * t - 130 * t * t)) * Math.exp(-t * 35) * smooth(t / .006);
    let air = 0, grain = 0;
    if (!short && t < hit) {
      const noise = rand();
      airLow += .17 * (noise - airLow); airHigh += .025 * (airLow - airHigh);
      const p = t / hit;
      air = (airLow - airHigh) * .32 * Math.sin(Math.PI * p) ** 1.5 * (.4 + p);
      // Fine pitched dust, increasingly coherent as the spiral gathers.
      for (let g = 0; g < 9; g++) {
        const u = t - (.15 + g * .064);
        if (u > 0 && u < .08) grain += .009 * Math.sin(TAU * (760 + g * 43) * u) * Math.sin(Math.PI * u / .08) ** 2;
      }
    }
    const u = t - hit;
    if (u >= 0) {
      const envelope = smooth(u / .009) * Math.exp(-u * (short ? 17 : 6.7));
      // Warm major-sixth voicing, near-harmonic upper partials kept very quiet.
      core += envelope * (.28 * Math.sin(TAU * 523.251 * u) + .11 * Math.sin(TAU * 659.255 * u)
        + .065 * Math.sin(TAU * 880 * u) + .022 * Math.sin(TAU * 1046.5 * u));
    }
    channels[0][i] = core + air + grain;
    channels[1][i] = core + air * .93 + grain * .85;
  }
  // Early reflections shrink toward center; dry core remains mono compatible.
  const dry = channels.map(c => c.slice());
  for (let c = 0; c < 2; c++) for (const [delay, level] of [[.031 + c * .006, .13], [.067 - c * .009, .08], [.109 + c * .007, .04]]) {
    const offset = Math.round(delay * rate);
    for (let i = offset; i < length; i++) channels[c][i] += dry[1 - c][i - offset] * level;
  }
  let peak = 0;
  for (let i = 0; i < length; i++) for (const channel of channels) {
    channel[i] *= smooth(i / (rate * .004)) * smooth((length - 1 - i) / (rate * (short ? .055 : .16)));
    peak = Math.max(peak, Math.abs(channel[i]));
  }
  const gain = Math.pow(10, -6 / 20) / peak;
  const pcm = Buffer.alloc(length * 6); let sum = 0, mono = 0, cross = 0, l2 = 0, r2 = 0;
  for (let i = 0; i < length; i++) {
    const l = channels[0][i] * gain, r = channels[1][i] * gain;
    sum += l * l + r * r; mono += ((l + r) / 2) ** 2; cross += l * r; l2 += l * l; r2 += r * r;
    pcm.writeIntLE(Math.round(l * 8388607), i * 6, 3); pcm.writeIntLE(Math.round(r * 8388607), i * 6 + 3, 3);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(pcm.length + 36, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
  header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 6, 28); header.writeUInt16LE(6, 32); header.writeUInt16LE(24, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  const name = short ? 'aiai-orbit-soft-v1' : 'aiai-orbit-v1';
  fs.writeFileSync(`${folder}/${name}.wav`, Buffer.concat([header, pcm]));
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${folder}/${name}.wav`, '-c:a', 'libmp3lame', '-b:a', '160k', `${folder}/${name}.mp3`], { stdio: 'inherit' });
  if (result.status !== 0) throw Error('ffmpeg encoding failed');
  return { name, duration, rate, bits: 24, peakDBFS: -6, rmsDBFS: 10 * Math.log10(sum / (length * 2)), monoRmsDBFS: 10 * Math.log10(mono / length), stereoCorrelation: cross / Math.sqrt(l2 * r2), firstSample: [channels[0][0], channels[1][0]], lastSample: [channels[0].at(-1), channels[1].at(-1)], mp3Bytes: fs.statSync(`${folder}/${name}.mp3`).size };
}
const report = { timeline, synthesis: 'Original additive tones, seeded filtered noise, grains, stereo early reflections', files: [synth(false), synth(true)] };
fs.writeFileSync('docs/intro-orbit/audio-analysis.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
