import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3005';
const token = fs.readFileSync(
  'C:/Users/prakash/AppData/Local/Temp/claude/c--Users-prakash-Density-Dashboard-marketing/e2d1d5d6-762a-4f0f-bde6-05eccfeecaf7/scratchpad/token_od.txt',
  'utf8'
).trim();
const shotDir = 'C:/Users/prakash/AppData/Local/Temp/claude/c--Users-prakash-Density-Dashboard-marketing/e2d1d5d6-762a-4f0f-bde6-05eccfeecaf7/scratchpad/shots12';
fs.mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1700, height: 1200 } });
await context.addInitScript((t) => { window.localStorage.setItem('token', t); }, token);
await context.addCookies([{ name: 'token', value: token, url: BASE, httpOnly: true, sameSite: 'Strict' }]);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });

console.log('=== /open-orders: confirm Open DO is gone ===');
await page.goto(`${BASE}/open-orders`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('table', { timeout: 60000 });
await page.waitForTimeout(2000);
console.log('Contains "Open DO" text:', (await page.locator('body').innerText()).includes('Open DO'));
console.log('Nav link "Open DO" present:', await page.locator('a:has-text("Open DO")').count());

console.log('=== /open-do: standalone page, column order ===');
await page.goto(`${BASE}/open-do`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('text=Open DO', { timeout: 60000 });
await page.waitForTimeout(20000); // let the DB query finish
const headers = await page.locator('table thead th').allTextContents();
console.log('Open DO column headers:', JSON.stringify(headers.slice(0, 8)));
console.log('Default status active:', await page.locator('button:has-text("Open")').first().evaluate(el => el.className));
await page.screenshot({ path: `${shotDir}/01-open-do-page.png`, fullPage: false });

console.log('=== /orders-line: Pick Slip column position ===');
await page.goto(`${BASE}/orders-line`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('table', { timeout: 60000 });
await page.waitForTimeout(20000);
const olHeaders = await page.locator('table thead th').allTextContents();
console.log('Orders-line column headers (first 6):', JSON.stringify(olHeaders.slice(0, 6)));
await page.screenshot({ path: `${shotDir}/02-orders-line.png`, fullPage: false });

console.log('--- errors ---');
console.log(JSON.stringify(errors, null, 2));

await browser.close();
console.log('DONE');
