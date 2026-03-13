import ReactDOM from 'react-dom/client';
import AppWithTheme from './App.jsx';
import { setupGlobalErrorHandler } from './lib/api/interceptor';
import resolveApiBase from './shared/api/resolveApiBase';
import { OpenAPI } from './shared/api/generated/core/OpenAPI';
import './styles/charts-animations.css';
import './styles/chat.css';
import './styles/custom-theme.css';

// Configure OpenAPI for generated services
OpenAPI.BASE = resolveApiBase(import.meta.env.VITE_API_BASE_URL);
OpenAPI.TOKEN = () => sessionStorage.getItem('crm_access_token') || undefined;

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <QueryClientProvider client={queryClient}>
    <AppWithTheme />
  </QueryClientProvider>
);
