// Quiet pointer effects for fine pointers: a trailing orange ring and a soft sheen on silver panels.
// Off for touch/coarse pointers, under prefers-reduced-motion, and while html.motion-paused.
import { isPaused, onPauseChange } from './motion';

const root = document.documentElement;
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const INTERACTIVE = 'a, button, .key, [role="button"], summary, label, select';
const DARK = '.screen';
const SHEEN = '.panel, .device';
const LERP = 0.18;

let ring: HTMLDivElement | null = null;
let x = 0;
let y = 0;
let tx = 0;
let ty = 0;
let placed = false;
let loop = 0;
let sheenFrame = 0;
let sheenEl: HTMLElement | null = null;
let sheenX = 0;
let sheenY = 0;

const enabled = () => fine.matches && !reduced.matches;

const stop = () => {
  cancelAnimationFrame(loop);
  loop = 0;
};

const tick = () => {
  x += (tx - x) * LERP;
  y += (ty - y) * LERP;
  if (Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1) {
    x = tx;
    y = ty;
    loop = 0;
  } else loop = requestAnimationFrame(tick);
  if (ring) ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
};

const start = () => {
  if (!loop && !document.hidden) loop = requestAnimationFrame(tick);
};

const hide = () => ring?.classList.remove('is-visible', 'is-down');

const mount = () => {
  if (ring) return;
  ring = document.createElement('div');
  ring.className = 'fx-ring';
  ring.setAttribute('aria-hidden', 'true');
  ring.append(document.createElement('span'));
  document.body.append(ring);
  root.classList.add('fx-on');
};

const unmount = () => {
  stop();
  ring?.remove();
  ring = null;
  placed = false;
  root.classList.remove('fx-on');
};

const sync = () => (enabled() ? mount() : unmount());

const applySheen = () => {
  sheenFrame = 0;
  if (!sheenEl) return;
  const r = sheenEl.getBoundingClientRect();
  sheenEl.style.setProperty('--mx', `${sheenX - r.left}px`);
  sheenEl.style.setProperty('--my', `${sheenY - r.top}px`);
};

document.addEventListener(
  'pointermove',
  (e) => {
    if (!ring || e.pointerType === 'touch' || isPaused()) return;
    tx = e.clientX;
    ty = e.clientY;
    if (!placed) {
      x = tx;
      y = ty;
      placed = true;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    ring.classList.add('is-visible');
    start();
    const panel = (e.target as Element | null)?.closest?.<HTMLElement>(SHEEN) ?? null;
    if (panel) {
      sheenEl = panel;
      sheenX = e.clientX;
      sheenY = e.clientY;
      if (!sheenFrame) sheenFrame = requestAnimationFrame(applySheen);
    }
  },
  { passive: true },
);

document.addEventListener('pointerover', (e) => {
  if (!ring) return;
  const t = e.target as Element | null;
  ring.classList.toggle('is-hover', !!t?.closest?.(INTERACTIVE));
  ring.classList.toggle('is-dark', !!t?.closest?.(DARK));
  ring.classList.toggle('is-accent', !!t?.closest?.('.key-orange'));
});

document.addEventListener('mouseout', (e) => {
  if (!e.relatedTarget) hide();
});
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') ring?.classList.add('is-down');
});
document.addEventListener('pointerup', () => ring?.classList.remove('is-down'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
  else if (ring && !isPaused()) start();
});

onPauseChange((paused) => {
  if (!ring) return;
  if (paused) {
    stop();
    hide();
    placed = false;
  }
  // On unpause the ring reappears with the next pointer move.
});

fine.addEventListener('change', sync);
reduced.addEventListener('change', sync);
sync();
