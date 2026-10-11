// Wires the "Pause motion" button in the terminal header. Hidden unless JS runs and motion is allowed.
import { isPaused, setPaused } from './motion';

const btn = document.querySelector<HTMLButtonElement>('.motion-toggle');
if (btn && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const render = () => {
    const p = isPaused();
    btn.textContent = p ? 'Play motion' : 'Pause motion';
    btn.setAttribute('aria-pressed', String(p));
  };
  btn.hidden = false;
  render();
  btn.addEventListener('click', () => {
    setPaused(!isPaused());
    render();
  });
}
