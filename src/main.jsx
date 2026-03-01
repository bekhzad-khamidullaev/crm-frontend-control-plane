import ReactDOM from 'react-dom/client';
import { setupGlobalErrorHandler } from './lib/api/interceptor';
import { OpenAPI } from './shared/api/generated/core/OpenAPI';
import './styles/charts-animations.css';
import './styles/chat.css';
import './styles/custom-theme.css';
import './styles/tailwind.css';

// Configure OpenAPI for generated services
OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL || '';
OpenAPI.TOKEN = () => localStorage.getItem('crm_access_token') || undefined;

// Setup global error handler for 401 errors
setupGlobalErrorHandler();

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Silence unavoidable React 18 findDOMNode warnings from older Ant Design nested components
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode is deprecated')) {
    return;
  }
  originalConsoleError(...args);
};

const queryClient = new QueryClient();

function normalizeBaseUrl(raw) {
  return (raw || '').replace(/\/$/, '');
}

function buildSipmlCandidates() {
  const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};
  const apiBase = normalizeBaseUrl(
    import.meta.env.VITE_API_BASE_URL ||
      runtimeConfig.apiBaseUrl ||
      runtimeConfig.BASE_URL ||
      ''
  );

  const candidates = [];
  if (apiBase) {
    candidates.push(`${apiBase}/static/voip/sipml/SIPml-api.js`);
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    candidates.push(`${normalizeBaseUrl(window.location.origin)}/static/voip/sipml/SIPml-api.js`);
  }
  return [...new Set(candidates)];
}

async function loadSipmlLibrary() {
  if (typeof window === 'undefined') return;
  if (window.SIPml) return;

  const sources = buildSipmlCandidates();
  for (const src of sources) {
    try {
      await new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-sipml-src="${src}"]`);
        if (existing) {
          if (window.SIPml) {
            resolve();
          } else {
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', reject, { once: true });
          }
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.sipmlSrc = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });

      if (window.SIPml) {
        return;
      }
    } catch {
      // Try next candidate
    }
  }

  console.warn('[SIPml] VoIP library is not available. Browser SIP calling will be disabled.');
}

async function bootstrap() {
  await loadSipmlLibrary();
  const { default: AppWithTheme } = await import('./App.jsx');

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <QueryClientProvider client={queryClient}>
      <AppWithTheme />
    </QueryClientProvider>
  );
}

bootstrap();
