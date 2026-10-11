// Workflow diagrams on the homepage: a stream of items flows through each diagram.
//   featured: packets enter at the first node, most drop out at the filter step, survivors queue
//             at the human node and are released one at a time, some drop at the vote, the rest
//             finish with a small pulse. Settings come from the markup (data-filter-at,
//             data-keep-rate, data-vote-keep-rate, data-kind="human", .dec), not from one workflow.
//   cards:    two or three quiet packets along the main path; about half fade at a decision node.
// Never runs under reduced motion; one shared rAF loop; pauses off-screen, on a hidden tab, and
// while html.motion-paused is set (the current frame stays). Packets are decorative (aria-hidden)
// and drawn from a fixed pool per diagram. Randomness is seeded, so runs are repeatable.
import { isPaused, onPauseChange } from './motion';

type Anim = { t: number; on: boolean; vis: boolean; draw: (dt: number) => void; resume?: () => void };

/** mulberry32: small seeded PRNG returning [0, 1). */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * Math.min(Math.max(x, 0), 1)) / 2;
  const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
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
        a.draw(dt);
        any = true;
      }
    raf = any && !isPaused() ? requestAnimationFrame(frame) : 0;
  };
  const wake = () => {
    if (raf || document.hidden || isPaused() || !anims.some((a) => a.on)) return;
    // Starting again after a stop: no catch-up, and spawn timers restart (no burst).
    anims.forEach((a) => a.on && a.resume?.());
    prev = 0;
    raf = requestAnimationFrame(frame);
  };
  const watch = (a: Anim, el: Element) => {
    anims.push(a);
    new IntersectionObserver(([e]) => {
      const was = a.on;
      a.vis = e.isIntersecting;
      a.on = a.vis && !document.hidden;
      if (a.on && !was && raf) a.resume?.();
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
    const first = stepsOf(diagrams[0]);
    const beats = [...document.querySelectorAll<HTMLElement>('.beats li')];
    // Step → beat comes from the markup (data-beat, set from the copy's beats[].through).
    const BEAT = first.map((g) => Number(g.dataset.beat ?? -1));
    const count = first.length;
    const last = count - 1;
    const ds = diagrams[0].dataset;
    const FILTER = ds.filterAt !== undefined ? Number(ds.filterAt) : -1;
    const KEEP = Number(ds.keepRate ?? 1);
    const VOTE_KEEP = Number(ds.voteKeepRate ?? 1);
    // Human nodes queue; only the first one (with a step before it) gets a queue.
    const HUMAN = first.findIndex((g, i) => i > 0 && g.matches('[data-kind="human"]:not(.dec)'));
    const VOTE = HUMAN >= 0 ? first.findIndex((g, i) => i > HUMAN && g.classList.contains('dec')) : -1;
    const isAi = first.map((g) => g.dataset.kind === 'ai');

    const IN = 320; // fade in at the first node
    const MOVE = 600; // node to node
    const DWELL = 130;
    const AI_DWELL = 280;
    const DROP = 650;
    const FINISH = 750;
    const GATE = 260; // queue head steps onto the human node
    const VOTE_MS = 800; // pause on the human node
    const GAP = 450; // between releases
    const LIT = 420;
    const HOLD = 900; // minimum time a beat stays highlighted
    const SPACE = 14; // queue spacing, px

    type Mode = 'in' | 'dwell' | 'move' | 'queue' | 'gate' | 'vote' | 'drop' | 'finish';
    type P = {
      el: HTMLSpanElement;
      live: boolean;
      shown: boolean;
      mode: Mode;
      node: number;
      x: number;
      y: number;
      fx: number;
      fy: number;
      tx: number;
      ty: number;
      mt: number;
      op: number;
      sc: number;
      keep: boolean;
      voteKeep: boolean;
    };
    const POOL = 8;
    const pool: P[] = Array.from({ length: POOL }, () => {
      const el = document.createElement('span');
      el.className = 'packet';
      el.setAttribute('aria-hidden', 'true');
      screen.append(el);
      return {
        el,
        live: false,
        shown: false,
        mode: 'in',
        node: 0,
        x: 0,
        y: 0,
        fx: 0,
        fy: 0,
        tx: 0,
        ty: 0,
        mt: 0,
        op: 0,
        sc: 1,
        keep: true,
        voteKeep: true,
      };
    });
    let rand = seeded(hash(diagrams[0].dataset.workflow ?? 'flow'));
    let cap = 8;
    let current: SVGSVGElement | undefined;
    let nodes: SVGGElement[] = [];
    let pts: [number, number][] = [];
    let ext: [number, number][] = []; // half width / half height of each node, px
    const queue: P[] = [];
    let gate: P | null = null;
    let gateFreeAt = 0;
    let spawnIn = 0;
    const lastHit: number[] = Array(count).fill(-1e9);
    const lit: boolean[] = Array(count).fill(false);
    let lastBeat = -1;
    let beat = -1;
    let beatAt = -1e9;
    // queue geometry (just before the human node)
    let qx = 0;
    let qy = 0;
    let qdx = 0;
    let qdy = 0;
    let dropDx = 0;
    let dropDy = 1;

    const reset = () => {
      pool.forEach((p) => {
        p.live = false;
        p.shown = false;
        p.el.style.opacity = '0';
      });
      queue.length = 0;
      gate = null;
      gateFreeAt = 0;
      spawnIn = 0;
      rand = seeded(hash(diagrams[0].dataset.workflow ?? 'flow'));
    };
    const measure = () => {
      const svg = diagrams.find((d) => d.getClientRects().length > 0);
      if (!svg) return;
      if (svg !== current) {
        nodes.forEach((g) => g.classList.remove('lit'));
        lit.fill(false);
        reset();
        current = svg;
      }
      cap = svg.classList.contains('wfd--column') ? 5 : 8;
      nodes = stepsOf(svg);
      const sr = screen.getBoundingClientRect();
      ext = [];
      pts = nodes.map((g) => {
        const r = (g.querySelector('.n') ?? g).getBoundingClientRect();
        ext.push([r.width / 2, r.height / 2]);
        return [
          r.left + r.width / 2 - sr.left - screen.clientLeft,
          r.top + r.height / 2 - sr.top - screen.clientTop,
        ];
      });
      if (HUMAN > 0 && pts.length > HUMAN) {
        const [ax, ay] = pts[HUMAN - 1];
        const [bx, by] = pts[HUMAN];
        const d = Math.hypot(bx - ax, by - ay) || 1;
        const dx = (bx - ax) / d;
        const dy = (by - ay) / d;
        const e = (i: number) => Math.abs(dx) * ext[i][0] + Math.abs(dy) * ext[i][1];
        qx = bx - dx * (e(HUMAN) + 8);
        qy = by - dy * (e(HUMAN) + 8);
        const room = d - e(HUMAN) - e(HUMAN - 1) - 12;
        // Room on the edge: line up along it. Otherwise (narrow column) stack to the side.
        if (room >= SPACE * 3) [qdx, qdy] = [-dx * SPACE, -dy * SPACE];
        else [qdx, qdy] = [-dy * SPACE, dx * SPACE];
      }
      // Dropped items fall away sideways from the flow: down in the row, left in the column.
      if (pts.length > 1) {
        const [ax, ay] = pts[0];
        const [bx, by] = pts[1];
        const d = Math.hypot(bx - ax, by - ay) || 1;
        [dropDx, dropDy] = [-(by - ay) / d, (bx - ax) / d];
      }
    };
    new ResizeObserver(measure).observe(screen);

    const slot = (q: number): [number, number] => [qx + qdx * q, qy + qdy * q];
    const hit = (i: number, t: number) => {
      lastHit[i] = t;
      if (BEAT[i] >= 0) lastBeat = BEAT[i];
    };
    const moveTo = (p: P, j: number) => {
      p.node = j;
      p.fx = p.x;
      p.fy = p.y;
      if (j === HUMAN) {
        queue.push(p);
        [p.tx, p.ty] = slot(queue.length - 1);
      } else [p.tx, p.ty] = pts[j];
      p.mode = 'move';
      p.mt = 0;
    };
    const arrive = (p: P, t: number) => {
      const i = p.node;
      hit(i, t);
      p.mt = 0;
      if (i === last) p.mode = 'finish';
      else if ((i === FILTER && !p.keep) || (i === VOTE && !p.voteKeep)) p.mode = 'drop';
      else p.mode = 'dwell';
    };
    const spawn = (t: number) => {
      // Fates are drawn on every attempt, so the sequence stays the same however the cap bites.
      const keep = FILTER < 0 || rand() < KEEP;
      const voteKeep = VOTE < 0 || rand() < VOTE_KEEP;
      if (pool.filter((p) => p.live).length >= cap) return;
      const p = pool.find((q) => !q.live);
      if (!p) return;
      Object.assign(p, { live: true, mode: 'in', node: 0, mt: 0, op: 0, sc: 1, keep, voteKeep });
      [p.x, p.y] = pts[0];
      hit(0, t);
    };

    const a: Anim = {
      t: 0,
      on: false,
      vis: false,
      resume() {
        spawnIn = 400;
      },
      draw(dt) {
        if (!pts.length) measure();
        if (!pts.length) return;
        const t = a.t;
        spawnIn -= dt;
        if (spawnIn <= 0) {
          spawn(t);
          spawnIn = 600 + rand() * 300;
        }
        if (!gate && t >= gateFreeAt && queue[0]?.mode === 'queue') {
          const p = queue.shift()!;
          gate = p;
          p.mode = 'gate';
          p.mt = 0;
          p.fx = p.x;
          p.fy = p.y;
        }
        const busy: boolean[] = Array(count).fill(false);
        for (const p of pool) {
          if (!p.live) continue;
          p.mt += dt;
          switch (p.mode) {
            case 'in':
              p.op = clamp01(p.mt / IN);
              busy[0] = true;
              if (p.mt >= IN + DWELL) moveTo(p, 1);
              break;
            case 'dwell':
              busy[p.node] = true;
              if (p.mt >= (isAi[p.node] ? AI_DWELL : DWELL)) moveTo(p, p.node + 1);
              break;
            case 'move': {
              const k = ease(p.mt / MOVE);
              p.x = p.fx + (p.tx - p.fx) * k;
              p.y = p.fy + (p.ty - p.fy) * k;
              if (p.mt >= MOVE) {
                if (p.node === HUMAN) {
                  p.mode = 'queue';
                  p.mt = 0;
                } else arrive(p, t);
              }
              break;
            }
            case 'queue': {
              const [sx, sy] = slot(queue.indexOf(p));
              const k = Math.min(1, dt / 140);
              p.x += (sx - p.x) * k;
              p.y += (sy - p.y) * k;
              busy[HUMAN] = true;
              break;
            }
            case 'gate': {
              const k = ease(p.mt / GATE);
              p.x = p.fx + (pts[HUMAN][0] - p.fx) * k;
              p.y = p.fy + (pts[HUMAN][1] - p.fy) * k;
              busy[HUMAN] = true;
              if (p.mt >= GATE) {
                hit(HUMAN, t);
                p.mode = 'vote';
                p.mt = 0;
              }
              break;
            }
            case 'vote':
              busy[HUMAN] = true;
              p.sc = 1 + 0.22 * Math.sin(clamp01(p.mt / VOTE_MS) * Math.PI);
              if (p.mt >= VOTE_MS) {
                p.sc = 1;
                gate = null;
                gateFreeAt = t + GAP;
                if (HUMAN === last) {
                  p.mode = 'finish';
                  p.mt = 0;
                } else moveTo(p, HUMAN + 1);
              }
              break;
            case 'drop': {
              const k = clamp01(p.mt / DROP);
              const e = ease(k);
              p.x = pts[p.node][0] + dropDx * 12 * e;
              p.y = pts[p.node][1] + dropDy * 12 * e;
              p.op = 1 - k;
              p.sc = 1 - 0.55 * e;
              busy[p.node] = k < 0.5;
              if (k >= 1) p.live = false;
              break;
            }
            case 'finish': {
              const k = clamp01(p.mt / FINISH);
              [p.x, p.y] = pts[p.node];
              p.sc = 1 + 1.6 * ease(k);
              p.op = 1 - k;
              busy[p.node] = true;
              if (k >= 1) p.live = false;
              break;
            }
          }
        }
        for (const p of pool) {
          if (p.live) {
            p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${p.sc.toFixed(3)})`;
            p.el.style.opacity = p.op.toFixed(3);
            p.shown = true;
          } else if (p.shown) {
            p.el.style.opacity = '0';
            p.shown = false;
          }
        }
        for (let i = 0; i < count; i++) {
          const on = busy[i] || t - lastHit[i] < LIT;
          if (on !== lit[i]) {
            lit[i] = on;
            nodes[i]?.classList.toggle('lit', on);
          }
        }
        // Beat of the most recently active stage, held for at least HOLD so it never flickers.
        if (lastBeat >= 0 && lastBeat !== beat && t - beatAt >= HOLD) {
          beat = lastBeat;
          beatAt = t;
          beats.forEach((el, i) => el.classList.toggle('on', i === beat));
        }
      },
    };
    watch(a, screen);
  }

  // ---- card mini-diagrams: two or three quiet packets on the main path, out of phase ----
  // The main path is rebuilt from the drawn edges: start at each trigger, follow edges to every
  // end, keep the longest route.
  const NS = 'http://www.w3.org/2000/svg';
  document.querySelectorAll<SVGSVGElement>('.card svg.wfd--card').forEach((svg, ci) => {
    const vb = svg.viewBox.baseVal;
    const groups = [...svg.querySelectorAll<SVGGElement>('.node')];
    const ns = groups.map((g) => g.querySelector<SVGGraphicsElement>('.n')!);
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
    const routes: { d: string; via: number[] }[] = [];
    const walk = (i: number, d: string, via: number[]) => {
      const out = links.filter((l) => l.from === i && !via.includes(l.to));
      if (!out.length || routes.length >= 8) {
        const b = boxes[i];
        routes.push({ d: `${d}L${(b.x + b.width / 2).toFixed(1)} ${(b.y + b.height / 2).toFixed(1)}`, via });
        return;
      }
      for (const l of out) walk(l.to, `${d}L${l.d.replace(/^M/, '')}`, [...via, l.to]);
    };
    for (const t of triggers) {
      const b = boxes[t];
      walk(t, `M${(b.x + b.width / 2).toFixed(1)} ${(b.y + b.height / 2).toFixed(1)}`, [t]);
    }
    if (!routes.length) return;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('fill', 'none');
    let len = 0;
    let main = routes[0];
    for (const r of routes) {
      path.setAttribute('d', r.d);
      const l = path.getTotalLength();
      if (l > len) {
        len = l;
        main = r;
      }
    }
    path.setAttribute('d', main.d);
    svg.append(path);
    // Where the route reaches the first decision node's centre (length along the path).
    let decLen = -1;
    const dec = main.via.find((i) => groups[i].classList.contains('dec'));
    if (dec !== undefined) {
      const b = boxes[dec];
      let best = Infinity;
      for (let s = 0; s <= len; s += 1) {
        const pt = path.getPointAtLength(s);
        const dd = Math.hypot(pt.x - (b.x + b.width / 2), pt.y - (b.y + b.height / 2));
        if (dd < best) {
          best = dd;
          decLen = s;
        }
      }
    }
    const packets = Array.from({ length: 3 }, () => {
      const g = document.createElementNS(NS, 'g');
      const halo = document.createElementNS(NS, 'circle');
      const core = document.createElementNS(NS, 'circle');
      halo.setAttribute('class', 'pk-halo');
      core.setAttribute('class', 'pk');
      g.append(halo, core);
      g.setAttribute('aria-hidden', 'true');
      g.style.opacity = '0';
      svg.append(g);
      return { g, halo, core };
    });
    let scale = 1;
    const measure = () => {
      scale = svg.getBoundingClientRect().width / vb.width || 1;
      packets.forEach(({ core, halo }) => {
        core.setAttribute('r', (2.6 / scale).toFixed(2));
        halo.setAttribute('r', (6.5 / scale).toFixed(2));
      });
    };
    new ResizeObserver(measure).observe(svg);
    const FADE = 450;
    const REST = 900;
    const DROP = 550;
    const seed = hash(svg.dataset.workflow ?? String(ci));
    const SPEED = 0.94 + (seed % 13) / 100; // each card runs at its own pace, so they drift apart
    const BASE = (seed % 3000) + ci * 1700;
    const a: Anim = {
      t: 0,
      on: false,
      vis: false,
      draw() {
        const n = len * scale > 220 ? 3 : 2;
        const dur = Math.max(3400, ((len * scale) / 44) * 1000);
        const cycle = dur + FADE * 2 + REST;
        // time at which the eased run reaches the decision node
        const atDec = decLen >= 0 ? FADE + (dur * Math.acos(1 - (2 * decLen) / len)) / Math.PI : Infinity;
        const spots: number[] = [];
        packets.forEach(({ g }, j) => {
          if (j >= n) {
            g.style.opacity = '0';
            return;
          }
          const local = a.t * SPEED + BASE + (j * cycle) / n;
          const round = Math.floor(local / cycle);
          const u = local - round * cycle;
          const drops = decLen >= 0 && seeded(seed ^ (j * 7919 + round * 104729))() < 0.5;
          let s = ease((u - FADE) / dur) * len;
          let op = Math.min(u / FADE, 1, (dur + FADE * 2 - u) / FADE);
          let sc = 1;
          if (drops && u >= atDec) {
            const k = clamp01((u - atDec) / DROP);
            s = decLen;
            op *= 1 - k;
            sc = 1 - 0.5 * k;
          }
          op = Math.max(op, 0);
          g.style.opacity = (0.7 * op).toFixed(3);
          if (op <= 0) return;
          const pt = path.getPointAtLength(s);
          g.setAttribute(
            'transform',
            `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) scale(${sc.toFixed(3)})`,
          );
          if (op > 0.3) spots.push(pt.x, pt.y);
        });
        ns.forEach((node, i) => {
          const b = boxes[i];
          let on = false;
          for (let k = 0; k < spots.length && !on; k += 2)
            on =
              spots[k] >= b.x - 2 &&
              spots[k] <= b.x + b.width + 2 &&
              spots[k + 1] >= b.y - 2 &&
              spots[k + 1] <= b.y + b.height + 2;
          node.classList.toggle('lit', on);
        });
      },
    };
    watch(a, svg);
  });
}
