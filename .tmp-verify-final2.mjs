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

console.log('=== /open-do: heading removed, column order ===');
await page.goto(`${BASE}/open-do`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('table thead th', { timeout: 90000 });
await page.waitForTimeout(15000);
const bodyText = await page.locator('body').innerText();
console.log('Contains standalone "Open DO" heading text in body:', bodyText.split('\n').includes('Open DO'));
const headers = await page.locator('table thead th').allTextContents();
console.log('Open DO column headers:', JSON.stringify(headers.slice(0, 8)));
await page.screenshot({ path: `${shotDir}/03-open-do-no-heading.png`, fullPage: false });

console.log('=== /orders-line: Pick Slip column position ===');
await page.goto(`${BASE}/orders-line`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('table thead th', { timeout: 90000 });
await page.waitForTimeout(15000);
const olHeaders = await page.locator('table thead th').allTextContents();
console.log('Orders-line column headers (first 6):', JSON.stringify(olHeaders.slice(0, 6)));
await page.screenshot({ path: `${shotDir}/04-orders-line-pickslip.png`, fullPage: false });

await browser.close();
console.log('DONE');
