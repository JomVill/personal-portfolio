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
  const rmPackets = await rm.evaluate(
    () =>
      [...document.querySelectorAll('.flow-screen .packet, .card .wfd .pk')].filter(
        (e) => +getComputedStyle(e.closest('g') ?? e).opacity > 0.05,
      ).length,
  );
  if (rmPackets !== 0) failures.push(`Reduced motion: ${rmPackets} workflow packets visible`);
  if (!(await rm.locator('.t-sum').isVisible()))
    failures.push('Reduced motion: terminal summary not visible');
  report.push({ reducedMotion: { runningAnimations: running, marqueeRunning, packets: rmPackets } });
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
// Featured diagram: a stream of packets flows through; pausing freezes them in place.
{
  const ctx = await browser.newContext({
    reducedMotion: 'no-preference',
    viewport: { width: 1440, height: 1000 },
  });
  const fp = await ctx.newPage();
  await fp.goto(base, { waitUntil: 'networkidle' });
  const packets = () =>
    fp.evaluate(() =>
      [...document.querySelectorAll('.flow-screen .packet')]
        .filter((e) => +getComputedStyle(e).opacity > 0.05)
        .map((e) => e.style.transform),
    );
  await fp.locator('.flow-screen').scrollIntoViewIfNeeded();
  await fp.waitForTimeout(4000);
  let most = 0;
  for (let i = 0; i < 5; i++) {
    most = Math.max(most, (await packets()).length);
    await fp.waitForTimeout(400);
  }
  if (most < 3) failures.push(`Featured diagram: at most ${most} packets visible at once (want ≥3)`);
  const pool = await fp.locator('.flow-screen .packet').count();
  if (pool > 8) failures.push(`Featured diagram: ${pool} packet elements (pool should cap at 8)`);
  const btn = fp.locator('.motion-toggle');
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await fp.locator('.flow-screen').scrollIntoViewIfNeeded();
  await fp.waitForTimeout(300);
  const f1 = await packets();
  await fp.waitForTimeout(1500);
  const f2 = await packets();
  const frozen = JSON.stringify(f1) === JSON.stringify(f2);
  if (!frozen) failures.push('Featured diagram: packets moved while paused');
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await fp.locator('.flow-screen').scrollIntoViewIfNeeded();
  await fp.waitForTimeout(1000);
  const resumed = JSON.stringify(await packets()) !== JSON.stringify(f2);
  if (!resumed) failures.push('Featured diagram: packets did not resume after Play motion');
  report.push({ featuredFlow: { mostVisible: most, pool, frozen, resumed } });
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
// Custom cursor: native cursor hidden only while the custom one is active.
{
  const ctx = await browser.newContext({ reducedMotion: 'no-preference' });
  const cp = await ctx.newPage();
  await cp.goto(base, { waitUntil: 'networkidle' });
  await cp.mouse.move(300, 300);
  await cp.mouse.move(320, 310);
  await cp.waitForTimeout(300);
  const hidden = await cp.evaluate(() => getComputedStyle(document.body).cursor === 'none');
  const dotVisible = await cp.locator('.fx-dot.is-visible').count();
  if (!hidden) failures.push('Custom cursor: native cursor not hidden with a mouse');
  if (!dotVisible) failures.push('Custom cursor: dot not visible');
  const toggle = cp.locator('.motion-toggle');
  if (await toggle.isVisible()) {
    await toggle.click();
    if ((await cp.evaluate(() => getComputedStyle(document.body).cursor)) === 'none')
      failures.push('Custom cursor: native cursor not restored while paused');
    await toggle.click();
  }
  report.push({ customCursor: { nativeHidden: hidden, dotVisible: !!dotVisible } });
  await ctx.close();
}
for (const opts of [{ reducedMotion: 'reduce' }, { hasTouch: true, isMobile: true }]) {
  const ctx = await browser.newContext(opts);
  const cp = await ctx.newPage();
  await cp.goto(base, { waitUntil: 'networkidle' });
  await cp.mouse.move(300, 300);
  if ((await cp.evaluate(() => getComputedStyle(document.body).cursor)) === 'none')
    failures.push(`Custom cursor: native cursor hidden under ${JSON.stringify(opts)}`);
  await ctx.close();
}
// Contact form: validation, unconnected endpoint, success, server error, honeypot, copy.
{
  const ctx = await browser.newContext({
    reducedMotion: 'no-preference',
    viewport: { width: 1440, height: 1000 },
  });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin });
  const cf = await ctx.newPage();
  cf.on('pageerror', (error) => failures.push(`contact: ${error.message}`));
  const STUB = 'https://example.test/contact';
  let hits = 0;
  let reply = { status: 200, body: '{"ok":true}' };
  let lastBody = '';
  let lastHeaders = {};
  await cf.route(STUB, (route) => {
    hits++;
    lastBody = route.request().postData() ?? '';
    lastHeaders = route.request().headers();
    return route.fulfill({
      status: reply.status,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: reply.body,
    });
  });
  // Never reach the real Apps Script backend from tests (it sends real emails).
  let prodHits = 0;
  await cf.route(/script\.google(usercontent)?\.com/, (route) => {
    prodHits++;
    return route.abort();
  });
  const open = async () => {
    await cf.goto('about:blank'); // a hash-only goto would not reload the page
    await cf.goto(new URL('#contact', base).href, { waitUntil: 'networkidle' });
    await cf.waitForTimeout(3100); // past the 3 s minimum fill time
  };
  const fill = async () => {
    await cf.getByLabel('Name').fill('Ana Tester');
    await cf.getByLabel('Email', { exact: true }).fill('ana@example.com');
    await cf
      .getByLabel('The task, and the tools it touches')
      .fill('Every Monday I copy new leads into HubSpot by hand.');
  };
  const alertText = () => cf.locator('#contact-alert').innerText();
  const send = () => cf.getByRole('button', { name: 'Send it' }).click();
  const result = {};

  // 1. empty submit: inline errors, focus on first invalid field, no layout shift
  await open();
  const formBox = await cf.locator('#contact-form').boundingBox();
  await send();
  const invalid = await cf.locator('#contact-form [aria-invalid="true"]').count();
  const focusId = await cf.evaluate(() => document.activeElement?.id);
  const formBox2 = await cf.locator('#contact-form').boundingBox();
  if (invalid !== 3) failures.push(`Contact: ${invalid} invalid fields after empty submit (want 3)`);
  if (focusId !== 'cf-name') failures.push(`Contact: focus on ${focusId} after empty submit`);
  if (Math.abs(formBox.height - formBox2.height) > 1)
    failures.push(`Contact: validation shifted layout (${formBox.height} -> ${formBox2.height})`);
  const errText = await cf.locator('#cf-email-error').innerText();
  if (!errText) failures.push('Contact: no email error message');
  const axeErr = await new AxeBuilder({ page: cf })
    .include('#contact')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  if (axeErr.violations.length)
    failures.push(
      ...axeErr.violations.map((v) => `contact (errors): ${v.id}: ${v.nodes.map((n) => n.target)}`),
    );
  result.validation = { invalid, focusId, shift: formBox2.height - formBox.height };

  // 2. endpoint empty: "isn't connected yet" with the email fallback
  await cf.evaluate(() => (document.querySelector('#contact-form').dataset.endpoint = ''));
  await fill();
  await send();
  await cf.locator('#contact-alert').waitFor({ state: 'visible' });
  await cf.waitForTimeout(100);
  if (!/isn’t connected yet/.test(await alertText())) failures.push('Contact: no "not connected" message');
  if (!(await cf.locator('#contact-alert a[href^="mailto:"]').count()))
    failures.push('Contact: alert lacks mailto');
  if (hits) failures.push('Contact: request sent with no endpoint');
  result.unconnected = await alertText();

  // 3. stub endpoint returns ok: success panel, focus on its heading, form gone
  await open();
  await cf.evaluate((u) => (document.querySelector('#contact-form').dataset.endpoint = u), STUB);
  await fill();
  await send();
  await cf.locator('.contact-done').waitFor({ state: 'visible', timeout: 5000 });
  const focusCls = await cf.evaluate(() => document.activeElement?.className ?? '');
  if (!/cd-title/.test(focusCls)) failures.push(`Contact: focus not on success heading (${focusCls})`);
  if (await cf.locator('#contact-form').isVisible())
    failures.push('Contact: form still visible after success');
  if (hits !== 1) failures.push(`Contact: ${hits} requests on success (want 1)`);
  const sent = JSON.parse(lastBody || '{}');
  if (sent.name !== 'Ana Tester' || sent.company !== '' || !(sent.elapsedMs >= 3000))
    failures.push(`Contact: unexpected payload ${lastBody}`);
  if (!/^text\/plain/.test(lastHeaders['content-type'] ?? ''))
    failures.push(`Contact: not a simple text/plain request (${lastHeaders['content-type']})`);
  await cf.waitForTimeout(1800);
  const lines = await cf
    .locator('.cd-steps li')
    .evaluateAll((ls) => ls.map((l) => getComputedStyle(l).visibility));
  if (lines.some((v) => v !== 'visible')) failures.push('Contact: success lines did not all appear');
  const axeOk = await new AxeBuilder({ page: cf })
    .include('#contact')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  if (axeOk.violations.length)
    failures.push(
      ...axeOk.violations.map((v) => `contact (success): ${v.id}: ${v.nodes.map((n) => n.target)}`),
    );
  result.success = { focusCls, hits };

  // 4. server error: form stays, error + fallback, key re-enabled
  await open();
  hits = 0;
  reply = { status: 500, body: '{"ok":false}' };
  await cf.evaluate((u) => (document.querySelector('#contact-form').dataset.endpoint = u), STUB);
  await fill();
  await send();
  await cf.locator('#contact-alert').waitFor({ state: 'visible' });
  await cf.waitForTimeout(100);
  if (!/Couldn’t send just now/.test(await alertText())) failures.push('Contact: no error message on 500');
  if (!(await cf.locator('#contact-form').isVisible())) failures.push('Contact: form hidden after error');
  if (await cf.locator('.send-key[aria-disabled]').count()) failures.push('Contact: key stuck disabled');
  if ((await cf.locator('.send-key').innerText()) !== 'Send it')
    failures.push('Contact: key label not reset');
  result.serverError = { hits, alert: await alertText() };

  // 5. honeypot filled: nothing is sent
  await open();
  hits = 0;
  reply = { status: 200, body: '{"ok":true}' };
  await cf.evaluate((u) => (document.querySelector('#contact-form').dataset.endpoint = u), STUB);
  await fill();
  await cf.locator('#cf-company').fill('Bot Inc', { force: true });
  await send();
  await cf.waitForTimeout(500);
  if (hits) failures.push('Contact: honeypot submission was sent');
  if (await cf.locator('.contact-done').isVisible())
    failures.push('Contact: honeypot submission showed success');
  result.honeypot = { hits };

  // 6. copy button
  await cf.getByRole('button', { name: 'Copy email address' }).click();
  const copied = await cf
    .locator('.copy-key.is-copied')
    .waitFor({ timeout: 1000 })
    .then(() => 1)
    .catch(() => 0);
  const clip = await cf.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  if (!copied || clip !== 'jomarivillanueva83@gmail.com') failures.push(`Contact: copy failed (${clip})`);
  await cf.waitForTimeout(2200);
  if (await cf.locator('.copy-key.is-copied').count()) failures.push('Contact: Copied state did not reset');
  result.copy = { copied: !!copied, clip };
  if (prodHits) failures.push(`Contact: ${prodHits} request(s) tried to reach the real Apps Script`);
  result.prodHits = prodHits;
  report.push({ contactForm: result });
  await ctx.close();
}
await writeFile('test-results/browser-report.json', JSON.stringify({ report, failures }, null, 2));
await browser.close();
console.log(JSON.stringify({ report, failures }, null, 2));
if (failures.length) process.exitCode = 1;
