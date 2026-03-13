let listeners = [];

// Minimal route meta registry
export const routeMeta = {
 'login': { auth: false, title: 'Login', breadcrumbs: [{ label: 'Login' }] },
 'dashboard': { auth: true, title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard', href: '#/dashboard' }] },
 'leads-list': { auth: true, roles: ['admin','manager'], title: 'Leads', breadcrumbs: [{ label: 'Leads', href: '#/leads' }] },
 'leads-new': { auth: true, roles: ['admin','manager'], title: 'New Lead', breadcrumbs: [{ label: 'Leads', href: '#/leads' }, { label: 'New' }] },
 'leads-detail': { auth: true, roles: ['admin','manager','sales'], title: 'Lead', breadcrumbs: [{ label: 'Leads', href: '#/leads' }, { label: 'Detail' }] },
 'leads-edit': { auth: true, roles: ['admin','manager'], title: 'Edit Lead', breadcrumbs: [{ label: 'Leads', href: '#/leads' }, { label: 'Edit' }] },
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
 'marketing-segments': { auth: true, title: 'Segments' },
 'marketing-templates': { auth: true, title: 'Templates' },
 'memos-list': { auth: true, title: 'Memos' },
 'memos-new': { auth: true, title: 'New Memo' },
 'memos-detail': { auth: true, title: 'Memo' },
 'memos-edit': { auth: true, title: 'Edit Memo' },
 'products-list': { auth: true, title: 'Products' },
 'products-new': { auth: true, title: 'New Product' },
 'products-detail': { auth: true, title: 'Product' },
 'products-edit': { auth: true, title: 'Edit Product' },
 'crm-emails': { auth: true, title: 'CRM Emails' },
 'massmail': { auth: true, title: 'Massmail' },
 'operations': { auth: true, title: 'Operations' },
 'reference-data': { auth: true, title: 'Reference Data' },
 'help-center': { auth: true, title: 'Help Center' },
 'analytics': { auth: true, title: 'Analytics' },
 'sms-center': { auth: true, title: 'SMS Center' },
 'telephony': { auth: true, title: 'Telephony' },
 'users': { auth: true, title: 'Users' },
 'profile': { auth: true, title: 'Profile' },
 'settings': { auth: true, title: 'Settings' },
 'integrations': { auth: true, title: 'Integrations' },
 'landing-builder': { auth: true, title: 'Landing Builder' },
 'landing-public': { auth: false, title: 'Public Landing' },
 'landing-preview': { auth: false, title: 'Landing Preview' },
 'crm-landing': { auth: false, title: 'CRM Landing' },
 'forbidden': { auth: false, title: 'Forbidden' },
 'not-found': { auth: false, title: 'Not Found' },
 'chat-thread': { auth: true, title: 'Chat Thread' }
};

const READ_ROLES = ['admin', 'manager', 'sales'];
const WRITE_ROLES = ['admin', 'manager'];
const ADMIN_ROLES = ['admin', 'manager'];
const ADMIN_PERMISSIONS = ['auth.view_user', 'settings.view_systemsettings'];

[
  'dashboard',
  'leads-list',
  'leads-detail',
  'contacts-list',
  'contacts-detail',
  'companies-list',
  'companies-detail',
  'deals-list',
  'deals-detail',
  'tasks-list',
  'tasks-detail',
  'projects-list',
  'projects-detail',
  'chat',
  'chat-list',
  'chat-thread',
  'calls-list',
  'calls-dashboard',
  'payments-list',
  'payments-detail',
  'reminders-list',
  'reminders-detail',
  'campaigns-list',
  'campaigns-detail',
  'memos-list',
  'memos-detail',
  'products-list',
  'products-detail',
  'crm-emails',
  'massmail',
  'help-center',
  'analytics',
  'sms-center',
  'telephony',
  'profile',
].forEach((route) => {
  if (routeMeta[route]) routeMeta[route].roles = READ_ROLES;
});

[
  'leads-new',
  'leads-edit',
  'contacts-new',
  'contacts-edit',
  'companies-new',
  'companies-edit',
  'deals-new',
  'deals-edit',
  'tasks-new',
  'tasks-edit',
  'projects-new',
  'projects-edit',
  'payments-new',
  'payments-edit',
  'reminders-new',
  'reminders-edit',
  'campaigns-new',
  'campaigns-edit',
  'memos-new',
  'memos-edit',
  'products-new',
  'products-edit',
].forEach((route) => {
  if (routeMeta[route]) routeMeta[route].roles = WRITE_ROLES;
});

[
  'operations',
  'reference-data',
  'users',
  'settings',
  'integrations',
].forEach((route) => {
  if (routeMeta[route]) routeMeta[route].roles = ADMIN_ROLES;
});

[
  ['leads-list', 'crm.view_lead'],
  ['leads-detail', 'crm.view_lead'],
  ['leads-new', 'crm.add_lead'],
  ['leads-edit', 'crm.change_lead'],
  ['contacts-list', 'crm.view_contact'],
  ['contacts-detail', 'crm.view_contact'],
  ['contacts-new', 'crm.add_contact'],
  ['contacts-edit', 'crm.change_contact'],
  ['companies-list', 'crm.view_company'],
  ['companies-detail', 'crm.view_company'],
  ['companies-new', 'crm.add_company'],
  ['companies-edit', 'crm.change_company'],
  ['deals-list', 'crm.view_deal'],
  ['deals-detail', 'crm.view_deal'],
  ['deals-new', 'crm.add_deal'],
  ['deals-edit', 'crm.change_deal'],
  ['tasks-list', 'tasks.view_task'],
  ['tasks-detail', 'tasks.view_task'],
  ['tasks-new', 'tasks.add_task'],
  ['tasks-edit', 'tasks.change_task'],
  ['projects-list', 'tasks.view_project'],
  ['projects-detail', 'tasks.view_project'],
  ['projects-new', 'tasks.add_project'],
  ['projects-edit', 'tasks.change_project'],
  ['payments-list', 'crm.view_payment'],
  ['payments-detail', 'crm.view_payment'],
  ['payments-new', 'crm.add_payment'],
  ['payments-edit', 'crm.change_payment'],
  ['reminders-list', 'common.view_reminder'],
  ['reminders-detail', 'common.view_reminder'],
  ['reminders-new', 'common.add_reminder'],
  ['reminders-edit', 'common.change_reminder'],
  ['campaigns-list', 'marketing.view_campaign'],
  ['campaigns-detail', 'marketing.view_campaign'],
  ['campaigns-new', 'marketing.add_campaign'],
  ['campaigns-edit', 'marketing.change_campaign'],
  ['marketing-segments', 'marketing.view_segment'],
  ['marketing-templates', 'marketing.view_messagetemplate'],
  ['memos-list', 'tasks.view_memo'],
  ['memos-detail', 'tasks.view_memo'],
  ['memos-new', 'tasks.add_memo'],
  ['memos-edit', 'tasks.change_memo'],
  ['products-list', 'crm.view_product'],
  ['products-detail', 'crm.view_product'],
  ['products-new', 'crm.add_product'],
  ['products-edit', 'crm.change_product'],
  ['chat', 'chat.view_chatmessage'],
  ['chat-list', 'chat.view_chatmessage'],
  ['chat-thread', 'chat.view_chatmessage'],
  ['calls-list', 'voip.view_calllog'],
  ['calls-dashboard', 'voip.view_calllog'],
  ['telephony', 'voip.view_connection'],
  ['massmail', 'massmail.view_mailingout'],
  ['analytics', 'analytics.view_incomestat'],
  ['landing-builder', 'landings.view_landingpage'],
].forEach(([route, permission]) => {
  if (routeMeta[route]) routeMeta[route].permissions = [permission];
});

[
  'users',
  'settings',
  'integrations',
  'reference-data',
  'operations',
].forEach((route) => {
  if (routeMeta[route]) routeMeta[route].permissions = ADMIN_PERMISSIONS;
});

export function getRouteMeta(name) {
 return routeMeta[name] || { auth: false };
}

export function parseHash() {
  const raw = (location.hash || '').replace(/^#/, '');
  const [rawPath = ''] = raw.split('?');
  // Require authentication - redirect to login if no hash
  const path = rawPath || (isAuthenticated() ? '/dashboard' : '/login');
  const segments = path.split('/').filter(Boolean);
  // routes: /login, /dashboard, /leads, /leads/new, /leads/:id, /leads/:id/edit
  if (segments[0] === 'login') return { name: 'login', params: {} };
  if (segments[0] === 'forbidden') return { name: 'forbidden', params: {} };
  if (segments[0] === '404') return { name: 'not-found', params: {} };
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
  if (segments[0] === 'marketing') {
    if (segments[1] === 'segments') return { name: 'marketing-segments', params: {} };
    if (segments[1] === 'templates') return { name: 'marketing-templates', params: {} };
  }
  if (segments[0] === 'memos') {
    if (!segments[1]) return { name: 'memos-list', params: {} };
    if (segments[1] === 'new') return { name: 'memos-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'memos-edit', params: { id } };
    return { name: 'memos-detail', params: { id } };
  }
  if (segments[0] === 'products') {
    if (!segments[1]) return { name: 'products-list', params: {} };
    if (segments[1] === 'new') return { name: 'products-new', params: {} };
    const id = segments[1];
    if (segments[2] === 'edit') return { name: 'products-edit', params: { id } };
    return { name: 'products-detail', params: { id } };
  }
  if (segments[0] === 'crm-emails') return { name: 'crm-emails', params: {} };
  if (segments[0] === 'massmail') return { name: 'massmail', params: {} };
  if (segments[0] === 'operations') return { name: 'operations', params: {} };
  if (segments[0] === 'reference-data') return { name: 'reference-data', params: {} };
  if (segments[0] === 'help') return { name: 'help-center', params: {} };
  if (segments[0] === 'analytics') return { name: 'analytics', params: {} };
  if (segments[0] === 'sms') return { name: 'sms-center', params: {} };
  if (segments[0] === 'telephony') return { name: 'telephony', params: {} };
  if (segments[0] === 'users') return { name: 'users', params: {} };
  if (segments[0] === 'profile') return { name: 'profile', params: {} };
  if (segments[0] === 'settings') return { name: 'settings', params: {} };
  if (segments[0] === 'integrations') return { name: 'integrations', params: {} };
  if (segments[0] === 'landing-builder') return { name: 'landing-builder', params: {} };
  if (segments[0] === 'crm-landing') return { name: 'crm-landing', params: {} };
  if (segments[0] === 'public-landing') {
    const slug = segments[1];
    if (!slug) return { name: 'not-found', params: {} };
    if (segments[2] === 'preview') {
      const token = segments[3];
      if (!token) return { name: 'not-found', params: {} };
      return { name: 'landing-preview', params: { slug, token } };
    }
    return { name: 'landing-public', params: { slug } };
  }
  // Unknown route
  return isAuthenticated() ? { name: 'not-found', params: {} } : { name: 'login', params: {} };
}

function scheduleNotify() {
  // Defer notify to avoid React 18 error:
  // "A component suspended while responding to synchronous input"
  // (happens when route update triggers a lazy() boundary)
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => notify());
  } else {
    Promise.resolve().then(() => notify());
  }
}

export function navigate(path, { replace = false } = {}) {
  if (!path.startsWith('#')) path = '#' + path;

  if (replace && typeof history !== 'undefined' && history.replaceState) {
    // Use history API to replace instead of adding to history
    const url = new URL(window.location);
    url.hash = path;
    history.replaceState(null, '', url);
    scheduleNotify();
  } else if (location.hash === path) {
    // force notify
    scheduleNotify();
  } else {
    location.hash = path;
  }
}

function notify() {
  const route = parseHash();
  // Check auth + roles guard before notifying listeners
  const meta = getRouteMeta(route.name);
  try {
    const ok = authGuardMiddleware(route, meta);
    if (!ok) return; // guard handled navigation
  } catch (err) {
    console.error('[Router] Guard failed:', err);
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
import { authGuardMiddleware } from './lib/auth-guard.js';
