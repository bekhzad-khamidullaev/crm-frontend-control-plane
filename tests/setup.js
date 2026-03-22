import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');
vi.stubEnv('VITE_API_PREFIX', '/api');

// Mock window.matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// JSDOM does not implement pseudo-element computed styles used by rc-table/rc-util.
const originalGetComputedStyle = window.getComputedStyle.bind(window);
const testGetComputedStyle = (element, pseudoElt) => {
  if (pseudoElt) {
    return {
      getPropertyValue: () => '',
      overflow: 'auto',
      overflowX: 'auto',
      overflowY: 'auto',
      width: '0px',
      height: '0px',
    };
  }
  return originalGetComputedStyle(element);
};
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: testGetComputedStyle,
});
Object.defineProperty(globalThis, 'getComputedStyle', {
  writable: true,
  value: testGetComputedStyle,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid',
    getRandomValues: (arr) => arr,
  },
});

// Mock console.warn to reduce noise in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  if (message.includes('Consider adding an error boundary')) {
    return; // Skip error boundary warnings in tests
  }
  if (message.includes('[AuthGuard]')) {
    return;
  }
  if (message.includes('[antd: Input]') && message.includes('addonAfter')) {
    return;
  }
  if (message.includes('[Router] Guard failed:')) {
    return;
  }
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('[Router] Guard failed:')) {
    return;
  }
  if (message.includes('[antd: Input]') && message.includes('addonAfter')) {
    return;
  }
  originalError(...args);
};

const originalLog = console.log;
console.log = (...args) => {
  const message = args.join(' ');
  if (message.includes('[AuthGuard]')) {
    return;
  }
  originalLog(...args);
};

// Mock fetch for API calls
global.fetch = vi.fn();

function createStorageMock() {
  const store = new Map();
  return {
    getItem: vi.fn((key) => (store.has(String(key)) ? store.get(String(key)) : null)),
    setItem: vi.fn((key, value) => {
      store.set(String(key), String(value));
    }),
    removeItem: vi.fn((key) => {
      store.delete(String(key));
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

// Mock localStorage
const localStorageMock = createStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
});

// Mock antd App to prevent message, notification, and modal errors
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd');
  return {
    ...antd,
    App: {
      ...antd.App,
      useApp: () => ({
        message: {
          success: vi.fn(),
          error: vi.fn(),
          warning: vi.fn(),
          info: vi.fn(),
        },
        notification: {
          success: vi.fn(),
          error: vi.fn(),
          warning: vi.fn(),
          info: vi.fn(),
        },
        modal: {
          confirm: vi.fn(),
          info: vi.fn(),
          success: vi.fn(),
          error: vi.fn(),
          warning: vi.fn(),
        }
      })
    }
  };
});
