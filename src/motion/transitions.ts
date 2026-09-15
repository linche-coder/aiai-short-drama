import { flushSync } from 'react-dom';

let running: ViewTransition | undefined;
let generation = 0;

/** Latest intent wins, including updates queued during old-snapshot capture. */
export function transitionResults(update: () => void, reduced: boolean) {
  const ticket = ++generation;
  running?.skipTransition();
  if (reduced || !document.startViewTransition) { flushSync(update); return; }
  const anchor = document.getElementById('browse');
  const previousTop = anchor?.getBoundingClientRect().top;
  running = document.startViewTransition(() => {
    if (ticket !== generation) return;
    flushSync(update);
    if (previousTop !== undefined && previousTop > 0 && anchor) {
      const difference = anchor.getBoundingClientRect().top - previousTop;
      if (Math.abs(difference) > 1) window.scrollBy({ top: difference, behavior: 'instant' });
    }
  });
  const current = running;
  current.ready.catch(() => { /* Unsupported capture: updated content remains usable. */ });
  current.finished.then(() => { if (running === current) running = undefined; }, () => { if (running === current) running = undefined; });
}

export function cancelResultsTransition() { generation++; running?.skipTransition(); running = undefined; }
