import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const workflows = JSON.parse(await readFile(new URL('../src/data/workflows.json', import.meta.url), 'utf8'));
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4321/';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined, headless: true });
const page = await (await browser.newContext()).newPage();
const failures = [];
const report = [];
page.on('pageerror', (error) => failures.push(error.message));
await mkdir('test-results', { recursive: true });
for (const width of [375, 768, 1024, 1440, 1920]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(base, { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) failures.push(`Homepage overflow at ${width}`);
  await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
  report.push({ viewport: width, horizontalOverflow: overflow });
}
for (const route of ['', 'work/', ...workflows.map((w) => `work/${w.id}/`), 'about/', 'academic/', 'cv/']) {
  const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
  if (!response.ok()) failures.push(`${route}: HTTP ${response.status()}`);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  if (result.violations.length)
    failures.push(
      ...result.violations.map((v) => `${route}: ${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
    );
  report.push({ route, accessibilityViolations: result.violations.length });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    failures.push(`${route}: overflow at 200% font size`);
  await page.setViewportSize({ width: 1440, height: 1000 });
}
await page.goto(base);
await page.keyboard.press('Tab');
if ((await page.locator(':focus').textContent()) !== 'Skip to content')
  failures.push('Skip link is not first keyboard target');
await page.keyboard.press('Enter');
if ((await page.evaluate(() => document.activeElement?.id)) !== 'main')
  failures.push('Skip link did not focus main');
await page.goto(new URL('cv/', base).href);
await page.evaluate(() => {
  window.print = () => {
    document.body.dataset.printed = 'true';
  };
});
await page.getByRole('button', { name: 'Print / save CV as PDF' }).click();
if ((await page.locator('body').getAttribute('data-printed')) !== 'true')
  failures.push('Print button failed');
await page.emulateMedia({ reducedMotion: 'reduce' });
if ((await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)) !== 'auto')
  failures.push('Reduced motion not respected');

// Reduced motion: nothing animates, terminal sits in its final state.
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const rm = await ctx.newPage();
  await rm.goto(base, { waitUntil: 'networkidle' });
  await rm.waitForTimeout(2000);
  const running = await rm.evaluate(
    () => document.getAnimations().filter((a) => a.playState === 'running').length,
  );
  if (running !== 0) failures.push(`Reduced motion: ${running} animations still running`);
  const marqueeRunning = await rm.evaluate(
    () =>
      document
        .querySelector('.marquee')
        ?.getAnimations({ subtree: true })
        .filter((a) => a.playState === 'running').length ?? 0,
  );
  if (marqueeRunning !== 0) failures.push('Reduced motion: marquee is animating');
  if (!(await rm.locator('.t-sum').isVisible()))
    failures.push('Reduced motion: terminal summary not visible');
  report.push({ reducedMotion: { runningAnimations: running, marqueeRunning } });
  await ctx.close();
}
// Motion allowed: terminal text must change over time.
{
  const ctx = await browser.newContext({ reducedMotion: 'no-preference' });
  const mp = await ctx.newPage();
  await mp.goto(base, { waitUntil: 'domcontentloaded' });
  await mp.waitForTimeout(500);
  const t1 = await mp.locator('.term-body').textContent();
  await mp.waitForTimeout(2500);
  const t2 = await mp.locator('.term-body').textContent();
  if (t1 === t2) failures.push('Terminal did not animate with motion allowed');
  report.push({ terminalAnimates: t1 !== t2 });
  // Pause control: freezes terminal and marquee, resumes on second click.
  const btn = mp.locator('.motion-toggle');
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  if ((await btn.getAttribute('aria-pressed')) !== 'true') failures.push('Pause button not pressed');
  if (!(await mp.evaluate(() => document.documentElement.classList.contains('motion-paused'))))
    failures.push('motion-paused class not set');
  await mp.mouse.move(0, 0);
  const p1 = await mp.locator('.term-body').textContent();
  await mp.waitForTimeout(2000);
  const p2 = await mp.locator('.term-body').textContent();
  if (p1 !== p2) failures.push('Terminal kept animating while paused');
  const marqueeRunning = await mp.evaluate(
    () =>
      document
        .querySelector('.marquee')
        ?.getAnimations({ subtree: true })
        .filter((a) => a.playState === 'running').length ?? 0,
  );
  if (marqueeRunning !== 0) failures.push('Marquee kept animating while paused');
  await btn.click();
  const r1 = await mp.locator('.term-body').textContent();
  let resumed = false;
  for (let i = 0; i < 8 && !resumed; i++) {
    await mp.waitForTimeout(500);
    resumed = (await mp.locator('.term-body').textContent()) !== r1;
  }
  if (!resumed) failures.push('Terminal did not resume after Play motion');
  report.push({ pauseControl: { frozen: p1 === p2, marqueeRunning, resumed } });
  await ctx.close();
}
// Pointer effects: follower ring on fine pointers with motion allowed; none for reduced motion or touch.
{
  const ringState = (pg) =>
    pg.evaluate(() => {
      const el = document.querySelector('.fx-ring');
      if (!el) return { exists: false, visible: false, size: 0 };
      const span = el.firstElementChild.getBoundingClientRect();
      return { exists: true, visible: getComputedStyle(el).visibility === 'visible', size: span.width };
    });
  const moveAround = async (pg) => {
    for (const [x, y] of [
      [200, 200],
      [420, 300],
      [640, 260],
    ])
      await pg.mouse.move(x, y, { steps: 4 });
    await pg.waitForTimeout(400);
  };
  const ctx = await browser.newContext({
    reducedMotion: 'no-preference',
    viewport: { width: 1440, height: 1000 },
  });
  const fp = await ctx.newPage();
  await fp.goto(base, { waitUntil: 'networkidle' });
  await moveAround(fp);
  const idle = await ringState(fp);
  if (!idle.exists || !idle.visible) failures.push('Follower missing or hidden on fine pointer');
  const keyBox = await fp.getByRole('link', { name: 'See my workflows' }).boundingBox();
  await fp.mouse.move(keyBox.x + keyBox.width / 2, keyBox.y + keyBox.height / 2, { steps: 6 });
  await fp.waitForTimeout(500);
  const hover = await ringState(fp);
  if (!(hover.size > idle.size + 10))
    failures.push(`Follower did not grow on key hover (${idle.size} -> ${hover.size})`);
  report.push({ follower: { idle, hover } });
  await ctx.close();

  for (const [name, opts] of [
    ['reduced motion', { reducedMotion: 'reduce' }],
    ['touch', { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }],
  ]) {
    const c = await browser.newContext(opts);
    const pg = await c.newPage();
    await pg.goto(base, { waitUntil: 'networkidle' });
    await moveAround(pg);
    const state = await ringState(pg);
    if (state.visible) failures.push(`Follower visible with ${name}`);
    report.push({ [`follower (${name})`]: state });
    await c.close();
  }
}
await writeFile('test-results/browser-report.json', JSON.stringify({ report, failures }, null, 2));
await browser.close();
console.log(JSON.stringify({ report, failures }, null, 2));
if (failures.length) process.exitCode = 1;
