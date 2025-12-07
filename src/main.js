// Import Material Design Web styles
import '@material/top-app-bar/dist/mdc.top-app-bar.css';
import '@material/drawer/dist/mdc.drawer.css';
import '@material/list/dist/mdc.list.css';
import '@material/button/dist/mdc.button.css';
import '@material/card/dist/mdc.card.css';
import '@material/textfield/dist/mdc.textfield.css';
import '@material/data-table/dist/mdc.data-table.css';
import '@material/dialog/dist/mdc.dialog.css';
import '@material/snackbar/dist/mdc.snackbar.css';
import '@material/icon-button/dist/mdc.icon-button.css';
import '@material/fab/dist/mdc.fab.css';
import '@material/ripple/dist/mdc.ripple.css';
import './styles/material-theme.css';
import './styles/enterprise-components.css';
import './styles/chat.css';
import './styles/telephony.css';

import { MDCRipple } from '@material/ripple';

import { mountLeads } from './modules/leads/index.js';
import { Dashboard } from './pages/dashboard.js';
import { onRouteChange, navigate, parseHash } from './router.js';
import { initCallWidget } from './modules/calls/index.js';
import i18n from './lib/i18n/index.js';
import store, { setLocale } from './lib/store/index.js';

function setTitle(text) {
  const el = document.getElementById('page-title');
  if (el) el.textContent = text;
}

function mountPage(page) {
  const root = document.getElementById('page-root');
  root.innerHTML = '';
  root.appendChild(page);
}

function routeTo(name) {
  const authed = isAuthenticated();
  const protectedPages = new Set(['dashboard', 'leads']);
  if (!authed && !isDemoMode() && protectedPages.has(name)) {
    setTitle('Login');
    import('./pages/login.js').then(({ LoginPage }) => {
      mountPage(LoginPage({ onSuccess: () => { renderAuthNav(); updateNavVisibility(); routeTo('leads'); } }));
      renderAuthNav();
      updateNavVisibility();
    });
    return;
  }
  if (name === 'login') {
    setTitle('Login');
    import('./pages/login.js').then(({ LoginPage }) => {
      mountPage(LoginPage({ onSuccess: () => routeTo('leads') }));
      renderAuthNav();
    });
    return;
  }
  if (name === 'leads') {
    setTitle('Leads');
    mountLeads(document.getElementById('page-root'));
  } else {
    setTitle('Dashboard');
    mountPage(Dashboard());
  }
}

import { isAuthenticated, clearToken, isDemoMode } from './lib/api/auth.js';

function renderAuthNav() {
  const nav = document.querySelector('.navbar .navbar-nav');
  if (!nav) return;
  const existing = nav.querySelector('#nav-auth');
  if (existing) existing.remove();
  const li = document.createElement('li'); li.className = 'nav-item'; li.id = 'nav-auth';
  const a = document.createElement('a'); a.className = 'nav-link'; a.href = '#'; a.textContent = isAuthenticated() ? 'Logout' : 'Login';
  a.addEventListener('click', (e) => { e.preventDefault(); if (isAuthenticated()) { clearToken(); routeTo('login'); } else { routeTo('login'); } });
  li.appendChild(a); nav.appendChild(li);
}

function updateNavVisibility() {
  const authed = isAuthenticated();
  const ids = ['nav-dashboard', 'nav-leads', 'nav-contacts', 'nav-companies', 'nav-deals', 'nav-tasks', 'nav-projects', 'nav-chat', 'nav-calls', 'nav-memos', 'nav-settings'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (authed) el.style.display = ''; else el.style.display = 'none';
  });
  
  // Update active state
  const currentHash = location.hash.slice(1) || '/leads';
  document.querySelectorAll('.app-sidebar__item').forEach(item => {
    item.classList.remove('app-sidebar__item--active');
    const href = item.getAttribute('href');
    if (href && currentHash.startsWith(href.slice(1))) {
      item.classList.add('app-sidebar__item--active');
    }
  });
  
  // Update auth button
  const authBtn = document.getElementById('auth-button');
  if (authBtn) {
    authBtn.textContent = authed ? 'logout' : 'login';
    authBtn.onclick = () => {
      if (authed) { clearToken(); navigate('/login'); }
      else { navigate('/login'); }
    };
  }
}

