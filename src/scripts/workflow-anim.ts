// Workflow diagrams on the homepage: one packet travels the path and nodes light as it arrives
// (ported from the approved mockup). Drives the [data-step] nodes rendered by WorkflowDiagram.
// Never runs under reduced motion; each animation pauses off-screen and while the tab is hidden.
import { isPaused, onPauseChange } from './motion';

type Anim = { t: number; on: boolean; vis: boolean; draw: () => void };

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * Math.min(Math.max(x, 0), 1)) / 2;
  const anims: Anim[] = [];
  let raf = 0;
  let prev = 0;
  const frame = (now: number) => {
    const dt = prev ? Math.min(now - prev, 50) : 0;
    prev = now;
    let any = false;
    for (const a of anims)
      if (a.on) {
        a.t += dt;
        a.draw();
        any = true;
      }
    raf = any && !isPaused() ? requestAnimationFrame(frame) : 0;
  };
  const wake = () => {
    if (raf || document.hidden || isPaused() || !anims.some((a) => a.on)) return;
    prev = 0;
    raf = requestAnimationFrame(frame);
  };
  const watch = (a: Anim, el: Element) => {
    anims.push(a);
    new IntersectionObserver(([e]) => {
      a.vis = e.isIntersecting;
      a.on = a.vis && !document.hidden;
      wake();
    }).observe(el);
  };
  document.addEventListener('visibilitychange', () => {
    anims.forEach((a) => (a.on = a.vis && !document.hidden));
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else wake();
  });

  onPauseChange((paused) => {
    if (paused) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else wake();
  });

  // ---- featured diagram (row on wide screens, column on narrow; whichever is displayed) ----
  const screen = document.querySelector<HTMLElement>('.flow-screen');
  const diagrams = screen ? [...screen.querySelectorAll<SVGSVGElement>('svg.wfd--featured')] : [];
  if (screen && diagrams.length) {
    const stepsOf = (svg: SVGSVGElement) =>
      [...svg.querySelectorAll<SVGGElement>('[data-step]')].sort(
        (a, b) => Number(a.dataset.step) - Number(b.dataset.step),
      );
    const beats = [...document.querySelectorAll<HTMLElement>('.beats li')];
    const BEAT = [0, 1, 1, 2, 2, 3, 3, 3, 3, 3];
    const count = stepsOf(diagrams[0]).length;
    const HUMAN = stepsOf(diagrams[0]).findIndex((g) => g.matches('[data-kind="human"]:not(.dec)'));
    const IN = 400;
    const MOVE = 490;
    const DWELL = 110;
    const WAIT = 900;
    const LIT = 520;
    const OUT = 1100;
    const arrive: number[] = [];
    const depart: number[] = [];
    for (let i = 0; i < count; i++) {
      arrive[i] = i ? depart[i - 1] + MOVE : IN;
      depart[i] = arrive[i] + (i === HUMAN ? WAIT : i ? DWELL : 250);
    }
    const last = count - 1;
    const CYCLE = arrive[last] + OUT;
    const pk = document.createElement('span');
    pk.className = 'packet';
    pk.setAttribute('aria-hidden', 'true');
    screen.append(pk);
    let nodes: SVGGElement[] = [];
    let pts: [number, number][] | null = null;
    let beat = -1;
    const measure = () => {
      const svg = diagrams.find((d) => d.getClientRects().length > 0);
      if (!svg) return;
      nodes.forEach((g) => g.classList.remove('lit'));
      nodes = stepsOf(svg);
      const sr = screen.getBoundingClientRect();
      pts = nodes.map((g) => {
        const r = (g.querySelector('.n') ?? g).getBoundingClientRect();
        return [
          r.left + r.width / 2 - sr.left - screen.clientLeft,
          r.top + r.height / 2 - sr.top - screen.clientTop,
        ];
      });
    };
    new ResizeObserver(measure).observe(screen);
    const a: Anim = {
      t: 0,
      on: false,
      vis: false,
      draw() {
        if (!pts) measure();
        if (!pts || !pts.length) return;
        const t = (a.t %= CYCLE);
        let x: number;
        let y: number;
        let op = 1;
        let sc = 1;
        let cur = 0;
        if (t < arrive[0]) {
          [x, y] = pts[0];
          op = t / IN;
        } else {
          for (let i = 0; i <= last; i++) if (t >= arrive[i]) cur = i;
          if (cur < last && t > depart[cur]) {
            const k = ease((t - depart[cur]) / MOVE);
            x = pts[cur][0] + (pts[cur + 1][0] - pts[cur][0]) * k;
            y = pts[cur][1] + (pts[cur + 1][1] - pts[cur][1]) * k;
          } else {
            [x, y] = pts[cur];
            if (cur === HUMAN) sc = 1 + 0.18 * Math.sin(((t - arrive[cur]) / WAIT) * Math.PI * 2);
            if (cur === last) op = 1 - Math.min(Math.max((t - arrive[last] - 350) / 600, 0), 1);
          }
        }
        pk.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(3)})`;
        pk.style.opacity = op.toFixed(3);
        nodes.forEach((g, i) => g.classList.toggle('lit', t >= arrive[i] && t < depart[i] + LIT));
        const b = BEAT[cur] ?? BEAT[BEAT.length - 1];
        if (b !== beat) {
          beat = b;
          beats.forEach((el, i) => el.classList.toggle('on', i === beat));
        }
      },
    };
    watch(a, screen);
  }

  // ---- card mini-diagrams: quieter, slower, staggered ----
  // Routes are rebuilt from the drawn edges: start at each trigger, follow edges to every end.
  const NS = 'http://www.w3.org/2000/svg';
  const STAGGER = [-700, -2300, -3900];
  document.querySelectorAll<SVGSVGElement>('.card svg.wfd--card').forEach((svg, ci) => {
    const vb = svg.viewBox.baseVal;
    const ns = [...svg.querySelectorAll<SVGGraphicsElement>('.node .n')];
    const boxes = ns.map((n) => n.getBBox());
    const edges = [...svg.querySelectorAll<SVGPathElement>('.edges .e')].map((p) => {
      const len = p.getTotalLength();
      return { d: p.getAttribute('d') ?? '', a: p.getPointAtLength(0), b: p.getPointAtLength(len) };
    });
    const near = (pt: DOMPoint, x: number, y: number) => Math.hypot(pt.x - x, pt.y - y);
    const nodeAt = (pt: DOMPoint, side: 'left' | 'right') => {
      let best = -1;
      let dist = 3;
      boxes.forEach((b, i) => {
        const dd = near(pt, side === 'left' ? b.x : b.x + b.width, b.y + b.height / 2);
        if (dd < dist) {
          dist = dd;
          best = i;
        }
      });
      return best;
    };
    const links = edges.map((e) => ({ ...e, from: nodeAt(e.a, 'right'), to: nodeAt(e.b, 'left') }));
    const triggers = ns
      .map((n, i) => (n.closest('.trig') ? i : -1))
      .filter((i) => i >= 0 && links.some((l) => l.from === i));
    const routes: string[] = [];
    const walk = (i: number, d: string, seen: Set<number>) => {
      const out = links.filter((l) => l.from === i && !seen.has(l.to));
      if (!out.length || routes.length >= 4) {
        const b = boxes[i];
        routes.push(`${d}L${(b.x + b.width / 2).toFixed(1)} ${(b.y + b.height / 2).toFixed(1)}`);
        return;
      }
      for (const l of out) walk(l.to, `${d}L${l.d.replace(/^M/, '')}`, new Set([...seen, l.to]));
    };
    for (const t of triggers) {
      const b = boxes[t];
      walk(t, `M${(b.x + b.width / 2).toFixed(1)} ${(b.y + b.height / 2).toFixed(1)}`, new Set([t]));
    }
    if (!routes.length) return;
    const paths = routes.slice(0, 4).map((d) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      svg.append(p);
      return p;
    });
    const lens = paths.map((p) => p.getTotalLength());
    const g = document.createElementNS(NS, 'g');
    const halo = document.createElementNS(NS, 'circle');
    const core = document.createElementNS(NS, 'circle');
    halo.setAttribute('class', 'pk-halo');
    core.setAttribute('class', 'pk');
    g.append(halo, core);
    g.style.opacity = '0';
    svg.append(g);
    let scale = 1;
    const measure = () => {
      scale = svg.getBoundingClientRect().width / vb.width || 1;
      core.setAttribute('r', (2.6 / scale).toFixed(2));
      halo.setAttribute('r', (6.5 / scale).toFixed(2));
    };
    new ResizeObserver(measure).observe(svg);
    const FADE = 450;
    const REST = 1600;
    let ri = 0;
    const durOf = (i: number) => Math.max(2600, ((lens[i] * scale) / 62) * 1000);
    const a: Anim = {
      t: STAGGER[ci] ?? 0,
      on: false,
      vis: false,
      draw() {
        let dur = durOf(ri);
        while (a.t > dur + FADE * 2 + REST) {
          a.t -= dur + FADE * 2 + REST;
          ri = (ri + 1) % paths.length;
          dur = durOf(ri);
        }
        const t = a.t;
        if (t < 0 || t > dur + FADE * 2) {
          g.style.opacity = '0';
          ns.forEach((n) => n.classList.remove('lit'));
          return;
        }
        const k = ease((t - FADE) / dur);
        const pt = paths[ri].getPointAtLength(k * lens[ri]);
        const op = Math.min(t / FADE, 1, (dur + FADE * 2 - t) / FADE);
        g.style.opacity = (0.8 * op).toFixed(3);
        g.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
        ns.forEach((n, i) => {
          const b = boxes[i];
          n.classList.toggle(
            'lit',
            pt.x >= b.x - 2 && pt.x <= b.x + b.width + 2 && pt.y >= b.y - 2 && pt.y <= b.y + b.height + 2,
          );
        });
      },
    };
    watch(a, svg);
  });
}
