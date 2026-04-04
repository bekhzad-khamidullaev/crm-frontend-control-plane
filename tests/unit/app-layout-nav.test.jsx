import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLayout } from '../../src/components/AppLayout.jsx';

vi.mock('../../src/assets/brand/favicon.svg', () => ({ default: '/mock-brand-mark.svg' }));
vi.mock('../../src/assets/brand/logo.svg', () => ({ default: '/mock-brand-logo.svg' }));
vi.mock('../../src/assets/brand/logo-dark.svg', () => ({ default: '/mock-brand-logo-dark.svg' }));

vi.mock('../../src/lib/hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../../src/lib/api/licenseFeatureName', () => ({
  default: (feature) => feature,
}));

vi.mock('../../src/lib/i18n/index.js', () => ({
  getLocale: () => 'ru',
  t: (key) => {
    const labels = {
      'nav.dashboard': 'Дашборд',
      'nav.leads': 'Лиды',
      'nav.chat': 'Чаты',
      'nav.aiChat': 'AI чат CRM',
      'nav.salesGroup': 'Продажи',
      'nav.communicationsGroup': 'Коммуникации',
      'nav.marketingGroup': 'Маркетинг',
      'nav.operationsGroup': 'Операции',
      'nav.systemGroup': 'Система',
      'nav.profile': 'Профиль',
      'nav.language': 'Язык',
      'nav.theme': 'Тема',
      'nav.themeLight': 'Светлая',
      'nav.themeDark': 'Темная',
      'nav.logout': 'Выход',
      'nav.helpCenter': 'Справка',
      'nav.settings': 'Настройки',
      'nav.licenseWorkspace': 'License Workspace',
      'nav.integrations': 'Интеграции',
      'nav.referenceData': 'Справочники',
      'nav.landingBuilder': 'Конструктор лендингов',
      'nav.users': 'Пользователи',
      'nav.contacts': 'Контакты',
      'nav.companies': 'Компании',
      'nav.deals': 'Сделки',
      'nav.tasks': 'Задачи',
      'nav.projects': 'Проекты',
      'nav.products': 'Продукты',
      'nav.calls': 'Звонки',
      'nav.reminders': 'Напоминания',
      'nav.massmail': 'Массовые рассылки',
      'nav.smsCenter': 'SMS',
      'nav.memos': 'Заметки',
      'nav.campaigns': 'Кампании',
      'nav.segments': 'Сегменты',
      'nav.templates': 'Шаблоны',
      'nav.analytics': 'Аналитика',
      'nav.payments': 'Платежи',
      'nav.operationsRegistry': 'Реестр операций',
      'nav.version': 'Версия CRM',
    };
    return labels[key] || key;
  },
}));

vi.mock('../../src/router.js', () => ({
  navigate: vi.fn(),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => ({ lg: true, sm: true }),
    },
  };
});

describe('AppLayout navigation gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('does not render restricted nav items when allowedNavKeys is an empty array', () => {
    render(
      <AppLayout
        collapsed={false}
        onToggleCollapsed={vi.fn()}
        locale="ru"
        onLocaleChange={vi.fn()}
        selectedKey="dashboard"
        user={{ username: 'admin' }}
        frontendVersion="test"
        wsConnected={false}
        wsReconnecting={false}
        activeIntegrations={[]}
        incomingCallsCount={0}
        unreadCount={0}
        allowedNavKeys={[]}
        onOpenDialer={vi.fn()}
        onLogout={vi.fn()}
      >
        <div>content</div>
      </AppLayout>
    );

    expect(screen.queryByText('AI чат CRM')).not.toBeInTheDocument();
    expect(screen.queryByText('Лиды')).not.toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders AI chat nav item when ai-chat is explicitly allowed', () => {
    render(
      <AppLayout
        collapsed={false}
        onToggleCollapsed={vi.fn()}
        locale="ru"
        onLocaleChange={vi.fn()}
        selectedKey="ai-chat"
        user={{ username: 'admin' }}
        frontendVersion="test"
        wsConnected={false}
        wsReconnecting={false}
        activeIntegrations={[]}
        incomingCallsCount={0}
        unreadCount={0}
        allowedNavKeys={['ai-chat']}
        onOpenDialer={vi.fn()}
        onLogout={vi.fn()}
      >
        <div>content</div>
      </AppLayout>
    );

    expect(screen.getAllByText('AI чат CRM').length).toBeGreaterThan(0);
    expect(screen.queryByText('Лиды')).not.toBeInTheDocument();
  });

  it('shows theme options inline in the user dropdown without nested submenu popups', async () => {
    render(
      <AppLayout
        collapsed={false}
        onToggleCollapsed={vi.fn()}
        locale="ru"
        onLocaleChange={vi.fn()}
        selectedKey="dashboard"
        user={{ username: 'admin', roles: ['admin'] }}
        frontendVersion={{ frontend_version: 'test' }}
        wsConnected={false}
        wsReconnecting={false}
        activeIntegrations={[]}
        incomingCallsCount={0}
        unreadCount={0}
        allowedNavKeys={['settings']}
        onOpenDialer={vi.fn()}
        onLogout={vi.fn()}
      >
        <div>content</div>
      </AppLayout>
    );

    const trigger = screen.getByText('admin').closest('.ant-space');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(document.querySelector('.ant-dropdown')).toBeTruthy();
    });

    const dropdown = document.querySelector('.ant-dropdown');
    expect(within(dropdown).getByText('Язык')).toBeInTheDocument();
    expect(within(dropdown).getByText('RU')).toBeInTheDocument();
    expect(within(dropdown).getByText('Тема')).toBeInTheDocument();
    expect(within(dropdown).getAllByText('Светлая').length).toBeGreaterThan(0);
    expect(within(dropdown).getByText('Темная')).toBeInTheDocument();
    expect(document.querySelector('.ant-menu-submenu-popup')).toBeFalsy();
  });
});