function wireNav() {
  const sidebar = document.querySelector('.app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const menuButton = document.getElementById('menu-button');
  if (menuButton) {
    menuButton.addEventListener('click', () => {
      document.body.classList.toggle('app-sidebar-open');
      sidebar?.classList.toggle('app-sidebar--open');
      overlay?.classList.toggle('app-sidebar-overlay--visible');
    });
  }

  overlay?.addEventListener('click', () => {
    document.body.classList.remove('app-sidebar-open');
    sidebar?.classList.remove('app-sidebar--open');
    overlay?.classList.remove('app-sidebar-overlay--visible');
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href').slice(1);
    document.body.classList.remove('app-sidebar-open');
    sidebar?.classList.remove('app-sidebar--open');
    overlay?.classList.remove('app-sidebar-overlay--visible');
    navigate(href);
  });

  document.querySelectorAll('.app-sidebar__item').forEach((el) => {
    MDCRipple.attachTo(el);
  });
}

let intendedRoute = null;

function handleRoute(route) {
  const protectedNames = new Set([
    'dashboard', 
    'leads-list', 'leads-new', 'leads-detail', 'leads-edit',
    'contacts-list', 'contacts-new', 'contacts-detail', 'contacts-edit',
    'companies-list', 'companies-new', 'companies-detail', 'companies-edit',
    'deals-list', 'deals-new', 'deals-detail', 'deals-edit',
    'tasks-list', 'tasks-new', 'tasks-detail', 'tasks-edit',
    'projects-list', 'projects-new', 'projects-detail', 'projects-edit',
    'chat-list', 'chat-thread',
    'calls-list', 'calls-detail'
  ]);
  const authed = isAuthenticated();
  function goLoginPreserve() {
    intendedRoute = route; // store for after login
    setTitle('Login');
    import('./pages/login.js').then(({ LoginPage }) => {
      mountPage(LoginPage({ onSuccess: () => {
        renderAuthNav(); updateNavVisibility();
        const next = intendedRoute || { name: 'leads-list', params: {} };
        intendedRoute = null;
        // navigate to restored route
        switch (next.name) {
          case 'dashboard': navigate('/dashboard'); break;
          case 'leads-new': navigate('/leads/new'); break;
          case 'leads-detail': navigate(`/leads/${next.params.id}`); break;
          case 'leads-edit': navigate(`/leads/${next.params.id}/edit`); break;
          case 'contacts-new': navigate('/contacts/new'); break;
          case 'contacts-detail': navigate(`/contacts/${next.params.id}`); break;
          case 'contacts-edit': navigate(`/contacts/${next.params.id}/edit`); break;
          default: navigate('/leads');
        }
      }}));
      renderAuthNav();
      updateNavVisibility();
    });
  }

  if (!authed && !isDemoMode() && protectedNames.has(route.name)) {
    goLoginPreserve();
    return;
  }

  updateNavVisibility();

  switch (route.name) {
    case 'login':
      goLoginPreserve();
      break;
    case 'dashboard':
      setTitle('Dashboard');
      mountPage(Dashboard());
      break;
    case 'leads-new':
    case 'leads-detail':
    case 'leads-edit':
    case 'leads-list':
      setTitle('Leads');
      mountLeads(document.getElementById('page-root'), route);
      break;
    case 'contacts-new':
    case 'contacts-detail':
    case 'contacts-edit':
    case 'contacts-list':
      setTitle('Contacts');
      import('./modules/contacts/index.js').then(({ mountContacts }) => {
        mountContacts(document.getElementById('page-root'), route);
      });
      break;
    case 'companies-new':
    case 'companies-detail':
    case 'companies-edit':
    case 'companies-list':
      setTitle('Companies');
      import('./modules/companies/index.js').then(({ mountCompanies }) => {
        mountCompanies(document.getElementById('page-root'), route);
      });
      break;
    case 'deals-new':
    case 'deals-detail':
    case 'deals-edit':
    case 'deals-list':
      setTitle('Deals');
      import('./modules/deals/index.js').then(({ mountDeals }) => {
        mountDeals(document.getElementById('page-root'), route);
      });
      break;
    case 'tasks-new':
    case 'tasks-detail':
    case 'tasks-edit':
    case 'tasks-list':
      setTitle('Tasks');
      import('./modules/tasks/index.js').then(({ mountTasks }) => {
        mountTasks(document.getElementById('page-root'), route);
      });
      break;
    case 'projects-new':
    case 'projects-detail':
    case 'projects-edit':
    case 'projects-list':
      setTitle('Projects');
      import('./modules/projects/index.js').then(({ mountProjects }) => {
        mountProjects(document.getElementById('page-root'), route);
      });
      break;
    case 'chat-list':
    case 'chat-thread':
      setTitle('Chat');
      import('./modules/chat/index.js').then(({ mountChat }) => {
        mountChat(document.getElementById('page-root'), route);
      });
      break;
    case 'calls-list':
    case 'calls-detail':
      setTitle('Call Logs');
      import('./modules/calls/index.js').then(({ mountCalls }) => {
        mountCalls(document.getElementById('page-root'), route);
      });
      break;
    default:
      setTitle('Leads');
      mountLeads(document.getElementById('page-root'), route);
      break;
  }
}

wireNav();
renderAuthNav();
updateNavVisibility();

// initial mount based on current hash
handleRoute(parseHash());

onRouteChange((route) => handleRoute(route));

// Initialize i18n
(async function initI18n() {
  const preferred = localStorage.getItem('locale') || (navigator.language || 'en').slice(0,2);
  const locale = ['en','ru'].includes(preferred) ? preferred : 'en';
  try { await i18n.setLocale(locale); setLocale(locale); } catch {}
})();

// Initialize global call widget if authenticated and SIP is available
if (isAuthenticated() && typeof window !== 'undefined' && window.SIPml) {
  initCallWidget();
}
