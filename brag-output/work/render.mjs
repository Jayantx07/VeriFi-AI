// Frame renderer: drives composition.html in headless Edge, one screenshot per frame.
// Usage: node render.mjs stills 1.5 3.2 ...   → work/stills/t-<sec>.png
//        node render.mjs frames               → work/frames/f_00000.jpg … (DUR × 30fps)
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FPS = 30, DUR = 61.33;
const [mode, ...rest] = process.argv.slice(2);

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--hide-scrollbars', '--force-device-scale-factor=1'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto('file:///' + resolve('composition.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await page.evaluate(() => window.ready);

async function shot(t, path, type) {
  await page.evaluate(t => window.render(t), t);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path, type, ...(type === 'jpeg' ? { quality: 95 } : {}), optimizeForSpeed: type === 'jpeg' });
}

if (mode === 'stills') {
  mkdirSync('stills', { recursive: true });
  for (const s of rest) await shot(parseFloat(s), `stills/t-${s}.png`, 'png');
} else {
  mkdirSync('frames', { recursive: true });
  const n = Math.round(DUR * FPS);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await shot(i / FPS, `frames/f_${String(i).padStart(5, '0')}.jpg`, 'jpeg');
    if (i % 75 === 0) console.log(`frame ${i}/${n} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}
await browser.close();
