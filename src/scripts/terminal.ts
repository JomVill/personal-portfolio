// Replays the hero terminal run (typing, spinner, ticks, summary) as in the approved mockup.
// The HTML already holds the final state; nothing runs under reduced motion, and the
// replay pauses while the terminal is off-screen or the tab is hidden.
const term = document.querySelector<HTMLElement>('.term');
const typed = term?.querySelector<HTMLElement>('.t-typed');

if (term && typed && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const rows = [...term.querySelectorAll<HTMLLIElement>('.t-steps li')];
  const sum = rows[rows.length - 1];
  const stepRows = rows.slice(0, -1);
  const steps = stepRows.map((r) => ({
    verb: r.dataset.verb ?? '',
    label: r.dataset.label ?? '',
    ms: Number(r.dataset.ms) || 1500,
  }));
  const SUMMARY = sum.innerHTML;
  const PROMPT = typed.textContent ?? '';
  const GLYPHS = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];

  const done = (row: HTMLElement, label: string) => {
    row.className = 't-done';
    row.replaceChildren();
    const tree = Object.assign(document.createElement('span'), { className: 't-tree', textContent: '⎿' });
    const ok = Object.assign(document.createElement('span'), { className: 't-ok', textContent: '✓' });
    row.append(tree, ok, label);
  };

  let spin: HTMLElement | null = null;
  // Timeline of [delay before, action]
  const plan: [number, () => void][] = [];
  plan.push([
    500,
    () => {
      stepRows.forEach((r) => {
        r.className = '';
        r.replaceChildren();
      });
      sum.style.visibility = 'hidden';
      typed.textContent = '';
      term.classList.add('is-typing');
    },
  ]);
  for (let i = 1; i <= PROMPT.length; i++) {
    plan.push([
      i === 1 ? 400 : 28 + (PROMPT[i - 1] === ' ' ? 30 : 0),
      () => (typed.textContent = PROMPT.slice(0, i)),
    ]);
  }
  plan.push([450, () => term.classList.remove('is-typing')]);
  steps.forEach(({ verb, label, ms }, i) => {
    plan.push([
      i ? 0 : 250,
      () => {
        const glyph = Object.assign(document.createElement('span'), {
          className: 't-glyph',
          textContent: '·',
        });
        const v = Object.assign(document.createElement('span'), { className: 't-verb', textContent: verb });
        stepRows[i].replaceChildren(glyph, v);
        spin = glyph;
      },
    ]);
    plan.push([
      ms,
      () => {
        spin = null;
        done(stepRows[i], label);
      },
    ]);
  });
  plan.push([
    350,
    () => {
      sum.innerHTML = SUMMARY;
      sum.style.visibility = '';
    },
  ]);
  plan.push([3000, () => {}]);

  let idx = 0;
  let timer = 0;
  let raf = 0;
  let running = false;
  let last = 0;
  let g = 0;
  let visible = false;
  const schedule = () => {
    timer = window.setTimeout(tick, plan[idx][0]);
  };
  const tick = () => {
    plan[idx][1]();
    idx = (idx + 1) % plan.length;
    schedule();
  };
  const loop = (t: number) => {
    if (spin && t - last > 110) {
      last = t;
      g = (g + 1) % GLYPHS.length;
      spin.textContent = GLYPHS[g];
    }
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || document.hidden) return;
    running = true;
    schedule();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
    else stop();
  }).observe(term);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });
}
