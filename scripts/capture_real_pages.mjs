import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:3000';
const API_BASE_URL = 'https://api.crm.windevs.uz';
const ROOT = path.resolve('..');
const OUT_DIR = path.resolve(ROOT, 'output/pdf/assets/screenshots');

const routes = [
  ['dashboard', '/#/dashboard'],
  ['leads', '/#/leads'],
  ['leads_new', '/#/leads/new'],
  ['contacts', '/#/contacts'],
  ['contacts_new', '/#/contacts/new'],
  ['companies', '/#/companies'],
  ['companies_new', '/#/companies/new'],
  ['deals', '/#/deals'],
  ['deals_new', '/#/deals/new'],
  ['tasks', '/#/tasks'],
  ['tasks_new', '/#/tasks/new'],
  ['projects', '/#/projects'],
  ['projects_new', '/#/projects/new'],
  ['products', '/#/products'],
  ['products_new', '/#/products/new'],
  ['payments', '/#/payments'],
  ['payments_new', '/#/payments/new'],
  ['reminders', '/#/reminders'],
  ['reminders_new', '/#/reminders/new'],
  ['campaigns', '/#/campaigns'],
  ['campaigns_new', '/#/campaigns/new'],
  ['memos', '/#/memos'],
  ['memos_new', '/#/memos/new'],
  ['chat', '/#/chat'],
  ['calls', '/#/calls'],
  ['calls_dashboard', '/#/calls/dashboard'],
  ['sms_center', '/#/sms-center'],
  ['massmail', '/#/massmail'],
  ['crm_emails', '/#/crm-emails'],
  ['analytics', '/#/analytics'],
  ['operations', '/#/operations'],
  ['reference_data', '/#/reference-data'],
  ['help_center', '/#/help-center'],
  ['users', '/#/users'],
  ['profile', '/#/profile'],
  ['settings', '/#/settings'],
  ['integrations', '/#/integrations'],
  ['telephony', '/#/telephony'],
  ['marketing_segments', '/#/marketing-segments'],
  ['marketing_templates', '/#/marketing-templates'],
];

async function getToken() {
  const res = await fetch(`${API_BASE_URL}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 't3sl@admin' }),
  });
  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }
  return await res.json();
}

function decodePayload(jwt) {
  try {
    const payload = jwt.split('.')[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return {};
  }
}

await fs.mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1680, height: 1050 } });
const page = await context.newPage();

try {
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, '00_login.png'), fullPage: true });

  const { access, refresh } = await getToken();
  const payload = decodePayload(access);
  const roles = Array.isArray(payload?.roles)
    ? payload.roles
    : [payload?.role, 'admin', 'manager', 'sales'].filter(Boolean);

  await page.evaluate(({ accessToken, refreshToken, roleSet }) => {
    localStorage.setItem('crm_access_token', accessToken);
    if (refreshToken) localStorage.setItem('crm_refresh_token', refreshToken);
    localStorage.setItem('contora_locale', 'ru');
    localStorage.setItem('contora-theme', 'light');
    localStorage.setItem('contora_roles', JSON.stringify(roleSet));
    sessionStorage.setItem('contora_roles', JSON.stringify(roleSet));
  }, { accessToken: access, refreshToken: refresh, roleSet: roles });

  for (const [name, route] of routes) {
    const url = `${BASE_URL}${route}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(1800);
      await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
      console.log(`Captured: ${name}`);
    } catch (e) {
      console.warn(`Failed route ${name}: ${e.message}`);
      await page.screenshot({ path: path.join(OUT_DIR, `${name}_error.png`), fullPage: true });
    }
  }

  await page.goto('file://' + path.resolve('src/assets/brand/logo.svg'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'logo.png') });

  console.log('Done');
} finally {
  await browser.close();
}
