#!/usr/bin/env node

/**
 * E2E Test Setup Verification Script
 * Checks if everything is properly configured
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

const execAsync = promisify(exec);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}╔════════════════════════════════════════╗${RESET}`);
console.log(`${BLUE}║  E2E Test Setup Verification         ║${RESET}`);
console.log(`${BLUE}╚════════════════════════════════════════╝${RESET}\n`);

const checks = [];

// Check 1: Node.js version
async function checkNode() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const major = parseInt(version.slice(1).split('.')[0]);
    
    if (major >= 18) {
      checks.push({ name: 'Node.js version', status: 'pass', details: version });
    } else {
      checks.push({ name: 'Node.js version', status: 'warn', details: `${version} (recommend 18+)` });
    }
  } catch (_error) {
    checks.push({ name: 'Node.js version', status: 'fail', details: _error.message });
  }
}

// Check 2: npm availability
async function checkNpm() {
  try {
    const { stdout } = await execAsync('npm --version');
    checks.push({ name: 'npm', status: 'pass', details: stdout.trim() });
  } catch {
    checks.push({ name: 'npm', status: 'fail', details: 'not found' });
  }
}

// Check 3: Playwright installation
async function checkPlaywright() {
  try {
    const { stdout } = await execAsync('npx playwright --version');
    checks.push({ name: 'Playwright', status: 'pass', details: stdout.trim() });
  } catch {
    checks.push({ name: 'Playwright', status: 'fail', details: 'not installed' });
  }
}

// Check 4: Test files exist
function checkTestFiles() {
  const testFiles = [
    'login.spec.js',
    'leads.spec.js',
    'contacts.spec.js',
    'integration.spec.js',
    'helpers/test-data.js',
    'helpers/api-helpers.js',
  ];
  
  const missing = testFiles.filter(file => !existsSync(join(__dirname, file)));
  
  if (missing.length === 0) {
    checks.push({ name: 'Test files', status: 'pass', details: `${testFiles.length} files found` });
  } else {
    checks.push({ name: 'Test files', status: 'fail', details: `Missing: ${missing.join(', ')}` });
  }
}

// Check 5: Playwright config
function checkConfig() {
  const configExists = existsSync(join(rootDir, 'playwright.config.cjs'));
  
  if (configExists) {
    checks.push({ name: 'Playwright config', status: 'pass', details: 'playwright.config.cjs exists' });
  } else {
    checks.push({ name: 'Playwright config', status: 'fail', details: 'playwright.config.cjs not found' });
  }
}

// Check 6: Package.json scripts
function checkScripts() {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(rootDir, 'package.json'), 'utf8')
    );
    
    const requiredScripts = ['test:e2e', 'test:e2e:report'];
    const hasScripts = requiredScripts.every(script => packageJson.scripts[script]);
    
    if (hasScripts) {
      checks.push({ name: 'npm scripts', status: 'pass', details: 'E2E scripts configured' });
    } else {
      checks.push({ name: 'npm scripts', status: 'warn', details: 'Some E2E scripts missing' });
    }
  } catch (_error) {
    checks.push({ name: 'npm scripts', status: 'fail', details: _error.message });
  }
}

// Check 7: Playwright browsers
async function checkBrowsers() {
  try {
    const { stdout } = await execAsync('npx playwright list-files chromium');
    if (stdout.includes('chromium')) {
      checks.push({ name: 'Playwright browsers', status: 'pass', details: 'Chromium installed' });
    } else {
      checks.push({ name: 'Playwright browsers', status: 'warn', details: 'Run: npx playwright install' });
    }
  } catch {
    checks.push({ name: 'Playwright browsers', status: 'warn', details: 'Run: npx playwright install chromium' });
  }
}

// Check 8: Documentation
function checkDocs() {
  const docs = ['README.md', 'QUICKSTART.md', 'TEST_SUMMARY.md'];
  const existing = docs.filter(doc => existsSync(join(__dirname, doc)));
  
  checks.push({ 
    name: 'Documentation', 
    status: existing.length === docs.length ? 'pass' : 'warn', 
    details: `${existing.length}/${docs.length} files present` 
  });
}

// Run all checks
async function runChecks() {
  await checkNode();
  await checkNpm();
  await checkPlaywright();
  checkTestFiles();
  checkConfig();
  checkScripts();
  await checkBrowsers();
  checkDocs();
}

// Display results
function displayResults() {
  console.log('Verification Results:\n');
  
  checks.forEach((check, _index) => {
    const icon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
    const color = check.status === 'pass' ? GREEN : check.status === 'warn' ? YELLOW : RED;
    
    console.log(`${color}${icon}${RESET} ${check.name.padEnd(25)} ${check.details}`);
  });
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  const passed = checks.filter(c => c.status === 'pass').length;
  const warned = checks.filter(c => c.status === 'warn').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  
  console.log(`Summary: ${GREEN}${passed} passed${RESET}, ${YELLOW}${warned} warnings${RESET}, ${RED}${failed} failed${RESET}\n`);
  
  if (failed > 0) {
    console.log(`${RED}⚠ Setup incomplete. Please fix the failed checks above.${RESET}\n`);
    process.exit(1);
  } else if (warned > 0) {
    console.log(`${YELLOW}⚠ Setup mostly complete. Review warnings above.${RESET}\n`);
    console.log('You can run tests, but some features may not work optimally.\n');
  } else {
    console.log(`${GREEN}✓ Setup complete! Ready to run E2E tests.${RESET}\n`);
    console.log(`Run tests with: ${BLUE}npm run test:e2e${RESET}\n`);
  }
}

// Main execution
(async () => {
  try {
    await runChecks();
    displayResults();
  } catch (_error) {
    console.error(`${RED}Error during verification:${RESET}`, _error.message);
    process.exit(1);
  }
})();
