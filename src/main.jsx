import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWithTheme from './App.jsx';
import { setupGlobalErrorHandler } from './lib/api/interceptor';
import './styles/charts-animations.css';
import './styles/custom-theme.css';
import './styles/tailwind.css';

// Setup global error handler for 401 errors
setupGlobalErrorHandler();

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWithTheme />
    </QueryClientProvider>
  </React.StrictMode>
);
