export const introSound = {
  src: '/assets/audio/aiai-orbit-v1.mp3',
  shortSrc: '/assets/audio/aiai-orbit-soft-v1.mp3',
  volume: 0.8,
};

/** Preload/decode silently. A missing buffer or delayed resume is never retried. */
export function prepareIntroSound() {
  const abort = new AbortController();
  let context: AudioContext | undefined;
  let source: AudioBufferSourceNode | undefined;
  let gain: GainNode | undefined;
  let closed = false, attempted = false;
  let deadline: number | undefined;
  const buffers = new Map<string, AudioBuffer>();
  try {
    context = new AudioContext({ latencyHint: 'interactive' });
    for (const url of [introSound.src, introSound.shortSrc]) {
      void fetch(url, { signal: abort.signal }).then(response => {
        if (!response.ok) throw new Error('Intro audio unavailable');
        return response.arrayBuffer();
      }).then(bytes => closed ? undefined : context!.decodeAudioData(bytes))
        .then(buffer => { if (buffer && !closed) buffers.set(url, buffer); }).catch(() => {});
    }
  } catch { /* Audio is optional. */ }
  const stop = () => {
    if (closed) return;
    closed = true;
    abort.abort();
    window.clearTimeout(deadline);
    document.removeEventListener('visibilitychange', visibility);
    try { source?.stop(); } catch { /* Already ended. */ }
    source?.disconnect();
    gain?.disconnect();
    buffers.clear();
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  };
  const visibility = () => { if (document.hidden) stop(); };
  document.addEventListener('visibilitychange', visibility);
  return {
    start(short: boolean, clickedAt: number) {
      if (attempted || closed || !context || document.hidden) return;
      attempted = true;
      // User activation reaches resume synchronously, before any await or timer.
      try {
        const resumed = context.resume();
        const buffer = buffers.get(short ? introSound.shortSrc : introSound.src);
        if (!buffer) { void resumed.catch(() => {}); stop(); return; }
        source = context.createBufferSource();
        gain = context.createGain();
        gain.gain.value = introSound.volume;
        source.buffer = buffer;
        source.connect(gain).connect(context.destination);
        source.onended = stop;
        source.start(context.currentTime);
        deadline = window.setTimeout(() => { if (context?.state !== 'running') stop(); }, 100);
        void resumed.then(() => {
          if (closed || performance.now() - clickedAt > 100) stop();
          else window.clearTimeout(deadline);
        }, stop);
      } catch { stop(); }
    },
    dispose: stop,
  };
}
