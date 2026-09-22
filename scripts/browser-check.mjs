import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4321/';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined, headless: true });
const page = await browser.newPage();
const failures = [];
const report = [];
page.on('pageerror', error => failures.push(error.message));
await mkdir('test-results', { recursive: true });
for (const width of [375, 768, 1024, 1440, 1920]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(base, { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) failures.push(`Homepage overflow at ${width}`);
  await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
  report.push({ viewport: width, horizontalOverflow: overflow });
}
for (const route of ['', 'work/', 'work/applied-ai/', 'work/ai-literacy-policy/', 'work/digital-government/', 'work/environmental-sensing/', 'research/', 'teaching/', 'about/', 'cv/', 'writing/']) {
  const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
  if (!response.ok()) failures.push(`${route}: HTTP ${response.status()}`);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  if (result.violations.length) failures.push(...result.violations.map(v => `${route}: ${v.id}: ${v.nodes.map(n=>n.target).join(', ')}`));
  report.push({ route, accessibilityViolations: result.violations.length });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push(`${route}: overflow at 200% font size`);
  await page.setViewportSize({ width: 1440, height: 1000 });
}
await page.goto(base);
await page.keyboard.press('Tab');
if (await page.locator(':focus').textContent() !== 'Skip to content') failures.push('Skip link is not first keyboard target');
await page.keyboard.press('Enter');
if (await page.evaluate(() => document.activeElement?.id) !== 'main') failures.push('Skip link did not focus main');
await page.goto(new URL('cv/', base).href);
await page.evaluate(() => { window.print = () => { document.body.dataset.printed = 'true'; }; });
await page.getByRole('button', { name: 'Print / save CV as PDF' }).click();
if (await page.locator('body').getAttribute('data-printed') !== 'true') failures.push('Print button failed');
await page.emulateMedia({ reducedMotion: 'reduce' });
if (await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior) !== 'auto') failures.push('Reduced motion not respected');
await writeFile('test-results/browser-report.json', JSON.stringify({ report, failures }, null, 2));
await browser.close();
console.log(JSON.stringify({ report, failures }, null, 2));
if (failures.length) process.exitCode = 1;
