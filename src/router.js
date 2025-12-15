let listeners = [];

// Minimal route meta registry
export const routeMeta = {
 'login': { auth: false, title: 'Login', breadcrumbs: [{ label: 'Login' }] },
 'dashboard': { auth: true, title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard', href: '#/dashboard' }] },
 'leads-list': { auth: true, title: 'Leads', breadcrumbs: [{ label: 'Leads', href: '#/leads' }] },
 'leads-new': { auth: true, title: 'New Lead', breadcrumbs: [{ label: 'Leads', href: '#/leads' }, { label: 'New' }] },
 'leads-detail': { auth: true, title: 'Lead', breadcrumbs: [{ label: 'Leads', href: '#/leads' }, { label: 'Detail' }] },
 'leads-edit': { auth: true, title: 'Edit Lead', breadcrumbs: [{ label: 'Leads', href: '#/leads' }, { label: 'Edit' }] },
 'contacts-list': { auth: true, title: 'Contacts' },
 'contacts-new': { auth: true, title: 'New Contact' },
 'contacts-detail': { auth: true, title: 'Contact' },
 'contacts-edit': { auth: true, title: 'Edit Contact' },
 'companies-list': { auth: true, title: 'Companies' },
 'companies-new': { auth: true, title: 'New Company' },
 'companies-detail': { auth: true, title: 'Company' },
 'companies-edit': { auth: true, title: 'Edit Company' },
 'deals-list': { auth: true, title: 'Deals' },
 'deals-new': { auth: true, title: 'New Deal' },
 'deals-detail': { auth: true, title: 'Deal' },
 'deals-edit': { auth: true, title: 'Edit Deal' },
 'tasks-list': { auth: true, title: 'Tasks' },
 'tasks-new': { auth: true, title: 'New Task' },
 'tasks-detail': { auth: true, title: 'Task' },
 'tasks-edit': { auth: true, title: 'Edit Task' },
 'projects-list': { auth: true, title: 'Projects' },
 'projects-new': { auth: true, title: 'New Project' },
 'projects-detail': { auth: true, title: 'Project' },
 'projects-edit': { auth: true, title: 'Edit Project' },
 'chat': { auth: true, title: 'Chat' },
 'chat-list': { auth: true, title: 'Chat' },
 'calls-list': { auth: true, title: 'Call Logs' },
 'calls-dashboard': { auth: true, title: 'Calls Dashboard' },
 'payments-list': { auth: true, title: 'Payments' },
 'payments-new': { auth: true, title: 'New Payment' },
 'payments-detail': { auth: true, title: 'Payment' },
 'payments-edit': { auth: true, title: 'Edit Payment' },
 'reminders-list': { auth: true, title: 'Reminders' },
 'reminders-new': { auth: true, title: 'New Reminder' },
 'reminders-detail': { auth: true, title: 'Reminder' },
 'reminders-edit': { auth: true, title: 'Edit Reminder' },
 'campaigns-list': { auth: true, title: 'Campaigns' },
 'campaigns-new': { auth: true, title: 'New Campaign' },
 'campaigns-detail': { auth: true, title: 'Campaign' },
 'campaigns-edit': { auth: true, title: 'Edit Campaign' },
 'memos-list': { auth: true, title: 'Memos' },
 'memos-new': { auth: true, title: 'New Memo' },
 'memos-detail': { auth: true, title: 'Memo' },
 'memos-edit': { auth: true, title: 'Edit Memo' },
 'profile': { auth: true, title: 'Profile' },
 'settings': { auth: true, title: 'Settings' },
 'integrations': { auth: true, title: 'Integrations' },
 'forbidden': { auth: false, title: 'Forbidden' },
 'not-found': { auth: false, title: 'Not Found' }
};

export function getRouteMeta(name) {
 return routeMeta[name] || { auth: false };
}

export function parseHash() {
  const raw = (location.hash || '').replace(/^#/, '');
  const path = raw || '/leads';
  const segments = path.split('/').filter(Boolean);
  // routes: /login, /dashboard, /leads, /leads/new, /leads/:id, /leads/:id/edit
  if (segments[0] === 'login') return { name: 'login', params: {} };
  if (segments[0] === 'dashboard') return { name: 'dashboard', params: {} };
  if (segments[0] === 'leads') {
    if (!segments[1]) return { name: 'leads-list', params: {} };
    if (segments[1] === 'new') return { name: 'leads-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'leads-edit', params: { id } };
    return { name: 'leads-detail', params: { id } };
  }
  if (segments[0] === 'contacts') {
    if (!segments[1]) return { name: 'contacts-list', params: {} };
    if (segments[1] === 'new') return { name: 'contacts-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'contacts-edit', params: { id } };
    return { name: 'contacts-detail', params: { id } };
  }
  if (segments[0] === 'companies') {
    if (!segments[1]) return { name: 'companies-list', params: {} };
    if (segments[1] === 'new') return { name: 'companies-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'companies-edit', params: { id } };
    return { name: 'companies-detail', params: { id } };
  }
  if (segments[0] === 'deals') {
    if (!segments[1]) return { name: 'deals-list', params: {} };
    if (segments[1] === 'new') return { name: 'deals-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'deals-edit', params: { id } };
    return { name: 'deals-detail', params: { id } };
  }
  if (segments[0] === 'tasks') {
    if (!segments[1]) return { name: 'tasks-list', params: {} };
    if (segments[1] === 'new') return { name: 'tasks-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'tasks-edit', params: { id } };
    return { name: 'tasks-detail', params: { id } };
  }
  if (segments[0] === 'projects') {
    if (!segments[1]) return { name: 'projects-list', params: {} };
    if (segments[1] === 'new') return { name: 'projects-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'projects-edit', params: { id } };
    return { name: 'projects-detail', params: { id } };
  }
  if (segments[0] === 'chat') {
    if (!segments[1]) return { name: 'chat-list', params: {} };
    // /chat/:entityType/:entityId - chat for specific entity
    const entityType = segments[1];
    const entityId = segments[2];
    return { name: 'chat-thread', params: { entityType, entityId } };
  }
  if (segments[0] === 'calls') {
    if (!segments[1]) return { name: 'calls-list', params: {} };
    if (segments[1] === 'dashboard') return { name: 'calls-dashboard', params: {} };
    const id = segments[1];
    return { name: 'calls-detail', params: { id } };
  }
  if (segments[0] === 'payments') {
    if (!segments[1]) return { name: 'payments-list', params: {} };
    if (segments[1] === 'new') return { name: 'payments-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'payments-edit', params: { id } };
    return { name: 'payments-detail', params: { id } };
  }
  if (segments[0] === 'reminders') {
    if (!segments[1]) return { name: 'reminders-list', params: {} };
    if (segments[1] === 'new') return { name: 'reminders-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'reminders-edit', params: { id } };
    return { name: 'reminders-detail', params: { id } };
  }
  if (segments[0] === 'campaigns') {
    if (!segments[1]) return { name: 'campaigns-list', params: {} };
    if (segments[1] === 'new') return { name: 'campaigns-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'campaigns-edit', params: { id } };
    return { name: 'campaigns-detail', params: { id } };
  }
  if (segments[0] === 'memos') {
    if (!segments[1]) return { name: 'memos-list', params: {} };
    if (segments[1] === 'new') return { name: 'memos-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'memos-edit', params: { id } };
    return { name: 'memos-detail', params: { id } };
  }
  if (segments[0] === 'profile') return { name: 'profile', params: {} };
  if (segments[0] === 'settings') return { name: 'settings', params: {} };
  if (segments[0] === 'integrations') return { name: 'integrations', params: {} };
  return { name: 'leads-list', params: {} };
}

export function navigate(path, { replace = false } = {}) {
  if (!path.startsWith('#')) path = '#' + path;
  
  if (replace && typeof history !== 'undefined' && history.replaceState) {
    // Use history API to replace instead of adding to history
    const url = new URL(window.location);
    url.hash = path;
    history.replaceState(null, '', url);
    notify();
  } else if (location.hash === path) {
    // force notify
    notify();
  } else {
    location.hash = path;
  }
}

function notify() {
  const route = parseHash();
  
  // Check auth guard before notifying listeners
  const meta = getRouteMeta(route.name);
  if (meta.auth !== false) {
    // Route requires authentication
    try {
      if (!isAuthenticated()) {
        console.warn('[Router] Unauthorized access, redirecting to login');
        // Prevent infinite loop by checking if already on login
        if (route.name !== 'login') {
          location.hash = '#/login';
          return; // Don't notify listeners
        }
      }
    } catch (err) {
      console.error('[Router] Auth check failed:', err);
    }
  }
  
  listeners.forEach((cb) => cb(route));
}

export function onRouteChange(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((x) => x !== cb); };
}

window.addEventListener('hashchange', notify);

// initial tick for consumers who import after DOM ready
setTimeout(() => notify(), 0);
import { isAuthenticated } from './lib/api/auth.js';
