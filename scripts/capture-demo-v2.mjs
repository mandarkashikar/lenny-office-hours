import { chromium } from 'playwright';
import fs from 'fs';

const outDir = '/Users/Mandaroc/.openclaw/workspace/lenny-office-hours-demo-v2/demo-assets';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1365, height: 900 },
  recordVideo: { dir: outDir, size: { width: 1365, height: 900 } },
});

const page = await context.newPage();
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/v2-01-landing.png`, fullPage: true });

await page.getByRole('button', { name: /Product Discovery/i }).click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/v2-02-topic.png`, fullPage: true });

await page.getByRole('button', { name: /Teresa Torres/i }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Marty Cagan/i }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Shreyas Doshi/i }).click();
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outDir}/v2-03-guests.png`, fullPage: true });

await page.getByRole('button', { name: /Start Session/i }).click();
await page.waitForTimeout(10000);
await page.screenshot({ path: `${outDir}/v2-04-opening-chat.png`, fullPage: true });

async function sendMessage(text) {
  await page.getByPlaceholder('Message the panel…').click();
  await page.keyboard.type(text, { delay: 35 });
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: /^Send$/ }).click();
}

await sendMessage('I only get one customer call a month. How would each of you redesign my discovery process?');
await page.waitForTimeout(9000);
await page.screenshot({ path: `${outDir}/v2-05-followup-1.png`, fullPage: true });

await sendMessage('My engineers think discovery is slowing delivery. What would you say to them?');
await page.waitForTimeout(9000);
await page.screenshot({ path: `${outDir}/v2-06-followup-2.png`, fullPage: true });

await sendMessage('Current process: PM interviews users, writes PRD solo, then hands off. What should change first?');
await page.waitForTimeout(12000);
await page.screenshot({ path: `${outDir}/v2-07-hot-seat.png`, fullPage: true });

await page.getByRole('button', { name: /End Session/i }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/v2-08-summary.png`, fullPage: true });

await context.close();
await browser.close();
console.log('done');
