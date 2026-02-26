/**
 * Test data generators for E2E tests
 */

/**
 * Generate test data for leads
 */
export function generateLeadData(suffix = '') {
  const timestamp = Date.now();
  const randomNum = String(timestamp).slice(-4);

  // API only accepts letters in first/last names (no numbers, no special chars)
  const names = ['Alex', 'Maria', 'Ivan', 'Elena', 'Dmitry', 'Anna', 'Sergey', 'Olga'];
  const randomName = names[parseInt(randomNum) % names.length];

  return {
    first_name: `${randomName}Test${suffix.replace(/[^a-zA-Z]/g, '')}`,  // Only letters
    last_name: 'Automation',  // Only letters
    email: `e2e.lead.${timestamp}${suffix.replace(/[^a-zA-Z0-9]/g, '')}@test.com`,
    phone: `+79001234${String(timestamp).slice(-3)}`,
    company: `TestCompany ${randomNum}`,  // Company can have spaces and numbers
    position: 'Test Manager',
    source: 'website',
    status: 'new',
  };
}

/**
 * Generate test data for contacts
 */
export function generateContactData(suffix = '') {
  const timestamp = Date.now();
  const randomNum = String(timestamp).slice(-4);

  // API only accepts letters in first/last names (no numbers, no special chars)
  const names = ['Alex', 'Maria', 'Ivan', 'Elena', 'Dmitry', 'Anna', 'Sergey', 'Olga'];
  const randomName = names[parseInt(randomNum) % names.length];

  return {
    first_name: `${randomName}Contact${suffix.replace(/[^a-zA-Z]/g, '')}`,  // Only letters
    last_name: 'Automation',  // Only letters
    email: `e2e.contact.${timestamp}${suffix.replace(/[^a-zA-Z0-9]/g, '')}@test.com`,
    phone: `+79001234${String(timestamp).slice(-3)}`,
    company: `TestCompany ${randomNum}`,  // Company can have spaces and numbers
    position: 'Test Manager',
    type: 'client',
  };
}

/**
 * Generate test data for companies
 */
export function generateCompanyData(suffix = '') {
  const timestamp = Date.now();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChars = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

  return {
    full_name: `TestCompany${randomChars}${suffix}`,
    email: `e2e.company.${timestamp}@test.com`,
    phone: `+7495123${String(timestamp).slice(-4)}`,
    website: `https://company${String(timestamp).slice(-4)}.ru`,
    address: `Test Street ${String(timestamp).slice(-4)}, Moscow, Russia`,
  };
}

/**
 * Generate test data for deals
 */
export function generateDealData(suffix = '') {
  const timestamp = Date.now();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChars = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

  return {
    name: `Deal${randomChars}${suffix}`,
    amount: '150000',
    next_step: 'Negotiation',
    next_step_date: '2026-12-31', // Future date
  };
}

/**
 * Generate test data for tasks
 */
export function generateTaskData(suffix = '') {
  const timestamp = Date.now();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChars = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

  return {
    name: `Task${randomChars}${suffix}`,
    priority: '2',
    next_step: 'Finish documentation',
    next_step_date: '2026-12-31', // Future date
    description: 'Automated test task description',
  };
}

export function generateUniqueEmail() {
  return `e2e.test.${Date.now()}@test.com`;
}

export function generateUniquePhone() {
  const timestamp = Date.now();
  return `+79001${String(timestamp).slice(-6)}`;
}
