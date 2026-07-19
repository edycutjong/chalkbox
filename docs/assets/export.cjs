/**
 * CHALKBOX — asset export pipeline.
 * Rasterizes the 5 generate-*.html files + icon.svg to PNG at 2x DPI.
 *
 * Usage:  npm run export   (chains `playwright install chromium` first)
 * Node 18+ CommonJS.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const assets = [
  { file: 'generate-og-image.html', width: 1200, height: 630, output: 'og-image.png' },
  { file: 'generate-youtube-thumbnail.html', width: 1280, height: 720, output: 'youtube-thumbnail.png' },
  { file: 'generate-devpost-thumbnail.html', width: 1200, height: 800, output: 'devpost-thumbnail.png' },
  { file: 'generate-devpost-gallery.html', width: 1200, height: 800, output: 'devpost-gallery.png' },
  { file: 'generate-readme-hero.html', width: 1280, height: 640, output: 'readme-hero.png' },
];

(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ deviceScaleFactor: 2 });
    const page = await context.newPage();

    // --- HTML assets ---
    for (const asset of assets) {
      const start = Date.now();
      await page.setViewportSize({ width: asset.width, height: asset.height });
      await page.goto('file://' + path.resolve(__dirname, asset.file));
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.resolve(__dirname, asset.output),
        fullPage: false,
        animations: 'disabled', // freezes CSS animations at their visible (100%) state
      });
      console.log(`✓ ${asset.output} (${Date.now() - start}ms)`);
    }

    // --- icon.svg rasterization (never navigate to raw .svg —
    //     Chromium wraps it in its media viewer; use setContent) ---
    const svg = fs.readFileSync(path.resolve(__dirname, 'icon.svg'), 'utf-8');
    for (const size of [512, 1024]) {
      const start = Date.now();
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(
        `<style>html,body{margin:0;padding:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`
      );
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.resolve(__dirname, `icon-${size}.png`),
        omitBackground: true, // preserve SVG transparency
        animations: 'disabled',
      });
      console.log(`✓ icon-${size}.png (${Date.now() - start}ms)`);
    }
  } finally {
    await browser.close(); // CRITICAL: prevents zombie process
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
