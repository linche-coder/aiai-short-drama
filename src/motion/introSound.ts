import {timing} from '../config';

export const introSound = {
  src: '/assets/audio/aiai-intro-reveal-v4.wav',
  // Only the opening reveal plays; the later hold, flight and landing are silent.
  delay: 0,
  volume: 0.65,
};

/** Follow the animation timeline even if loading or autoplay permission is late. */
export function startIntroSound(timelineStart: number) {
  const sound = new Audio(introSound.src);
  sound.preload = 'auto';
  sound.volume = introSound.volume;
  let stopped = false, playing = false, pending = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const elapsed = () => Number(document.timeline.currentTime ?? performance.now()) - timelineStart;
  const attempt = () => {
    if (stopped || playing || pending || document.hidden || sound.readyState < 2) return;
    const offset = (elapsed() - introSound.delay) / 1000;
    if (offset < 0) {
      clearTimeout(timer);
      timer = setTimeout(attempt, -offset * 1000);
      return;
    }
    if (elapsed() >= timing.intro || offset >= sound.duration) return;
    sound.currentTime = offset;
    pending = true;
    void sound.play().then(() => {
      pending = false;
      if (stopped) sound.pause();
      else playing = true;
    }, () => { pending = false; }); // Autoplay rejection leaves the visual timeline intact.
  };
  const synchronize = () => {
    if (stopped || sound.paused) return;
    const target = Math.max(0, (elapsed() - introSound.delay) / 1000);
    if (target >= timing.intro / 1000 || target >= sound.duration) { stop(); return; }
    // Catch up after buffering rather than letting sound trail the logo.
    if (Math.abs(sound.currentTime - target) > 0.08) sound.currentTime = target;
  };
  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    sound.pause();
    sound.removeEventListener('loadeddata', attempt);
    sound.removeEventListener('playing', synchronize);
    sound.removeEventListener('timeupdate', synchronize);
    window.removeEventListener('pointerdown', attempt);
    window.removeEventListener('keydown', attempt);
    document.removeEventListener('visibilitychange', visibility);
    sound.removeAttribute('src');
    sound.load();
  };
  const visibility = () => { if (document.hidden) stop(); };
  sound.addEventListener('loadeddata', attempt);
  sound.addEventListener('playing', synchronize);
  sound.addEventListener('timeupdate', synchronize);
  window.addEventListener('pointerdown', attempt);
  window.addEventListener('keydown', attempt);
  document.addEventListener('visibilitychange', visibility);
  attempt();
  return stop;
}
