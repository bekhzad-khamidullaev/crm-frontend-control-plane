import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  DragOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { landingsApi } from '../lib/api/client';
import { useTheme } from '../lib/hooks/useTheme.js';
import { canWrite } from '../lib/rbac.js';

const { Title, Text } = Typography;

const SECTION_TYPE_OPTIONS = [
  { value: 'hero', label: 'Hero' },
  { value: 'text', label: 'Текстовый блок' },
  { value: 'features', label: 'Преимущества' },
  { value: 'cta', label: 'CTA' },
  { value: 'carousel', label: 'Карусель' },
  { value: 'contacts', label: 'Контакты' },
  { value: 'form', label: 'Форма захвата' },
  { value: 'custom_html', label: 'Custom HTML (sandbox)' },
];

const OWNER_STRATEGY_OPTIONS = [
  { value: 'inherit', label: 'Наследовать owner лендинга' },
  { value: 'round_robin', label: 'Round Robin очередь' },
  { value: 'fixed_user', label: 'Фиксированный менеджер' },
  { value: 'by_department', label: 'По департаменту' },
];

const FORM_FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
];

const CRM_FIELD_OPTIONS = [
  { value: 'full_name', label: 'Полное имя -> Имя + Фамилия' },
  { value: 'phone', label: 'Телефон -> Основной телефон' },
  { value: 'business_size', label: 'Размер бизнеса -> Кол-во сотрудников' },
  { value: 'annual_revenue', label: 'Годовой доход -> Годовой оборот' },
  { value: 'email', label: 'Email -> Основной Email' },
  { value: 'notes', label: 'Примечание -> Описание лида' },
];

const PERSONALIZATION_SOURCE_OPTIONS = [
  { value: 'utm', label: 'UTM параметр' },
  { value: 'cookie', label: 'Cookie' },
];

const PERSONALIZATION_KEY_OPTIONS = {
  utm: [
    { value: 'source', label: 'utm_source' },
    { value: 'medium', label: 'utm_medium' },
    { value: 'campaign', label: 'utm_campaign' },
    { value: 'term', label: 'utm_term' },
    { value: 'content', label: 'utm_content' },
  ],
  cookie: [
    { value: 'segment', label: 'segment' },
    { value: 'persona', label: 'persona' },
    { value: 'country', label: 'country' },
  ],
};

const ALLOWED_SECTION_TYPES = new Set(SECTION_TYPE_OPTIONS.map((item) => item.value));

const DEFAULT_THEME = {
  primary: '#1f2937',
  background: '#f8fafc',
  text: '#111827',
  accent: '#2563eb',
};

const LANDING_PRESET_OPTIONS = [
  {
    value: 'saas_neon',
    label: 'SaaS Neon',
    description: 'Темный tech-стиль с bento-сеткой, social proof и сильным CTA',
  },
  {
    value: 'agency_editorial',
    label: 'Agency Editorial',
    description: 'Премиальный editorial-подход: кейсы, доверие и high-ticket оффер',
  },
  {
    value: 'fintech_glass',
    label: 'Fintech Glass',
    description: 'Современный fintech-интерфейс: trust, compliance и конверсионная форма',
  },
  {
    value: 'minimal_product',
    label: 'Minimal Product',
    description: 'Минималистичный product-led шаблон с акцентом на скорость и ясность',
  },
  {
    value: 'ai_bento_launch',
    label: 'AI Bento Launch',
    description: 'AI/SaaS шаблон с bento-блоками, интеграциями и демо-ориентированным CTA',
  },
  {
    value: 'cybersec_command',
    label: 'Cybersec Command',
    description: 'Сильный enterprise security-паттерн: доверие, SLA и SOC-ready коммуникация',
  },
  {
    value: 'ecom_storyflow',
    label: 'Ecom Storyflow',
    description: 'E-commerce/promo лендинг с storytelling-блоками, оффером и быстрым заказом',
  },
  {
    value: 'mobile_app_spotlight',
    label: 'Mobile App Spotlight',
    description: 'Мобильный продуктовый шаблон с акцентом на value, фичи и app-install CTA',
  },
  {
    value: 'enterprise_crm',
    label: 'Enterprise CRM',
    description: 'Шаблон под Enterprise CRM: B2B оффер, CRM-скриншоты, выгоды и форма генерации лидов',
  },
];

const LANDING_TEMPLATE_LIBRARY = [
  {
    key: 'saas_neon',
    name: 'SaaS Neon Velocity',
    category: 'SaaS',
    styleTags: ['Dark UI', 'Bento', 'Social Proof', 'High Contrast'],
    description: 'Сильный B2B SaaS-шаблон в духе топовых Webflow/Framer примеров: hero, trust-модуль, bento-блоки и жёсткий CTA.',
    highlights: [
      'Split hero + KPI/social proof в первом экране',
      'Bento-секция выгод и интеграций',
      'Форма демо-запроса с акцентом на конверсию',
    ],
    palette: ['#030712', '#1d4ed8', '#22d3ee'],
  },
  {
    key: 'agency_editorial',
    name: 'Agency Editorial Prime',
    category: 'Agency',
    styleTags: ['Editorial', 'Premium', 'Case Studies', 'Conversion Copy'],
    description: 'Editorial шаблон для агентств и консалтинга: крупная типографика, блоки кейсов, value narrative и high-ticket lead capture.',
    highlights: [
      'Глубокий narrative: оффер -> доказательства -> CTA',
      'Карточки кейсов и дифференциации услуги',
      'Блок заявки под strategy call',
    ],
    palette: ['#111827', '#1f2937', '#f97316'],
  },
  {
    key: 'fintech_glass',
    name: 'Fintech Glass Trust',
    category: 'Fintech',
    styleTags: ['Glassmorphism', 'Trust', 'Compliance', 'Product UI'],
    description: 'Финтех-шаблон со светлой доверительной эстетикой: метрики, security/compliance, onboarding-flow и демо-форма.',
    highlights: [
      'Trust-секция с ключевыми метриками и сертификатами',
      'Glass-карточки и современная продуктовая подача',
      'Фокус на KYC-safe onboarding CTA',
    ],
    palette: ['#e0e7ff', '#dbeafe', '#0ea5a4'],
  },
  {
    key: 'minimal_product',
    name: 'Minimal Product Sharp',
    category: 'Product',
    styleTags: ['Minimal', 'Product-led', 'Fast', 'Clean Grid'],
    description: 'Чистый product-led шаблон с акцентом на speed-to-value: ясный оффер, краткие блоки пользы и лаконичный conversion path.',
    highlights: [
      'Сильный фокус на clarity и читаемости',
      'Контент без шума: только value и action',
      'Оптимизирован под performance трафик',
    ],
    palette: ['#ffffff', '#f8fafc', '#2563eb'],
  },
  {
    key: 'ai_bento_launch',
    name: 'AI Bento Launch',
    category: 'AI SaaS',
    styleTags: ['Bento', 'AI', 'Gradient', 'Integrations'],
    description: 'Шаблон в стиле современных AI-лендингов: модульная bento-сетка, блок интеграций и конверсионный демо-запрос.',
    highlights: [
      'AI-оффер с ясным outcome в первом экране',
      'Bento-модули с use-case и automation value',
      'Demo CTA и CRM-ready лид-форма',
    ],
    palette: ['#0b1025', '#4f46e5', '#22d3ee'],
  },
  {
    key: 'cybersec_command',
    name: 'Cybersec Command',
    category: 'Security',
    styleTags: ['Enterprise', 'Security', 'Dark', 'Trust'],
    description: 'Enterprise security-лендинг с упором на доверие: threat coverage, SLA, compliance и заявка на security assessment.',
    highlights: [
      'Trust-first hero для B2B security сегмента',
      'Coverage/Compliance блоки с четким value',
      'Форма запроса security audit',
    ],
    palette: ['#020617', '#0f172a', '#38bdf8'],
  },
  {
    key: 'ecom_storyflow',
    name: 'Ecom Storyflow',
    category: 'E-commerce',
    styleTags: ['Storytelling', 'Promo', 'Offer', 'Conversion'],
    description: 'E-commerce landing-паттерн: storyflow оффера, визуальный showcase и быстрый conversion path к заказу.',
    highlights: [
      'Сценарий: проблема -> решение -> соцдоказательство',
      'Промо-блоки под кампании и сезонные офферы',
      'Быстрый лид/заказ через форму',
    ],
    palette: ['#fff7ed', '#fdba74', '#f97316'],
  },
  {
    key: 'mobile_app_spotlight',
    name: 'Mobile App Spotlight',
    category: 'Mobile',
    styleTags: ['Mobile-first', 'App UI', 'Clean', 'Install CTA'],
    description: 'Современный mobile app шаблон: spotlight на UI, выгоды продукта и цепочка к установке/дэмо.',
    highlights: [
      'Hero с app-value и коротким onboarding обещанием',
      'Секция фич и скриншотов приложения',
      'CTA на установку и demo-конверсию',
    ],
    palette: ['#ecfeff', '#93c5fd', '#2563eb'],
  },
  {
    key: 'enterprise_crm',
    name: 'Enterprise CRM',
    category: 'CRM',
    styleTags: ['Enterprise', 'B2B', 'CRM', 'Lead Capture'],
    description: 'Шаблон на базе промо-лендинга Enterprise CRM: оффер, proof-блоки, product tour и CRM-ready форма.',
    highlights: [
      'Оффер и value-структура под сложный B2B цикл сделки',
      'Секция с реальными CRM-экранами (carousel)',
      'Лид-форма с CRM mapping и готовым form binding',
    ],
    palette: ['#eef3f8', '#0e8f73', '#1d4f91'],
  },
];

const CUSTOM_TEMPLATE_STORAGE_KEY = 'crm_landing_builder_custom_templates_v1';
const CUSTOM_TEMPLATE_LIMIT = 50;

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCustomDomain(value) {
  let raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('://')) {
    try {
      raw = new URL(raw).host.toLowerCase();
    } catch {
      raw = raw.split('://').slice(-1)[0] || raw;
    }
  }
  raw = raw.split('/')[0].trim().replace(/\.+$/g, '');
  if (raw.includes(':')) raw = raw.split(':')[0].trim();
  return raw;
}

function escapeSvgText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortenText(value, maxLength = 44) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 1)).trim()}…`;
}

function parseCommaValues(value, fallback = []) {
  const source = String(value || '');
  const items = source
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

function parseLines(value, fallback = []) {
  const source = String(value || '');
  const items = source
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

function buildSandboxSrcDoc(section = {}) {
  const html = String(section.custom_html || section.html || '');
  const css = String(section.custom_css || section.css || '');
  const js = String(section.custom_js || section.js || '').replace(/<\/(script)/gi, '<\\/$1');
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { font-family: Inter, system-ui, sans-serif; }
      body { margin: 0; padding: 12px; background: #fff; color: #111827; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${js}
      } catch (err) {
        document.body.insertAdjacentHTML('beforeend', '<pre style="color:#b91c1c">' + String(err) + '</pre>');
      }
    </script>
  </body>
</html>`;
}

function createDefaultField(index = 1) {
  return {
    key: `field_${index}`,
    label: `Поле ${index}`,
    type: 'text',
    required: false,
    crm_field: 'notes',
    transform: '',
  };
}

function createSection(type, rowIndex = 1) {
  const id = uid(type);
  if (type === 'hero') {
    return {
      id,
      type,
      row_index: rowIndex,
      sectionRole: 'cover',
      title: 'Заголовок оффера',
      subtitle: 'Краткое описание ценности',
      body: '',
      background: '#ffffff',
      textColor: '#111827',
    };
  }
  if (type === 'text') {
    return {
      id,
      type,
      row_index: rowIndex,
      sectionRole: 'custom',
      title: 'Текстовый блок',
      body: 'Добавьте описание продукта, кейс или аргументацию.',
      background: '#ffffff',
      textColor: '#111827',
    };
  }
  if (type === 'features') {
    return {
      id,
      type,
      row_index: rowIndex,
      sectionRole: 'custom',
      title: 'Преимущества',
      items: ['Преимущество 1', 'Преимущество 2', 'Преимущество 3'],
      background: '#ffffff',
      textColor: '#111827',
    };
  }
  if (type === 'cta') {
    return {
      id,
      type,
      row_index: rowIndex,
      sectionRole: 'custom',
      title: 'Готовы обсудить задачу?',
      body: 'Оставьте заявку и получите ответ менеджера в течение 15 минут.',
      buttonText: 'Оставить заявку',
      background: '#ffffff',
      textColor: '#111827',
    };
  }
  if (type === 'carousel') {
    return {
      id,
      type,
      row_index: rowIndex,
      sectionRole: 'custom',
      title: 'Галерея',
      images: [],
      slideHeight: 320,
      background: '#ffffff',
      textColor: '#111827',
    };
  }
  if (type === 'contacts') {
    return {
      id,
      type,
      row_index: rowIndex,
      sectionRole: 'contacts',
      title: 'Контакты',
      subtitle: 'Свяжитесь с нами удобным способом',
      phone: '',
      email: '',
      address: '',
      whatsapp: '',
      telegram: '',
      instagram: '',
      facebook: '',
      linkedin: '',
      background: '#ffffff',
      textColor: '#111827',
    };
  }
  if (type === 'form') {
    return {
      id,
      type,
      row_index: rowIndex,
      sectionRole: 'lead_form',
      title: 'Оставьте заявку',
      subtitle: 'Мы свяжемся с вами в ближайшее время',
      buttonText: 'Отправить',
      blockId: id,
      formKey: 'lead_main',
      fields: [
        { key: 'name', label: 'Имя', type: 'text', required: true, crm_field: 'full_name', transform: 'split_name' },
        { key: 'phone', label: 'Телефон', type: 'tel', required: true, crm_field: 'phone', transform: 'to_e164' },
        { key: 'email', label: 'Email', type: 'email', required: true, crm_field: 'email', transform: 'email_mask+dedup' },
      ],
      background: '#ffffff',
      textColor: '#111827',
    };
  }
  if (type === 'custom_html') {
    return {
      id,
      type,
      row_index: rowIndex,
      sectionRole: 'custom',
      title: 'Custom HTML',
      custom_html: '<div><h3>Custom block</h3><p>Safe sandbox preview</p></div>',
      custom_css: 'h3 { margin: 0 0 8px; }',
      custom_js: '',
      iframeHeight: 280,
      background: '#ffffff',
      textColor: '#111827',
    };
  }
  return {
    id,
    type: 'text',
    row_index: rowIndex,
    sectionRole: 'custom',
    title: 'Новый блок',
    body: '',
    background: '#ffffff',
    textColor: '#111827',
  };
}

function createDefaultAbTest() {
  return {
    control_variant: 'control',
    variants: [
      {
        key: 'control',
        weight: 50,
        schema_patch: { page: { meta: { ab_variant: 'control' } } },
      },
      {
        key: 'variant_b',
        weight: 50,
        schema_patch: { page: { meta: { ab_variant: 'variant_b' } } },
      },
    ],
  };
}

function buildPresetSections(presetKey = 'saas_neon', title = 'Новый лендинг') {
  const phoneLabel = 'Свяжитесь с нами в WhatsApp или Telegram';

  if (presetKey === 'agency_editorial') {
    return [
      {
        ...createSection('hero', 1),
        sectionRole: 'cover',
        title: title || 'Editorial Studio For Revenue Teams',
        subtitle: 'Позиционирование, визуал и воронка в одном лендинге: как в топовых agency-шаблонах, но с CRM-native операционкой.',
        background: 'linear-gradient(130deg, #111827 0%, #1f2937 55%, #3f3f46 100%)',
        textColor: '#f8fafc',
        fontFamily: '"Sora", "Space Grotesk", sans-serif',
        borderRadius: 24,
      },
      {
        ...createSection('text', 1),
        title: '120+ запусков за 18 месяцев',
        body: 'Framework: Offer architecture -> Proof stack -> CTA sequence. Контент строится как коммерческий скрипт, а не набор блоков.',
        background: '#111827',
        textColor: '#e5e7eb',
        borderRadius: 20,
      },
      {
        ...createSection('features', 2),
        title: 'Что получает бизнес',
        items: [
          'Narrative-лендинг: story, proof, objection handling, CTA',
          'Case-study блоки с цифрами и social proof',
          'A/B-ready структура для быстрых итераций гипотез',
        ],
        background: '#fafaf9',
        textColor: '#111827',
        borderRadius: 18,
      },
      {
        ...createSection('carousel', 2),
        title: 'Галерея кейсов и экранов',
        slideHeight: 340,
        background: '#f4f4f5',
        textColor: '#18181b',
        borderRadius: 18,
      },
      {
        ...createSection('cta', 2),
        title: 'Нужна стратегия + дизайн + запуск?',
        body: 'Соберем лендинг-поток под ваш ACV и ICP, а не универсальный шаблон для всех.',
        buttonText: 'Запросить strategy call',
        background: '#111827',
        textColor: '#f9fafb',
        borderRadius: 18,
      },
      {
        ...createSection('form', 3),
        title: 'Получить концепт структуры за 24 часа',
        subtitle: 'Оставьте контакты и описание оффера. Подготовим wire-copy с блоками и CTA-логикой.',
        buttonText: 'Получить структуру',
        background: '#ffffff',
        textColor: '#111827',
        borderRadius: 18,
      },
      {
        ...createSection('contacts', 3),
        title: 'Контакты студии',
        subtitle: `${phoneLabel}. Telegram, WhatsApp, email - любой канал.`,
        background: '#ffffff',
        textColor: '#111827',
        borderRadius: 18,
      },
    ];
  }

  if (presetKey === 'fintech_glass') {
    return [
      {
        ...createSection('hero', 1),
        title: title || 'Fintech Growth Page With Trust By Default',
        subtitle: 'Продуктовый лендинг для fintech/payments: ясный value prop, доверие, compliance и low-friction onboarding.',
        background: 'linear-gradient(130deg, #e0e7ff 0%, #dbeafe 50%, #f0fdfa 100%)',
        textColor: '#0f172a',
        fontFamily: '"Plus Jakarta Sans", "Manrope", sans-serif',
        borderRadius: 24,
      },
      {
        ...createSection('text', 1),
        title: 'PCI-DSS / KYC / AML-ready позиционирование',
        body: 'Первый экран и trust-модули объясняют безопасность, SLA и операционную надежность без перегруза текстом.',
        background: 'rgba(255,255,255,0.82)',
        textColor: '#0f172a',
        borderRadius: 20,
      },
      {
        ...createSection('features', 2),
        title: 'Почему этот формат работает',
        items: [
          'Сильный trust layer: метрики, uptime, compliance',
          'Bento-подача use-cases для разных сегментов',
          'Форма демо и onboarding в одном сценарии',
        ],
        background: 'rgba(255,255,255,0.82)',
        textColor: '#0f172a',
        borderRadius: 20,
      },
      {
        ...createSection('carousel', 2),
        title: 'Скриншоты продукта и интеграций',
        slideHeight: 330,
        background: 'rgba(255,255,255,0.72)',
        textColor: '#0f172a',
        borderRadius: 20,
      },
      {
        ...createSection('cta', 2),
        title: 'Запустить onboarding-поток за 7 дней',
        body: 'Соберите страницу, включите CRM binding и начинайте привлекать qualified leads в ту же неделю.',
        buttonText: 'Стартовать pilot',
        background: 'rgba(255,255,255,0.82)',
        textColor: '#0f172a',
        borderRadius: 20,
      },
      {
        ...createSection('form', 3),
        title: 'Запросить product demo',
        subtitle: 'Подготовим сценарий под ваш market/region и покажем, как будет выглядеть production-лендинг.',
        buttonText: 'Запросить demo',
        background: '#ffffff',
        textColor: '#0f172a',
        borderRadius: 18,
      },
      {
        ...createSection('contacts', 3),
        title: 'Поддержка и продажи',
        subtitle: `${phoneLabel}. Отдельная линия для enterprise клиентов.`,
        background: '#ffffff',
        textColor: '#0f172a',
        borderRadius: 18,
      },
    ];
  }

  if (presetKey === 'ai_bento_launch') {
    return [
      {
        ...createSection('hero', 1),
        title: title || 'AI Workflow Landing For Revenue Teams',
        subtitle: 'Современный AI SaaS формат: сильный оффер, модульная bento-подача и demo-first конверсия.',
        background: 'linear-gradient(130deg, #0b1025 0%, #312e81 50%, #06b6d4 100%)',
        textColor: '#eef2ff',
        fontFamily: '"Sora", "Space Grotesk", sans-serif',
        borderRadius: 24,
      },
      {
        ...createSection('text', 1),
        title: 'Use by product, marketing and sales teams',
        body: 'Паттерн как у топовых AI landing templates: четкий outcome в первом экране и короткий путь к демо.',
        background: '#111827',
        textColor: '#e2e8f0',
        borderRadius: 18,
      },
      {
        ...createSection('features', 2),
        title: 'Что показывает bento-сетка',
        items: [
          'Use-case блоки по ролям: marketing / sales / ops',
          'Интеграции и автоматизации как proof-value',
          'Сильные KPI и time-to-value аргументы',
        ],
        background: '#0f172a',
        textColor: '#e2e8f0',
        borderRadius: 18,
      },
      {
        ...createSection('carousel', 2),
        title: 'AI dashboard + workflow screens',
        slideHeight: 340,
        background: '#111827',
        textColor: '#cbd5e1',
        borderRadius: 18,
      },
      {
        ...createSection('cta', 2),
        title: 'Запросить demo под ваш pipeline',
        body: 'Покажем сценарий на ваших данных и соберем конверсионную структуру лендинга под ICP.',
        buttonText: 'Запросить demo',
        background: '#0f172a',
        textColor: '#f8fafc',
        borderRadius: 18,
      },
      {
        ...createSection('form', 3),
        title: 'Получить AI landing blueprint',
        subtitle: 'Оставьте контакты и цель кампании. Вернём структуру с оффером, proof-блоками и CTA.',
        buttonText: 'Получить blueprint',
        background: '#ffffff',
        textColor: '#111827',
        borderRadius: 18,
      },
      {
        ...createSection('contacts', 3),
        title: 'Команда на связи',
        subtitle: `${phoneLabel}. Отвечаем в рабочее время без задержек.`,
        background: '#ffffff',
        textColor: '#111827',
        borderRadius: 18,
      },
    ];
  }

  if (presetKey === 'cybersec_command') {
    return [
      {
        ...createSection('hero', 1),
        title: title || 'Cybersecurity Landing With Enterprise Trust',
        subtitle: 'Security-first шаблон для SOC/MSSP и enterprise команд: threat coverage, compliance и реакция на инциденты.',
        background: 'linear-gradient(130deg, #020617 0%, #0f172a 55%, #0ea5e9 100%)',
        textColor: '#e2e8f0',
        fontFamily: '"Space Grotesk", "Sora", sans-serif',
        borderRadius: 24,
      },
      {
        ...createSection('text', 1),
        title: 'SOC2 / ISO27001 / SLA-first коммуникация',
        body: 'Фокус первого экрана: надежность, скорость реакции и прозрачный onboarding для security-команды клиента.',
        background: '#111827',
        textColor: '#dbeafe',
        borderRadius: 18,
      },
      {
        ...createSection('features', 2),
        title: 'Security coverage и бизнес-эффект',
        items: [
          '24/7 monitoring и triage алертов',
          'Incident response playbooks и escalation chain',
          'Compliance-ready отчетность для аудита',
        ],
        background: '#0f172a',
        textColor: '#dbeafe',
        borderRadius: 18,
      },
      {
        ...createSection('carousel', 2),
        title: 'Threat dashboard и incident timeline',
        slideHeight: 336,
        background: '#020617',
        textColor: '#cbd5e1',
        borderRadius: 18,
      },
      {
        ...createSection('cta', 2),
        title: 'Запросить security assessment',
        body: 'Разберем текущие риски, приоритизируем меры и предложим дорожную карту внедрения.',
        buttonText: 'Получить assessment',
        background: '#0f172a',
        textColor: '#e2e8f0',
        borderRadius: 18,
      },
      {
        ...createSection('form', 3),
        title: 'Оставить запрос на аудит',
        subtitle: 'Укажите отрасль и текущую инфраструктуру. Подготовим pre-assessment план.',
        buttonText: 'Отправить запрос',
        background: '#ffffff',
        textColor: '#111827',
        borderRadius: 18,
      },
      {
        ...createSection('contacts', 3),
        title: 'Security команда',
        subtitle: `${phoneLabel}. Отдельный канал для инцидентных запросов.`,
        background: '#ffffff',
        textColor: '#111827',
        borderRadius: 18,
      },
    ];
  }

  if (presetKey === 'ecom_storyflow') {
    return [
      {
        ...createSection('hero', 1),
        title: title || 'E-commerce Campaign Landing That Sells',
        subtitle: 'Storyflow шаблон для promo-кампаний: оффер, выгоды, соцдоказательство и заказ в одном пути.',
        background: 'linear-gradient(130deg, #fff7ed 0%, #fdba74 60%, #f97316 100%)',
        textColor: '#7c2d12',
        fontFamily: '"Manrope", "Sora", sans-serif',
        borderRadius: 22,
      },
      {
        ...createSection('text', 1),
        title: 'Offer-first подход для paid traffic',
        body: 'Первый экран показывает value + акцию + дедлайн, чтобы сократить время до действия.',
        background: '#ffedd5',
        textColor: '#7c2d12',
        borderRadius: 16,
      },
      {
        ...createSection('features', 2),
        title: 'Почему покупают',
        items: [
          'Понятная выгода и сравнение с альтернативами',
          'Отзывы и пользовательские кейсы',
          'Прозрачные условия доставки и гарантии',
        ],
        background: '#fff7ed',
        textColor: '#7c2d12',
        borderRadius: 16,
      },
      {
        ...createSection('carousel', 2),
        title: 'Карточки товара и lifestyle-контент',
        slideHeight: 330,
        background: '#ffedd5',
        textColor: '#7c2d12',
        borderRadius: 16,
      },
      {
        ...createSection('cta', 2),
        title: 'Забрать оффер сейчас',
        body: 'Добавьте контакты и получите индивидуальные условия/промокод для первого заказа.',
        buttonText: 'Получить оффер',
        background: '#f97316',
        textColor: '#fff7ed',
        borderRadius: 16,
      },
      {
        ...createSection('form', 3),
        title: 'Оформить быстрый заказ',
        subtitle: 'Минимум полей. Менеджер подтвердит детали и поможет завершить покупку.',
        buttonText: 'Оформить заказ',
        background: '#ffffff',
        textColor: '#7c2d12',
        borderRadius: 16,
      },
      {
        ...createSection('contacts', 3),
        title: 'Поддержка клиентов',
        subtitle: `${phoneLabel}. Также доступен чат-поддержка.`,
        background: '#ffffff',
        textColor: '#7c2d12',
        borderRadius: 16,
      },
    ];
  }

  if (presetKey === 'mobile_app_spotlight') {
    return [
      {
        ...createSection('hero', 1),
        title: title || 'Mobile App Landing Spotlight',
        subtitle: 'Шаблон под mobile product growth: value в первом экране, UI showcase и быстрый install/demo CTA.',
        background: 'linear-gradient(130deg, #ecfeff 0%, #bfdbfe 58%, #2563eb 100%)',
        textColor: '#0f172a',
        fontFamily: '"Plus Jakarta Sans", "Manrope", sans-serif',
        borderRadius: 22,
      },
      {
        ...createSection('text', 1),
        title: 'Designed for app acquisition',
        body: 'Подача как у современных app-templates: короткий оффер, ключевые экраны и подтверждение ценности.',
        background: '#eff6ff',
        textColor: '#1e3a8a',
        borderRadius: 16,
      },
      {
        ...createSection('features', 2),
        title: 'Что важно показать пользователю',
        items: [
          'Сценарий первого запуска за 30 секунд',
          'Главные фичи и ежедневная ценность',
          'Интеграции, безопасность и поддержка',
        ],
        background: '#dbeafe',
        textColor: '#1e3a8a',
        borderRadius: 16,
      },
      {
        ...createSection('carousel', 2),
        title: 'Скриншоты приложения',
        slideHeight: 340,
        background: '#bfdbfe',
        textColor: '#1e3a8a',
        borderRadius: 16,
      },
      {
        ...createSection('cta', 2),
        title: 'Попробуйте приложение бесплатно',
        body: 'Установите приложение или оставьте заявку на персональную demo-сессию.',
        buttonText: 'Начать бесплатно',
        background: '#2563eb',
        textColor: '#eff6ff',
        borderRadius: 16,
      },
      {
        ...createSection('form', 3),
        title: 'Запросить demo приложения',
        subtitle: 'Оставьте контакты, и мы покажем релевантный сценарий под ваш use-case.',
        buttonText: 'Запросить demo',
        background: '#ffffff',
        textColor: '#1e3a8a',
        borderRadius: 16,
      },
      {
        ...createSection('contacts', 3),
        title: 'Связаться с командой',
        subtitle: phoneLabel,
        background: '#ffffff',
        textColor: '#1e3a8a',
        borderRadius: 16,
      },
    ];
  }

  if (presetKey === 'enterprise_crm') {
    return [
      {
        ...createSection('hero', 1),
        title: title || 'Соберите продажи, сервис и омниканал в одной Enterprise CRM',
        subtitle: 'Шаблон под enterprise B2B: единый клиентский цикл, прозрачные KPI и CRM-native поток лидов.',
        background: 'linear-gradient(130deg, #eef3f8 0%, #e6edf7 56%, #dbe7f4 100%)',
        textColor: '#13243c',
        fontFamily: '"Sora", "Source Sans 3", sans-serif',
        borderRadius: 24,
      },
      {
        ...createSection('text', 1),
        title: 'Контроль клиентского цикла в одном окне',
        body: 'Типовой эффект за 90 дней: рост MQL -> SQL конверсии, снижение времени реакции на лид и стабильный SLA платформы.',
        background: '#ffffff',
        textColor: '#1f3551',
        borderRadius: 18,
      },
      {
        ...createSection('features', 2),
        title: 'Ключевые выгоды для enterprise-команд',
        items: [
          'Единая карточка клиента и сквозная история касаний',
          'Автоматизация задач, SLA и маршрутов согласования',
          'KPI-аналитика для продаж, сервиса и retention в реальном времени',
        ],
        background: '#f5f8fd',
        textColor: '#1f3551',
        borderRadius: 18,
      },
      {
        ...createSection('carousel', 2),
        title: 'Реальные экраны Enterprise CRM',
        slideHeight: 340,
        background: '#f0f5fb',
        textColor: '#1f3551',
        borderRadius: 18,
      },
      {
        ...createSection('text', 2),
        title: '4 шага до рабочего контура',
        body: 'Диагностика процесса -> дизайн воронки и ролей -> запуск интеграций -> двухнедельные ROI-итерации.',
        background: '#ffffff',
        textColor: '#1f3551',
        borderRadius: 18,
      },
      {
        ...createSection('cta', 3),
        title: 'Покажем, где Enterprise CRM даст максимальный рост',
        body: 'Оставьте запрос и получите персональный сценарий внедрения: архитектура, этапы и экономическая модель.',
        buttonText: 'Запросить демо',
        background: '#1d4f91',
        textColor: '#ecf3ff',
        borderRadius: 18,
      },
      {
        ...createSection('form', 3),
        title: 'Запросить демо Enterprise CRM',
        subtitle: 'Форма уже готова для передачи лида в CRM: контактные данные, задача, размер команды.',
        buttonText: 'Получить демо-сессию',
        fields: [
          { key: 'name', label: 'Имя и фамилия', type: 'text', required: true, crm_field: 'full_name', transform: 'split_name' },
          { key: 'work_email', label: 'Рабочий email', type: 'email', required: true, crm_field: 'email', transform: 'email_mask+dedup' },
          { key: 'phone', label: 'Телефон', type: 'tel', required: false, crm_field: 'phone', transform: 'to_e164' },
          { key: 'company', label: 'Компания', type: 'text', required: true, crm_field: 'notes', transform: 'append_company' },
          { key: 'role', label: 'Роль', type: 'text', required: false, crm_field: 'notes', transform: 'append_role' },
          { key: 'team_size', label: 'Размер команды', type: 'text', required: true, crm_field: 'business_size', transform: 'normalize_team_size' },
          { key: 'notes', label: 'Ключевая задача', type: 'textarea', required: false, crm_field: 'notes', transform: 'clean_text' },
        ],
        background: '#ffffff',
        textColor: '#13243c',
        borderRadius: 18,
      },
      {
        ...createSection('contacts', 3),
        title: 'Контакты Enterprise CRM',
        subtitle: `${phoneLabel}. Для enterprise-запросов доступна выделенная линия.`,
        background: '#ffffff',
        textColor: '#13243c',
        borderRadius: 18,
      },
    ];
  }

  if (presetKey === 'minimal_product') {
    return [
      {
        ...createSection('hero', 1),
        title: title || 'Minimal Product Page That Converts',
        subtitle: 'Никакого лишнего UI: только оффер, аргументы, доказательства и действие.',
        background: '#ffffff',
        textColor: '#0f172a',
        fontFamily: '"Manrope", "Sora", sans-serif',
        borderRadius: 18,
      },
      {
        ...createSection('text', 1),
        title: 'Скорость и ясность важнее визуального шума',
        body: 'Каждый блок отвечает на один вопрос пользователя: что это, зачем, почему доверять, что делать дальше.',
        background: '#f8fafc',
        textColor: '#0f172a',
        borderRadius: 16,
      },
      {
        ...createSection('features', 2),
        title: 'Ключевые блоки без перегруза',
        items: [
          'Минимум элементов - максимум читаемости',
          'Быстрая итерация оффера и CTA',
          'Performance-ready структура для paid traffic',
        ],
        background: '#f8fafc',
        textColor: '#0f172a',
        borderRadius: 16,
      },
      {
        ...createSection('cta', 2),
        title: 'Запустите новую версию лендинга сегодня',
        body: 'Обновите оффер, проверьте гипотезу и получите лиды без долгого цикла дизайна.',
        buttonText: 'Запустить версию',
        background: '#111827',
        textColor: '#f8fafc',
        borderRadius: 16,
      },
      {
        ...createSection('form', 3),
        title: 'Получить быстрый аудит лендинга',
        subtitle: 'Оставьте ссылку и контакты. Вернём рекомендации по конверсии в течение рабочего дня.',
        buttonText: 'Получить аудит',
        background: '#ffffff',
        textColor: '#0f172a',
        borderRadius: 16,
      },
      {
        ...createSection('contacts', 3),
        title: 'Контакты',
        subtitle: phoneLabel,
        background: '#ffffff',
        textColor: '#0f172a',
        borderRadius: 16,
      },
    ];
  }

  return [
    {
      ...createSection('hero', 1),
      title: title || 'SaaS Landing System For Pipeline Growth',
      subtitle: 'Интернет-уровень визуала + CRM-native поток лидов: hero, trust, bento-блоки и conversion-first форма.',
      background: 'linear-gradient(130deg, #030712 0%, #1d4ed8 52%, #22d3ee 100%)',
      textColor: '#f8fafc',
      fontFamily: '"Space Grotesk", "Sora", sans-serif',
      borderRadius: 24,
    },
    {
      ...createSection('text', 1),
      title: 'Используют продуктовые и revenue-команды',
      body: 'Паттерн как у лучших шаблонов из Dribbble/Webflow: быстрый оффер, trust-модуль и короткий путь к действию.',
      background: '#111827',
      textColor: '#e2e8f0',
      borderRadius: 18,
    },
    {
      ...createSection('features', 2),
      title: 'Что дает сильный шаблон',
      items: [
        'Bento-структура под value prop, integrations и кейсы',
        'Social proof и trust-сигналы в правильных местах',
        'Готовый CRM pipeline: форма -> лид -> сделка',
      ],
      background: '#111827',
      textColor: '#e2e8f0',
      borderRadius: 18,
    },
    {
      ...createSection('carousel', 2),
      title: 'Интерфейсы продукта и кейсы',
      slideHeight: 336,
      background: '#0f172a',
      textColor: '#cbd5e1',
      borderRadius: 18,
    },
    {
      ...createSection('cta', 2),
      title: 'Запустить кампанию без долгого production',
      body: 'Соберите landing flow, включите персонализацию/A-B и отправляйте трафик уже сегодня.',
      buttonText: 'Запустить кампанию',
      background: '#111827',
      textColor: '#e2e8f0',
      borderRadius: 18,
    },
    {
      ...createSection('form', 3),
      title: 'Получить demo + roadmap запуска',
      subtitle: 'Оставьте контакты и вводные. Подготовим структуру, контент и план запуска под ваш оффер.',
      buttonText: 'Получить demo',
      background: '#ffffff',
      textColor: '#111827',
      borderRadius: 18,
    },
    {
      ...createSection('contacts', 3),
      title: 'Команда на связи',
      subtitle: phoneLabel,
      background: '#ffffff',
      textColor: '#111827',
      borderRadius: 18,
    },
  ];
}

function createDefaultSchema(title = 'Новый лендинг', presetKey = 'saas_neon') {
  const preset = String(presetKey || 'saas_neon');
  const themeByPreset = {
    saas_neon: {
      primary: '#22d3ee',
      background: '#030712',
      text: '#e2e8f0',
      accent: '#2563eb',
    },
    agency_editorial: {
      primary: '#f97316',
      background: '#111827',
      text: '#f8fafc',
      accent: '#fb923c',
    },
    fintech_glass: {
      primary: '#0ea5a4',
      background: '#e0e7ff',
      text: '#0f172a',
      accent: '#3b82f6',
    },
    minimal_product: {
      primary: '#111827',
      background: '#f8fafc',
      text: '#0f172a',
      accent: '#2563eb',
    },
    ai_bento_launch: {
      primary: '#22d3ee',
      background: '#0b1025',
      text: '#e2e8f0',
      accent: '#4f46e5',
    },
    cybersec_command: {
      primary: '#38bdf8',
      background: '#020617',
      text: '#dbeafe',
      accent: '#0ea5e9',
    },
    ecom_storyflow: {
      primary: '#f97316',
      background: '#fff7ed',
      text: '#7c2d12',
      accent: '#ea580c',
    },
    mobile_app_spotlight: {
      primary: '#2563eb',
      background: '#ecfeff',
      text: '#1e3a8a',
      accent: '#3b82f6',
    },
    enterprise_crm: {
      primary: '#0e8f73',
      background: '#eef3f8',
      text: '#13243c',
      accent: '#1d4f91',
    },
  };

  const resolvedTheme = themeByPreset[preset] || DEFAULT_THEME;
  return {
    schema_version: 1,
    craft: { ROOT: { type: 'landing_builder_v2' } },
    page: {
      meta: {
        title,
        description: 'Высококонверсионный лендинг для маркетинговой кампании',
        seo: {
          title,
          description: 'Высококонверсионный лендинг для маркетинговой кампании',
          og_title: title,
          og_description: 'Высококонверсионный лендинг для маркетинговой кампании',
          noindex: false,
        },
        ab_test: createDefaultAbTest(),
      },
      theme: { ...resolvedTheme },
      sections: buildPresetSections(preset, title),
    },
  };
}

function normalizeSection(section, index = 0) {
  const type = ALLOWED_SECTION_TYPES.has(section?.type) ? section.type : 'text';
  const base = createSection(type, Math.floor(index / 3) + 1);
  const next = {
    ...base,
    ...(section || {}),
    id: String(section?.id || base.id),
    type,
  };

  const row = Number(next.row_index || next.row || Math.floor(index / 3) + 1);
  next.row_index = Number.isFinite(row) && row > 0 ? row : Math.floor(index / 3) + 1;

  if (type === 'form') {
    const fields = Array.isArray(next.fields) ? next.fields : [];
    next.fields = fields.length
      ? fields.map((field, fieldIndex) => ({
          ...createDefaultField(fieldIndex + 1),
          ...(field || {}),
          key: String(field?.key || `field_${fieldIndex + 1}`),
          label: String(field?.label || `Поле ${fieldIndex + 1}`),
        }))
      : [createDefaultField(1)];
    next.blockId = String(next.blockId || next.block_id || next.id || uid('form'));
    next.formKey = String(next.formKey || next.form_key || 'lead_main');
  }

  if (type === 'features') {
    const items = Array.isArray(next.items) ? next.items.filter(Boolean) : [];
    next.items = items.length ? items : ['Преимущество 1', 'Преимущество 2'];
  }

  if (type === 'carousel') {
    next.images = Array.isArray(next.images) ? next.images.filter(Boolean) : [];
    next.slideHeight = Number(next.slideHeight || 320);
  }

  if (type === 'custom_html') {
    next.custom_html = String(next.custom_html || next.html || '');
    next.custom_css = String(next.custom_css || next.css || '');
    next.custom_js = String(next.custom_js || next.js || '');
    next.iframeHeight = Number(next.iframeHeight || next.iframe_height || 280);
  }

  if (!Array.isArray(next.personalization_rules)) {
    next.personalization_rules = [];
  }

  return next;
}

function ensureSchema(rawSchema, fallbackTitle = 'Новый лендинг') {
  const fallback = createDefaultSchema(fallbackTitle);
  if (!rawSchema || typeof rawSchema !== 'object') return fallback;

  const page = rawSchema.page && typeof rawSchema.page === 'object' ? rawSchema.page : {};
  const meta = page.meta && typeof page.meta === 'object' ? page.meta : {};
  const seo = meta.seo && typeof meta.seo === 'object' ? meta.seo : {};
  const theme = page.theme && typeof page.theme === 'object' ? page.theme : {};
  const sections = Array.isArray(page.sections) ? page.sections : [];

  return {
    schema_version: Number(rawSchema.schema_version || fallback.schema_version || 1),
    craft: rawSchema.craft && typeof rawSchema.craft === 'object' ? rawSchema.craft : fallback.craft,
    page: {
      meta: {
        title: String(meta.title || fallback.page.meta.title),
        description: String(meta.description || fallback.page.meta.description),
        seo: {
          title: String(seo.title || meta.title || fallback.page.meta.seo.title),
          description: String(seo.description || meta.description || fallback.page.meta.seo.description),
          og_title: String(seo.og_title || seo.title || meta.title || fallback.page.meta.seo.og_title),
          og_description: String(seo.og_description || seo.description || meta.description || fallback.page.meta.seo.og_description),
          noindex: Boolean(seo.noindex),
        },
        ab_test: normalizeAbTest(meta.ab_test),
      },
      theme: {
        primary: String(theme.primary || DEFAULT_THEME.primary),
        background: String(theme.background || DEFAULT_THEME.background),
        text: String(theme.text || DEFAULT_THEME.text),
        accent: String(theme.accent || DEFAULT_THEME.accent),
      },
      sections: sections.map((section, index) => normalizeSection(section, index)),
    },
  };
}

function normalizeAbTest(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const variants = Array.isArray(source.variants)
    ? source.variants
        .map((item, index) => ({
          key: String(item?.key || item?.id || `variant_${index + 1}`),
          weight: Number(item?.weight || 1),
          schema_patch: item?.schema_patch && typeof item.schema_patch === 'object' ? item.schema_patch : {},
          title_override: String(item?.title_override || item?.schema_patch?.page?.meta?.title || ''),
          description_override: String(item?.description_override || item?.schema_patch?.page?.meta?.description || ''),
          primary_override: String(item?.primary_override || item?.schema_patch?.page?.theme?.primary || ''),
          accent_override: String(item?.accent_override || item?.schema_patch?.page?.theme?.accent || ''),
        }))
        .filter((item) => item.key)
    : [];

  if (!variants.length) {
    return {
      control_variant: 'control',
      variants: [
        {
          key: 'control',
          weight: 50,
          schema_patch: { page: { meta: { ab_variant: 'control' } } },
          title_override: '',
          description_override: '',
          primary_override: '',
          accent_override: '',
        },
        {
          key: 'variant_b',
          weight: 50,
          schema_patch: { page: { meta: { ab_variant: 'variant_b' } } },
          title_override: '',
          description_override: '',
          primary_override: '',
          accent_override: '',
        },
      ],
    };
  }

  const control = String(source.control_variant || variants[0].key);
  return {
    control_variant: control,
    variants,
  };
}

function buildAbPatchFromVariant(variant) {
  const patch = {
    page: {
      meta: { ab_variant: variant.key },
    },
  };
  if (variant.title_override || variant.description_override) {
    patch.page.meta = {
      ...patch.page.meta,
      ...(variant.title_override ? { title: variant.title_override } : {}),
      ...(variant.description_override ? { description: variant.description_override } : {}),
    };
  }
  if (variant.primary_override || variant.accent_override) {
    patch.page.theme = {
      ...(variant.primary_override ? { primary: variant.primary_override } : {}),
      ...(variant.accent_override ? { accent: variant.accent_override } : {}),
    };
  }
  return patch;
}

function buildSchemaForSave(schema) {
  const next = deepClone(schema || createDefaultSchema());
  const abSource = normalizeAbTest(next?.page?.meta?.ab_test);
  next.page.meta.ab_test = {
    control_variant: abSource.control_variant,
    variants: abSource.variants
      .filter((variant) => variant.key)
      .map((variant) => ({
        key: variant.key,
        weight: Number(variant.weight || 1),
        schema_patch: buildAbPatchFromVariant(variant),
      })),
  };
  return next;
}

function validateSchemaClient(schema) {
  const errors = [];
  if (!schema || typeof schema !== 'object') {
    return ['Schema must be an object'];
  }
  if (!schema.page || typeof schema.page !== 'object') {
    return ['Schema.page is required'];
  }
  const sections = Array.isArray(schema.page.sections) ? schema.page.sections : [];
  if (!sections.length) {
    errors.push('Добавьте минимум 1 секцию');
    return errors;
  }

  const rows = new Map();
  const bindingSet = new Set();

  sections.forEach((section, index) => {
    const rowIndex = Number(section.row_index || section.row || 0);
    if (!rowIndex || rowIndex < 1) {
      errors.push(`Секция #${index + 1}: row_index должен быть >= 1`);
      return;
    }

    const count = (rows.get(rowIndex) || 0) + 1;
    rows.set(rowIndex, count);
    if (count > 3) {
      errors.push(`Секция #${index + 1}: в строке ${rowIndex} больше 3 блоков`);
    }

    if (!ALLOWED_SECTION_TYPES.has(section.type)) {
      errors.push(`Секция #${index + 1}: неподдерживаемый тип ${section.type}`);
    }

    if (section.type === 'form') {
      const blockId = String(section.blockId || section.block_id || '').trim();
      const formKey = String(section.formKey || section.form_key || '').trim();
      if (!blockId || !formKey) {
        errors.push(`Секция #${index + 1}: для формы обязательны blockId и formKey`);
      } else {
        const key = `${blockId}::${formKey}`;
        if (bindingSet.has(key)) {
          errors.push(`Секция #${index + 1}: дублирующийся form binding ${key}`);
        }
        bindingSet.add(key);
      }

      const fields = Array.isArray(section.fields) ? section.fields : [];
      if (!fields.length) {
        errors.push(`Секция #${index + 1}: добавьте минимум одно поле формы`);
      }

      const fieldKeys = new Set();
      fields.forEach((field, fidx) => {
        const key = String(field?.key || '').trim();
        if (!key) {
          errors.push(`Секция #${index + 1}, поле #${fidx + 1}: key обязателен`);
          return;
        }
        if (fieldKeys.has(key)) {
          errors.push(`Секция #${index + 1}, поле #${fidx + 1}: duplicate key ${key}`);
        }
        fieldKeys.add(key);
      });
    }

    if (section.type === 'custom_html') {
      const html = String(section.custom_html || '');
      if (html.length > 50000) {
        errors.push(`Секция #${index + 1}: custom_html > 50000 символов`);
      }
      if (/src=["']http:\/\//i.test(html)) {
        errors.push(`Секция #${index + 1}: внешний script должен быть только HTTPS`);
      }
      if (/javascript\s*:/i.test(html)) {
        errors.push(`Секция #${index + 1}: запрещен javascript: URL`);
      }
    }
  });

  const ab = normalizeAbTest(schema?.page?.meta?.ab_test);
  if (ab.variants.length < 2) {
    errors.push('A/B тест: необходимо минимум 2 варианта (control + variant)');
  }
  const abKeys = new Set();
  ab.variants.forEach((variant) => {
    if (!variant.key) errors.push('A/B тест: variant key обязателен');
    if (abKeys.has(variant.key)) errors.push(`A/B тест: duplicate key ${variant.key}`);
    abKeys.add(variant.key);
    if (!Number(variant.weight) || Number(variant.weight) <= 0) {
      errors.push(`A/B тест: weight варианта ${variant.key} должен быть > 0`);
    }
  });

  return errors;
}

function sectionSummary(section) {
  const typeLabel = SECTION_TYPE_OPTIONS.find((item) => item.value === section.type)?.label || section.type;
  const title = String(section.title || section.subtitle || section.blockId || section.id || 'Без названия');
  return `${typeLabel}: ${title}`;
}

function keyForBinding(section) {
  if (!section || section.type !== 'form') return '';
  const blockId = String(section.blockId || section.block_id || '').trim();
  const formKey = String(section.formKey || section.form_key || '').trim();
  if (!blockId || !formKey) return '';
  return `${blockId}::${formKey}`;
}

function createDefaultBinding({ leadSource = null, stage = null } = {}) {
  return {
    lead_source: leadSource,
    stage_on_deal_create: stage,
    create_deal: true,
    owner_strategy: 'inherit',
    fixed_owner: null,
    assignment_queue: null,
    sla_minutes: 15,
    dedup_window_minutes: 120,
    active: true,
  };
}

function mapBindingsFromApi(items = []) {
  const map = {};
  (Array.isArray(items) ? items : []).forEach((item) => {
    const blockId = String(item?.block_id || '').trim();
    const formKey = String(item?.form_key || '').trim();
    if (!blockId || !formKey) return;
    map[`${blockId}::${formKey}`] = {
      lead_source: item?.lead_source || null,
      stage_on_deal_create: item?.stage_on_deal_create || null,
      create_deal: item?.create_deal !== false,
      owner_strategy: String(item?.owner_strategy || 'inherit'),
      fixed_owner: item?.fixed_owner || null,
      assignment_queue: item?.assignment_queue || null,
      sla_minutes: Number(item?.sla_minutes || 15),
      dedup_window_minutes: Number(item?.dedup_window_minutes || 120),
      active: item?.active !== false,
    };
  });
  return map;
}

function bindingsToPayload(bindingsMap) {
  return Object.entries(bindingsMap || {}).map(([key, value]) => {
    const [block_id, form_key] = key.split('::');
    return {
      block_id,
      form_key,
      lead_source: value?.lead_source || null,
      stage_on_deal_create: value?.stage_on_deal_create || null,
      create_deal: value?.create_deal !== false,
      owner_strategy: value?.owner_strategy || 'inherit',
      fixed_owner: value?.owner_strategy === 'fixed_user' ? value?.fixed_owner || null : null,
      assignment_queue: value?.assignment_queue || null,
      sla_minutes: Number(value?.sla_minutes || 15),
      dedup_window_minutes: Number(value?.dedup_window_minutes || 120),
      active: value?.active !== false,
    };
  });
}

function buildBindingsFromSchema(schema, { leadSource = null, defaultStage = null } = {}) {
  const sections = Array.isArray(schema?.page?.sections) ? schema.page.sections : [];
  return sections
    .filter((section) => section?.type === 'form')
    .map((section) => ({
      block_id: String(section.blockId || section.block_id || section.id || '').trim(),
      form_key: String(section.formKey || section.form_key || 'lead_main').trim(),
      lead_source: leadSource,
      stage_on_deal_create: defaultStage,
      create_deal: true,
      owner_strategy: 'inherit',
      fixed_owner: null,
      assignment_queue: null,
      sla_minutes: 15,
      dedup_window_minutes: 120,
      active: true,
    }))
    .filter((item) => item.block_id && item.form_key);
}

function normalizeTemplateBindings(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      block_id: String(item?.block_id || item?.blockId || '').trim(),
      form_key: String(item?.form_key || item?.formKey || '').trim(),
      lead_source: item?.lead_source || null,
      stage_on_deal_create: item?.stage_on_deal_create || null,
      create_deal: item?.create_deal !== false,
      owner_strategy: String(item?.owner_strategy || 'inherit'),
      fixed_owner: item?.fixed_owner || null,
      assignment_queue: item?.assignment_queue || null,
      sla_minutes: Number(item?.sla_minutes || 15),
      dedup_window_minutes: Number(item?.dedup_window_minutes || 120),
      active: item?.active !== false,
    }))
    .filter((item) => item.block_id && item.form_key);
}

function normalizeStoredTemplate(template, index = 0) {
  if (!template || typeof template !== 'object') return null;
  const name = String(template.name || template.title || `Custom Template ${index + 1}`).trim();
  const keyBase = String(template.key || uid('template')).trim();
  const key = keyBase.startsWith('custom-') ? keyBase : `custom-${keyBase}`;
  const schema = ensureSchema(template.schema || template.draft_schema || createDefaultSchema(name), name);
  const pageTheme = schema?.page?.theme || {};
  const palette = Array.isArray(template.palette) && template.palette.length
    ? template.palette.map((item) => String(item)).filter(Boolean).slice(0, 3)
    : [pageTheme.background || '#f8fafc', pageTheme.primary || '#2563eb', pageTheme.accent || '#22d3ee'];
  const styleTags = Array.isArray(template.styleTags) && template.styleTags.length
    ? template.styleTags.map((item) => String(item)).filter(Boolean).slice(0, 6)
    : ['Custom'];
  const highlights = Array.isArray(template.highlights) && template.highlights.length
    ? template.highlights.map((item) => String(item)).filter(Boolean).slice(0, 4)
    : ['Сохраненный пользовательский шаблон'];

  return {
    key,
    source: 'custom',
    name,
    category: String(template.category || 'Custom'),
    styleTags,
    description: String(template.description || 'Пользовательский шаблон лендинга'),
    highlights,
    palette,
    created_at: String(template.created_at || ''),
    schema,
    bindings: normalizeTemplateBindings(template.bindings || []),
  };
}

function serializeTemplateForStorage(template) {
  return {
    key: template.key,
    name: template.name,
    category: template.category,
    styleTags: template.styleTags,
    description: template.description,
    highlights: template.highlights,
    palette: template.palette,
    created_at: template.created_at,
    schema: template.schema,
    bindings: normalizeTemplateBindings(template.bindings || []),
  };
}

function buildTemplatePreviewDataUri(template) {
  const schema = template?.schema && typeof template.schema === 'object'
    ? template.schema
    : createDefaultSchema(template?.name || 'Template', template?.key || LANDING_PRESET_OPTIONS[0].value);
  const theme = schema?.page?.theme || DEFAULT_THEME;
  const palette = Array.isArray(template?.palette) && template.palette.length
    ? template.palette
    : [theme.background || '#0f172a', theme.primary || '#2563eb', theme.accent || '#22d3ee'];
  const bg0 = palette[0] || '#0f172a';
  const bg1 = palette[1] || '#2563eb';
  const accent = palette[2] || '#22d3ee';
  const title = shortenText(template?.name || schema?.page?.meta?.title || 'Template', 28);
  const category = shortenText(template?.category || 'Template', 18);
  const sectionLines = (Array.isArray(schema?.page?.sections) ? schema.page.sections : [])
    .slice(0, 3)
    .map((section) => shortenText(section?.title || section?.subtitle || section?.type || 'Section', 32))
    .filter(Boolean);
  const lineA = sectionLines[0] || 'Hero block';
  const lineB = sectionLines[1] || 'Benefits block';
  const lineC = sectionLines[2] || 'Lead form block';

  const svg = `
<svg width="640" height="360" viewBox="0 0 640 360" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="640" y2="360">
      <stop offset="0%" stop-color="${escapeSvgText(bg0)}"/>
      <stop offset="62%" stop-color="${escapeSvgText(bg1)}"/>
      <stop offset="100%" stop-color="${escapeSvgText(accent)}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.72)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.16)"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="640" height="360" fill="url(#bg)"/>
  <rect x="28" y="24" width="584" height="52" rx="14" fill="url(#glass)" stroke="rgba(255,255,255,0.35)"/>
  <text x="48" y="50" fill="#ffffff" font-size="22" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeSvgText(title)}</text>
  <text x="48" y="70" fill="rgba(255,255,255,0.88)" font-size="13" font-family="Inter, Arial, sans-serif">${escapeSvgText(category)}</text>
  <rect x="28" y="92" width="372" height="208" rx="16" fill="rgba(10,20,40,0.24)" stroke="rgba(255,255,255,0.28)"/>
  <rect x="416" y="92" width="196" height="208" rx="16" fill="rgba(255,255,255,0.86)" stroke="rgba(255,255,255,0.52)"/>
  <rect x="48" y="116" width="332" height="32" rx="10" fill="rgba(255,255,255,0.82)"/>
  <rect x="48" y="160" width="272" height="16" rx="8" fill="rgba(255,255,255,0.42)"/>
  <rect x="48" y="184" width="296" height="16" rx="8" fill="rgba(255,255,255,0.34)"/>
  <rect x="48" y="216" width="140" height="36" rx="10" fill="${escapeSvgText(accent)}"/>
  <text x="56" y="136" fill="#0f172a" font-size="13" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeSvgText(lineA)}</text>
  <text x="56" y="172" fill="#e2e8f0" font-size="12" font-family="Inter, Arial, sans-serif">${escapeSvgText(lineB)}</text>
  <text x="56" y="196" fill="#e2e8f0" font-size="12" font-family="Inter, Arial, sans-serif">${escapeSvgText(lineC)}</text>
  <text x="436" y="124" fill="#0f172a" font-size="12" font-family="Inter, Arial, sans-serif" font-weight="600">Lead Form</text>
  <rect x="436" y="138" width="156" height="28" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
  <rect x="436" y="174" width="156" height="28" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
  <rect x="436" y="210" width="156" height="28" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
  <rect x="436" y="248" width="156" height="32" rx="10" fill="#0f172a"/>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

function extractErrorMessage(error, fallback = 'Операция не выполнена') {
  if (!error) return fallback;
  const details = error.details;
  if (typeof details === 'string') return details;
  if (details && typeof details.detail === 'string') return details.detail;
  if (details && typeof details === 'object') {
    const first = Object.values(details)[0];
    if (Array.isArray(first)) return String(first[0] || fallback);
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const nested = Object.values(first)[0];
      if (Array.isArray(nested)) return String(nested[0] || fallback);
      if (typeof nested === 'string') return nested;
    }
  }
  return error.message || fallback;
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = dayjs(value);
  if (!d.isValid()) return String(value);
  return d.format('YYYY-MM-DD HH:mm');
}

function SortableSectionCard({
  section,
  selected,
  rowCount,
  onSelect,
  onDelete,
  onDuplicate,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: selected ? '1px solid #1677ff' : '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 10,
    background: '#fff',
    boxShadow: isDragging ? '0 6px 18px rgba(0,0,0,0.12)' : 'none',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
        <Space align="start">
          <Tooltip title="Перетащить">
            <Button type="text" icon={<DragOutlined />} {...attributes} {...listeners} />
          </Tooltip>
          <div>
            <Text strong>{sectionSummary(section)}</Text>
            <div>
              <Tag color={rowCount > 3 ? 'red' : 'blue'}>row {section.row_index}</Tag>
              <Tag>{section.type}</Tag>
            </div>
          </div>
        </Space>
        <Space>
          <Button size="small" onClick={onSelect}>Редактировать</Button>
          <Button size="small" onClick={onDuplicate}>Копия</Button>
          <Popconfirm title="Удалить секцию?" onConfirm={onDelete}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </Space>
    </div>
  );
}

function PersonalizationRuleEditor({ section, onChange }) {
  const rules = Array.isArray(section?.personalization_rules) ? section.personalization_rules : [];

  const updateRules = (nextRules) => {
    onChange({ personalization_rules: nextRules });
  };

  const addRule = () => {
    updateRules([
      ...rules,
      {
        source: 'utm',
        key: 'campaign',
        equals: '',
        contains: '',
        overrides: {
          title: '',
          subtitle: '',
          body: '',
          buttonText: '',
        },
      },
    ]);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong>Правила персонализации (UTM/Cookie)</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={addRule}>Добавить правило</Button>
      </Space>
      {!rules.length && <Text type="secondary">Правила не заданы. Контент будет статическим.</Text>}
      {rules.map((rule, idx) => {
        const source = String(rule?.source || 'utm');
        const keyOptions = PERSONALIZATION_KEY_OPTIONS[source] || PERSONALIZATION_KEY_OPTIONS.utm;
        const overrides = rule?.overrides && typeof rule.overrides === 'object' ? rule.overrides : {};
        return (
          <Card key={`${section.id}-rule-${idx}`} size="small" title={`Rule #${idx + 1}`}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Row gutter={8}>
                <Col xs={24} md={8}>
                  <Select
                    style={{ width: '100%' }}
                    value={source}
                    options={PERSONALIZATION_SOURCE_OPTIONS}
                    onChange={(value) => {
                      const next = [...rules];
                      next[idx] = { ...rule, source: value, key: value === 'utm' ? 'campaign' : 'segment' };
                      updateRules(next);
                    }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Select
                    style={{ width: '100%' }}
                    value={rule?.key || keyOptions[0]?.value}
                    options={keyOptions}
                    onChange={(value) => {
                      const next = [...rules];
                      next[idx] = { ...rule, key: value };
                      updateRules(next);
                    }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Button danger block onClick={() => updateRules(rules.filter((_, ridx) => ridx !== idx))}>Удалить</Button>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col xs={24} md={12}>
                  <Input
                    placeholder="equals"
                    value={rule?.equals || ''}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = { ...rule, equals: e.target.value };
                      updateRules(next);
                    }}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Input
                    placeholder="contains"
                    value={rule?.contains || ''}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = { ...rule, contains: e.target.value };
                      updateRules(next);
                    }}
                  />
                </Col>
              </Row>

              <Row gutter={8}>
                <Col xs={24} md={12}>
                  <Input
                    placeholder="override title"
                    value={overrides.title || ''}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = {
                        ...rule,
                        overrides: { ...overrides, title: e.target.value },
                      };
                      updateRules(next);
                    }}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Input
                    placeholder="override subtitle"
                    value={overrides.subtitle || ''}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = {
                        ...rule,
                        overrides: { ...overrides, subtitle: e.target.value },
                      };
                      updateRules(next);
                    }}
                  />
                </Col>
              </Row>

              <Row gutter={8}>
                <Col xs={24} md={12}>
                  <Input
                    placeholder="override body"
                    value={overrides.body || ''}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = {
                        ...rule,
                        overrides: { ...overrides, body: e.target.value },
                      };
                      updateRules(next);
                    }}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Input
                    placeholder="override buttonText"
                    value={overrides.buttonText || ''}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = {
                        ...rule,
                        overrides: { ...overrides, buttonText: e.target.value },
                      };
                      updateRules(next);
                    }}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        );
      })}
    </Space>
  );
}

function AbTestEditor({ abTest, onChange }) {
  const normalized = normalizeAbTest(abTest);
  const variants = normalized.variants;

  const update = (next) => {
    onChange(normalizeAbTest(next));
  };

  const addVariant = () => {
    const key = `variant_${variants.length + 1}`;
    update({
      ...normalized,
      variants: [
        ...variants,
        {
          key,
          weight: 10,
          schema_patch: { page: { meta: { ab_variant: key } } },
          title_override: '',
          description_override: '',
          primary_override: '',
          accent_override: '',
        },
      ],
    });
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="A/B тестирование"
        description="Трафик распределяется случайно по весам. Статзначимость считается в отчетах по двум пропорциям."
      />

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Text strong>Control variant</Text>
          <Select
            style={{ width: 220 }}
            value={normalized.control_variant}
            options={variants.map((item) => ({ value: item.key, label: item.key }))}
            onChange={(value) => update({ ...normalized, control_variant: value })}
          />
        </Space>
        <Button icon={<PlusOutlined />} onClick={addVariant}>Добавить вариант</Button>
      </Space>

      {variants.map((variant, idx) => (
        <Card key={variant.key || idx} size="small" title={`Variant: ${variant.key}`}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Row gutter={8}>
              <Col xs={24} md={8}>
                <Input
                  addonBefore="key"
                  value={variant.key}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...variant, key: e.target.value.trim().toLowerCase().replace(/\s+/g, '_') };
                    update({ ...normalized, variants: next });
                  }}
                />
              </Col>
              <Col xs={24} md={8}>
                <InputNumber
                  addonBefore="weight"
                  min={1}
                  style={{ width: '100%' }}
                  value={Number(variant.weight || 1)}
                  onChange={(value) => {
                    const next = [...variants];
                    next[idx] = { ...variant, weight: Number(value || 1) };
                    update({ ...normalized, variants: next });
                  }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Button
                  danger
                  block
                  disabled={variants.length <= 2}
                  onClick={() => update({ ...normalized, variants: variants.filter((_, vidx) => vidx !== idx) })}
                >
                  Удалить
                </Button>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col xs={24} md={12}>
                <Input
                  placeholder="override: page.meta.title"
                  value={variant.title_override || ''}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...variant, title_override: e.target.value };
                    update({ ...normalized, variants: next });
                  }}
                />
              </Col>
              <Col xs={24} md={12}>
                <Input
                  placeholder="override: page.meta.description"
                  value={variant.description_override || ''}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...variant, description_override: e.target.value };
                    update({ ...normalized, variants: next });
                  }}
                />
              </Col>
            </Row>

            <Row gutter={8}>
              <Col xs={24} md={12}>
                <Input
                  placeholder="override: theme.primary"
                  value={variant.primary_override || ''}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...variant, primary_override: e.target.value };
                    update({ ...normalized, variants: next });
                  }}
                />
              </Col>
              <Col xs={24} md={12}>
                <Input
                  placeholder="override: theme.accent"
                  value={variant.accent_override || ''}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...variant, accent_override: e.target.value };
                    update({ ...normalized, variants: next });
                  }}
                />
              </Col>
            </Row>
          </Space>
        </Card>
      ))}
    </Space>
  );
}

function SectionEditor({
  section,
  selectedLandingId,
  canManage,
  onChange,
  onUploadImage,
}) {
  if (!section) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Выберите секцию слева или создайте новую"
      />
    );
  }

  const update = (patch) => onChange({ ...section, ...patch });

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card size="small" title="Базовые параметры секции">
        <Row gutter={8}>
          <Col xs={24} md={8}>
            <Input addonBefore="id" value={section.id} disabled />
          </Col>
          <Col xs={24} md={8}>
            <Select
              style={{ width: '100%' }}
              value={section.type}
              options={SECTION_TYPE_OPTIONS}
              disabled
            />
          </Col>
          <Col xs={24} md={8}>
            <InputNumber
              addonBefore="row"
              min={1}
              style={{ width: '100%' }}
              value={Number(section.row_index || 1)}
              onChange={(value) => update({ row_index: Number(value || 1) })}
            />
          </Col>
        </Row>

        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col xs={24} md={12}>
            <Input
              addonBefore="title"
              value={section.title || ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Col>
          <Col xs={24} md={12}>
            <Input
              addonBefore="subtitle"
              value={section.subtitle || ''}
              onChange={(e) => update({ subtitle: e.target.value })}
            />
          </Col>
        </Row>

        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col xs={24} md={12}>
            <Input
              addonBefore="background"
              value={section.background || ''}
              onChange={(e) => update({ background: e.target.value })}
              placeholder="#ffffff"
            />
          </Col>
          <Col xs={24} md={12}>
            <Input
              addonBefore="textColor"
              value={section.textColor || ''}
              onChange={(e) => update({ textColor: e.target.value })}
              placeholder="#111827"
            />
          </Col>
        </Row>

        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col xs={24}>
            <Input.TextArea
              rows={3}
              placeholder="body"
              value={section.body || ''}
              onChange={(e) => update({ body: e.target.value })}
            />
          </Col>
        </Row>

        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col xs={24} md={12}>
            <Input
              addonBefore="button"
              value={section.buttonText || ''}
              onChange={(e) => update({ buttonText: e.target.value })}
            />
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ width: '100%' }}>
              <Input
                style={{ flex: 1 }}
                addonBefore="image"
                value={section.imageUrl || ''}
                onChange={(e) => update({ imageUrl: e.target.value })}
              />
              <Upload
                showUploadList={false}
                disabled={!selectedLandingId || !canManage}
                customRequest={(options) => onUploadImage(options, section)}
              >
                <Button icon={<UploadOutlined />} />
              </Upload>
            </Space>
          </Col>
        </Row>
      </Card>

      {section.type === 'features' && (
        <Card size="small" title="Элементы features">
          <Input.TextArea
            rows={6}
            value={Array.isArray(section.items) ? section.items.join('\n') : ''}
            onChange={(e) => {
              const items = e.target.value
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean);
              update({ items });
            }}
            placeholder="Каждая строка = отдельное преимущество"
          />
        </Card>
      )}

      {section.type === 'carousel' && (
        <Card size="small" title="Карусель">
          <Space direction="vertical" style={{ width: '100%' }}>
            <InputNumber
              addonBefore="slideHeight"
              min={160}
              max={1200}
              style={{ width: '100%' }}
              value={Number(section.slideHeight || 320)}
              onChange={(value) => update({ slideHeight: Number(value || 320) })}
            />
            <Input.TextArea
              rows={6}
              value={Array.isArray(section.images) ? section.images.join('\n') : ''}
              onChange={(e) => {
                const images = e.target.value
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean);
                update({ images });
              }}
              placeholder="Одна ссылка на изображение в строке"
            />
          </Space>
        </Card>
      )}

      {section.type === 'contacts' && (
        <Card size="small" title="Контактные поля">
          <Row gutter={8}>
            <Col xs={24} md={12}><Input addonBefore="phone" value={section.phone || ''} onChange={(e) => update({ phone: e.target.value })} /></Col>
            <Col xs={24} md={12}><Input addonBefore="email" value={section.email || ''} onChange={(e) => update({ email: e.target.value })} /></Col>
            <Col xs={24} md={24}><Input addonBefore="address" value={section.address || ''} onChange={(e) => update({ address: e.target.value })} /></Col>
            <Col xs={24} md={12}><Input addonBefore="whatsapp" value={section.whatsapp || ''} onChange={(e) => update({ whatsapp: e.target.value })} /></Col>
            <Col xs={24} md={12}><Input addonBefore="telegram" value={section.telegram || ''} onChange={(e) => update({ telegram: e.target.value })} /></Col>
            <Col xs={24} md={12}><Input addonBefore="instagram" value={section.instagram || ''} onChange={(e) => update({ instagram: e.target.value })} /></Col>
            <Col xs={24} md={12}><Input addonBefore="facebook" value={section.facebook || ''} onChange={(e) => update({ facebook: e.target.value })} /></Col>
            <Col xs={24} md={12}><Input addonBefore="linkedin" value={section.linkedin || ''} onChange={(e) => update({ linkedin: e.target.value })} /></Col>
          </Row>
        </Card>
      )}

      {section.type === 'form' && (
        <Card size="small" title="Поля формы">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={8}>
              <Col xs={24} md={12}><Input addonBefore="blockId" value={section.blockId || ''} onChange={(e) => update({ blockId: e.target.value })} /></Col>
              <Col xs={24} md={12}><Input addonBefore="formKey" value={section.formKey || ''} onChange={(e) => update({ formKey: e.target.value })} /></Col>
            </Row>

            <Table
              rowKey={(record) => `${record.key}`}
              size="small"
              pagination={false}
              dataSource={Array.isArray(section.fields) ? section.fields : []}
              columns={[
                {
                  title: 'Key',
                  dataIndex: 'key',
                  width: 140,
                  render: (value, record, rowIndex) => (
                    <Input
                      value={value}
                      onChange={(e) => {
                        const next = [...section.fields];
                        next[rowIndex] = { ...record, key: e.target.value };
                        update({ fields: next });
                      }}
                    />
                  ),
                },
                {
                  title: 'Label',
                  dataIndex: 'label',
                  width: 180,
                  render: (value, record, rowIndex) => (
                    <Input
                      value={value}
                      onChange={(e) => {
                        const next = [...section.fields];
                        next[rowIndex] = { ...record, label: e.target.value };
                        update({ fields: next });
                      }}
                    />
                  ),
                },
                {
                  title: 'Type',
                  dataIndex: 'type',
                  width: 140,
                  render: (value, record, rowIndex) => (
                    <Select
                      value={value}
                      style={{ width: '100%' }}
                      options={FORM_FIELD_TYPE_OPTIONS}
                      onChange={(type) => {
                        const next = [...section.fields];
                        next[rowIndex] = { ...record, type };
                        update({ fields: next });
                      }}
                    />
                  ),
                },
                {
                  title: 'Required',
                  dataIndex: 'required',
                  width: 100,
                  render: (value, record, rowIndex) => (
                    <Switch
                      checked={Boolean(value)}
                      onChange={(checked) => {
                        const next = [...section.fields];
                        next[rowIndex] = { ...record, required: checked };
                        update({ fields: next });
                      }}
                    />
                  ),
                },
                {
                  title: 'CRM field',
                  dataIndex: 'crm_field',
                  width: 220,
                  render: (value, record, rowIndex) => (
                    <Select
                      value={value}
                      style={{ width: '100%' }}
                      options={CRM_FIELD_OPTIONS}
                      onChange={(crm_field) => {
                        const next = [...section.fields];
                        next[rowIndex] = { ...record, crm_field };
                        update({ fields: next });
                      }}
                    />
                  ),
                },
                {
                  title: 'Transform',
                  dataIndex: 'transform',
                  render: (value, record, rowIndex) => (
                    <Input
                      value={value || ''}
                      placeholder="split_name / to_e164 / email_mask+dedup"
                      onChange={(e) => {
                        const next = [...section.fields];
                        next[rowIndex] = { ...record, transform: e.target.value };
                        update({ fields: next });
                      }}
                    />
                  ),
                },
                {
                  title: '',
                  dataIndex: 'actions',
                  width: 56,
                  render: (_, __, rowIndex) => (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        const next = section.fields.filter((_, idx) => idx !== rowIndex);
                        update({ fields: next.length ? next : [createDefaultField(1)] });
                      }}
                    />
                  ),
                },
              ]}
            />

            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                const current = Array.isArray(section.fields) ? section.fields : [];
                update({ fields: [...current, createDefaultField(current.length + 1)] });
              }}
            >
              Добавить поле
            </Button>
          </Space>
        </Card>
      )}

      {section.type === 'custom_html' && (
        <Card size="small" title="Custom HTML / CSS / JS (Sandbox)">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message="Кастомный код запускается только в изолированном iframe sandbox"
              description="DOM CRM недоступен. Используйте только безопасные скрипты по HTTPS."
            />
            <Input.TextArea
              rows={6}
              value={section.custom_html || ''}
              onChange={(e) => update({ custom_html: e.target.value })}
              placeholder="HTML"
            />
            <Input.TextArea
              rows={4}
              value={section.custom_css || ''}
              onChange={(e) => update({ custom_css: e.target.value })}
              placeholder="CSS"
            />
            <Input.TextArea
              rows={4}
              value={section.custom_js || ''}
              onChange={(e) => update({ custom_js: e.target.value })}
              placeholder="JavaScript"
            />
            <InputNumber
              addonBefore="iframe height"
              min={160}
              max={1200}
              style={{ width: '100%' }}
              value={Number(section.iframeHeight || 280)}
              onChange={(value) => update({ iframeHeight: Number(value || 280) })}
            />

            <iframe
              title={`${section.id}-sandbox-preview`}
              sandbox="allow-forms allow-scripts allow-popups"
              referrerPolicy="no-referrer"
              srcDoc={buildSandboxSrcDoc(section)}
              style={{
                width: '100%',
                minHeight: Number(section.iframeHeight || 280),
                border: '1px solid #d1d5db',
                borderRadius: 8,
                background: '#fff',
              }}
            />
          </Space>
        </Card>
      )}

      <Card size="small" title="Персонализация">
        <PersonalizationRuleEditor
          section={section}
          onChange={(patch) => update(patch)}
        />
      </Card>
    </Space>
  );
}

export default function LandingBuilderPage() {
  const { message } = App.useApp();
  const { isDark } = useTheme();
  const [createForm] = Form.useForm();
  const [saveTemplateForm] = Form.useForm();

  const canManageLandings = canWrite(['landings.change_landingpage']);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingLanding, setLoadingLanding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveAndPublishing, setSaveAndPublishing] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('catalog');
  const [landings, setLandings] = useState([]);
  const [selectedLandingId, setSelectedLandingId] = useState(null);
  const [schema, setSchema] = useState(createDefaultSchema());
  const [draftVersion, setDraftVersion] = useState(1);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [bindingsMap, setBindingsMap] = useState({});
  const [lookups, setLookups] = useState({
    stages: [],
    lead_sources: [],
    departments: [],
    users: [],
  });
  const [previewToken, setPreviewToken] = useState('');
  const [revisions, setRevisions] = useState([]);
  const [report, setReport] = useState(null);
  const [reportFilters, setReportFilters] = useState({
    date_from: '',
    date_to: '',
    form_key: '',
    utm_campaign: '',
  });
  const [sectionTypeToAdd, setSectionTypeToAdd] = useState('hero');
  const [presetToApply, setPresetToApply] = useState(LANDING_PRESET_OPTIONS[0].value);
  const [createPresetPreview, setCreatePresetPreview] = useState(LANDING_PRESET_OPTIONS[0].value);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [creatingFromTemplateKey, setCreatingFromTemplateKey] = useState('');
  const [customTemplates, setCustomTemplates] = useState([]);
  const [customTemplatesReady, setCustomTemplatesReady] = useState(false);
  const [templateSaveModalOpen, setTemplateSaveModalOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [dirty, setDirty] = useState(false);

  const selectedLanding = useMemo(
    () => landings.find((item) => String(item.id) === String(selectedLandingId)) || null,
    [landings, selectedLandingId],
  );

  const sections = useMemo(
    () => (Array.isArray(schema?.page?.sections) ? schema.page.sections : []),
    [schema],
  );

  const selectedSection = useMemo(
    () => sections.find((item) => String(item.id) === String(selectedSectionId)) || null,
    [sections, selectedSectionId],
  );

  const templateLibrary = useMemo(
    () => [
      ...LANDING_TEMPLATE_LIBRARY.map((template) => ({ ...template, source: 'builtin' })),
      ...customTemplates,
    ],
    [customTemplates],
  );

  const rowCounts = useMemo(() => {
    const map = {};
    sections.forEach((section) => {
      const row = Number(section.row_index || 1);
      map[row] = Number(map[row] || 0) + 1;
    });
    return map;
  }, [sections]);

  const formSections = useMemo(
    () => sections.filter((section) => section.type === 'form'),
    [sections],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const ui = useMemo(
    () => ({
      pageBg: isDark ? '#0b1220' : '#f5f7fb',
      cardBg: isDark ? '#111827' : '#ffffff',
      cardBorder: isDark ? '#334155' : '#e5e7eb',
      text: isDark ? '#e5e7eb' : '#111827',
      subtle: isDark ? '#94a3b8' : '#6b7280',
    }),
    [isDark],
  );

  const loadLookups = async () => {
    try {
      const data = await landingsApi.lookups();
      setLookups({
        stages: Array.isArray(data?.stages) ? data.stages : [],
        lead_sources: Array.isArray(data?.lead_sources) ? data.lead_sources : [],
        departments: Array.isArray(data?.departments) ? data.departments : [],
        users: Array.isArray(data?.users) ? data.users : [],
      });
    } catch (error) {
      message.warning(extractErrorMessage(error, 'Не удалось загрузить lookup-данные CRM'));
    }
  };

  const loadLandings = async (selectId = null) => {
    setLoadingList(true);
    try {
      const payload = await landingsApi.list();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
      setLandings(items);
      if (selectId) {
        setSelectedLandingId(selectId);
      } else if (!selectedLandingId && items.length) {
        setSelectedLandingId(items[0].id);
      } else if (selectedLandingId && !items.some((item) => String(item.id) === String(selectedLandingId))) {
        setSelectedLandingId(items[0]?.id || null);
      }
    } catch (error) {
      message.error(extractErrorMessage(error, 'Не удалось загрузить список лендингов'));
    } finally {
      setLoadingList(false);
    }
  };

  const loadLandingDetails = async (landingId) => {
    if (!landingId) {
      setSchema(createDefaultSchema());
      setDraftVersion(1);
      setSelectedSectionId('');
      setBindingsMap({});
      setRevisions([]);
      setPreviewToken('');
      setReport(null);
      return;
    }

    setLoadingLanding(true);
    try {
      const [landing, draft, bindings, revs, preview] = await Promise.all([
        landingsApi.retrieve(landingId),
        landingsApi.getDraft(landingId),
        landingsApi.getBindings(landingId),
        landingsApi.revisions(landingId),
        landingsApi.previewToken(landingId),
      ]);

      const normalized = ensureSchema(
        draft?.draft_schema || landing?.draft_schema || createDefaultSchema(landing?.title || 'Landing'),
        landing?.title || 'Landing',
      );

      setSchema(normalized);
      setDraftVersion(Number(draft?.draft_version || landing?.draft_version || 1));
      setBindingsMap(mapBindingsFromApi(bindings));
      setRevisions(Array.isArray(revs) ? revs : []);
      setPreviewToken(String(preview?.token || ''));
      setSelectedSectionId(normalized?.page?.sections?.[0]?.id || '');
      setReport(null);
      setDirty(false);
    } catch (error) {
      message.error(extractErrorMessage(error, 'Не удалось загрузить выбранный лендинг'));
    } finally {
      setLoadingLanding(false);
    }
  };

  useEffect(() => {
    loadLookups();
    loadLandings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setCustomTemplatesReady(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);
      if (!raw) {
        setCustomTemplates([]);
        return;
      }
      const parsed = JSON.parse(raw);
      const normalized = (Array.isArray(parsed) ? parsed : [])
        .map((item, index) => normalizeStoredTemplate(item, index))
        .filter(Boolean)
        .slice(0, CUSTOM_TEMPLATE_LIMIT);
      setCustomTemplates(normalized);
    } catch {
      setCustomTemplates([]);
    } finally {
      setCustomTemplatesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!customTemplatesReady || typeof window === 'undefined') return;
    try {
      const payload = customTemplates
        .slice(0, CUSTOM_TEMPLATE_LIMIT)
        .map((item) => serializeTemplateForStorage(item));
      window.localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage write failures
    }
  }, [customTemplates, customTemplatesReady]);

  useEffect(() => {
    if (!selectedLandingId) return;
    loadLandingDetails(selectedLandingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLandingId]);

  useEffect(() => {
    if (!formSections.length) return;
    setBindingsMap((prev) => {
      const next = { ...(prev || {}) };
      const allowed = new Set();
      formSections.forEach((section) => {
        const key = keyForBinding(section);
        if (!key) return;
        allowed.add(key);
        if (!next[key]) {
          next[key] = createDefaultBinding({
            leadSource: selectedLanding?.lead_source || null,
            stage: lookups?.stages?.[0]?.id || null,
          });
        }
      });
      Object.keys(next).forEach((key) => {
        if (!allowed.has(key)) delete next[key];
      });
      return next;
    });
  }, [formSections, lookups?.stages, selectedLanding?.lead_source]);

  const updateSchema = (updater) => {
    setSchema((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return ensureSchema(next, selectedLanding?.title || 'Landing');
    });
    setDirty(true);
  };

  const updateSection = (updated) => {
    updateSchema((prev) => ({
      ...prev,
      page: {
        ...prev.page,
        sections: prev.page.sections.map((section) =>
          String(section.id) === String(updated.id) ? normalizeSection(updated) : section
        ),
      },
    }));
  };

  const addSection = () => {
    const maxRow = Math.max(1, ...sections.map((section) => Number(section.row_index || 1)));
    const currentRowCount = sections.filter((section) => Number(section.row_index || 1) === maxRow).length;
    const rowIndex = currentRowCount >= 3 ? maxRow + 1 : maxRow;
    const section = createSection(sectionTypeToAdd, rowIndex);
    updateSchema((prev) => ({
      ...prev,
      page: {
        ...prev.page,
        sections: [...prev.page.sections, section],
      },
    }));
    setSelectedSectionId(section.id);
  };

  const deleteSection = (sectionId) => {
    updateSchema((prev) => {
      const nextSections = prev.page.sections.filter((item) => String(item.id) !== String(sectionId));
      return {
        ...prev,
        page: {
          ...prev.page,
          sections: nextSections,
        },
      };
    });
    if (String(selectedSectionId) === String(sectionId)) {
      const fallback = sections.find((item) => String(item.id) !== String(sectionId));
      setSelectedSectionId(fallback?.id || '');
    }
  };

  const duplicateSection = (section) => {
    const copy = normalizeSection({ ...deepClone(section), id: uid(section.type) });
    updateSchema((prev) => ({
      ...prev,
      page: {
        ...prev.page,
        sections: [...prev.page.sections, copy],
      },
    }));
    setSelectedSectionId(copy.id);
  };

  const autoLayoutRows = () => {
    updateSchema((prev) => {
      const nextSections = prev.page.sections.map((section, index) => ({
        ...section,
        row_index: Math.floor(index / 3) + 1,
      }));
      return {
        ...prev,
        page: {
          ...prev.page,
          sections: nextSections,
        },
      };
    });
  };

  const handleApplyPresetToCurrent = (nextPresetKey = presetToApply) => {
    if (!selectedLanding) {
      message.warning('Сначала выберите лендинг');
      return;
    }
    const resolvedPreset = String(nextPresetKey || presetToApply || LANDING_PRESET_OPTIONS[0].value);
    setPresetToApply(resolvedPreset);
    const nextSchema = createDefaultSchema(selectedLanding.title || 'Новый лендинг', resolvedPreset);
    setSchema(nextSchema);
    setSelectedSectionId(nextSchema?.page?.sections?.[0]?.id || '');
    setDirty(true);
    message.success('Дизайн-пресет применен к черновику. Сохраните draft.');
  };

  const handleApplyTemplateToCurrent = (templateKey) => {
    if (!selectedLanding) {
      message.warning('Сначала выберите лендинг');
      return;
    }
    const template = templateLibrary.find((item) => item.key === templateKey);
    if (!template) {
      message.warning('Шаблон не найден');
      return;
    }
    if (template.source === 'custom' && template.schema) {
      const currentTitle = selectedLanding.title || schema?.page?.meta?.title || template.name || 'Новый лендинг';
      const nextSchema = ensureSchema(template.schema, currentTitle);
      nextSchema.page.meta.title = currentTitle;
      nextSchema.page.meta.seo = {
        ...(nextSchema.page.meta.seo || {}),
        title: nextSchema.page.meta.seo?.title || currentTitle,
        og_title: nextSchema.page.meta.seo?.og_title || currentTitle,
      };
      setSchema(nextSchema);
      setBindingsMap(mapBindingsFromApi(normalizeTemplateBindings(template.bindings || [])));
      setSelectedSectionId(nextSchema?.page?.sections?.[0]?.id || '');
      setDirty(true);
      message.success(`Шаблон "${template.name}" применен к черновику`);
      return;
    }
    handleApplyPresetToCurrent(template.key);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((item) => item.id === active.id);
    const newIndex = sections.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    updateSchema((prev) => {
      const reordered = arrayMove(prev.page.sections, oldIndex, newIndex);
      return {
        ...prev,
        page: {
          ...prev.page,
          sections: reordered,
        },
      };
    });
  };

  const handleUploadImage = async (options, section) => {
    const { file, onSuccess, onError } = options;
    if (!selectedLandingId) {
      onError?.(new Error('Выберите лендинг'));
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await landingsApi.uploadAsset(selectedLandingId, formData);
      updateSection({ ...section, imageUrl: result?.url || section.imageUrl || '' });
      onSuccess?.(result, file);
      message.success('Изображение загружено');
    } catch (error) {
      onError?.(error);
      message.error(extractErrorMessage(error, 'Не удалось загрузить файл'));
    }
  };

  const createLandingWithPreset = async ({
    title,
    slug,
    visualPreset,
    isActive = true,
    department = null,
    leadSource = null,
    defaultOwner = null,
    customDomain = null,
    templateSchema = null,
    templateBindings = null,
  }) => {
    const payload = {
      title,
      slug,
      is_active: isActive,
      department: department || null,
      lead_source: leadSource || null,
      default_owner: defaultOwner || null,
      custom_domain: normalizeCustomDomain(customDomain || '') || null,
    };
    const created = await landingsApi.create(payload);
    let presetApplied = true;
    let presetError = null;
    const initialSchema = templateSchema
      ? ensureSchema(templateSchema, title || payload.title || 'Новый лендинг')
      : createDefaultSchema(title || payload.title, visualPreset);
    try {
      await landingsApi.putDraft(created.id, initialSchema, {
        headers: { 'X-Draft-Version': '1' },
      });
      const customBindings = normalizeTemplateBindings(templateBindings || []);
      const initialBindings = customBindings.length
        ? customBindings
        : buildBindingsFromSchema(initialSchema, {
            leadSource: payload.lead_source || null,
            defaultStage: lookups?.stages?.[0]?.id || null,
          });
      if (initialBindings.length) {
        await landingsApi.putBindings(created.id, initialBindings);
      }
    } catch (error) {
      presetApplied = false;
      presetError = error;
    }
    return { created, presetApplied, presetError };
  };

  const handleCreateLanding = async () => {
    try {
      const values = await createForm.validateFields();
      const visualPreset = values.visual_preset || LANDING_PRESET_OPTIONS[0].value;
      const title = values.title;
      const slug = values.slug || toSlug(values.title);
      const { created, presetApplied, presetError } = await createLandingWithPreset({
        title,
        slug,
        visualPreset,
        isActive: values.is_active !== false,
        department: values.department || null,
        leadSource: values.lead_source || null,
        defaultOwner: values.default_owner || null,
        customDomain: values.custom_domain || null,
      });
      if (!presetApplied) {
        message.warning(extractErrorMessage(presetError, 'Лендинг создан, но стартовый пресет не применился'));
      }
      await loadLandings(created?.id || null);
      createForm.resetFields();
      setCreatePresetPreview(LANDING_PRESET_OPTIONS[0].value);
      setActiveTab('editor');
      message.success('Лендинг создан с дизайн-пресетом');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(extractErrorMessage(error, 'Не удалось создать лендинг'));
    }
  };

  const openSaveTemplateModal = () => {
    if (!selectedLanding) {
      message.warning('Сначала выберите лендинг, чтобы сохранить шаблон');
      return;
    }
    const defaultName = selectedLanding.title || schema?.page?.meta?.title || 'Custom landing template';
    const defaultCategory = templateCategoryFilter !== 'all' ? templateCategoryFilter : 'Custom';
    const styleTags = [
      schema?.page?.theme?.background ? 'Gradient' : '',
      schema?.page?.theme?.accent ? 'Accent' : '',
      'Custom',
    ].filter(Boolean);
    saveTemplateForm.setFieldsValue({
      name: defaultName,
      category: defaultCategory,
      description: `Пользовательский шаблон на базе лендинга "${defaultName}"`,
      style_tags: styleTags.join(', '),
      highlights: [
        'Сохранено из текущего draft',
        'Поддерживает персонализацию и A/B тесты',
        'Готово к созданию нового лендинга в один клик',
      ].join('\n'),
    });
    setTemplateSaveModalOpen(true);
  };

  const handleSaveCurrentAsTemplate = async () => {
    if (!selectedLanding) {
      message.warning('Выберите лендинг перед сохранением шаблона');
      return;
    }
    try {
      const values = await saveTemplateForm.validateFields();
      setSavingTemplate(true);
      const name = String(values.name || '').trim();
      const description = String(values.description || '').trim() || 'Пользовательский шаблон лендинга';
      const category = String(values.category || 'Custom').trim() || 'Custom';
      const styleTags = parseCommaValues(values.style_tags, ['Custom']).slice(0, 6);
      const highlights = parseLines(values.highlights, ['Сохранено из текущего draft']).slice(0, 4);
      const schemaSnapshot = ensureSchema(deepClone(schema), name);
      const payloadBindings = normalizeTemplateBindings(bindingsToPayload(bindingsMap));
      const template = {
        key: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        source: 'custom',
        name,
        category,
        styleTags,
        description,
        highlights,
        palette: [
          schemaSnapshot?.page?.theme?.background || '#f8fafc',
          schemaSnapshot?.page?.theme?.primary || '#2563eb',
          schemaSnapshot?.page?.theme?.accent || '#22d3ee',
        ],
        created_at: new Date().toISOString(),
        schema: schemaSnapshot,
        bindings: payloadBindings,
      };
      setCustomTemplates((prev) => [template, ...prev].slice(0, CUSTOM_TEMPLATE_LIMIT));
      setTemplateSaveModalOpen(false);
      saveTemplateForm.resetFields();
      message.success(`Шаблон "${template.name}" сохранен`);
    } catch (error) {
      if (!error?.errorFields) {
        message.error(extractErrorMessage(error, 'Не удалось сохранить шаблон'));
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteCustomTemplate = (templateKey) => {
    setCustomTemplates((prev) => prev.filter((item) => item.key !== templateKey));
    message.success('Пользовательский шаблон удален');
  };

  const handleCreateFromTemplate = async (templateKey) => {
    if (!canManageLandings) return;
    const template = templateLibrary.find((item) => item.key === templateKey);
    if (!template) {
      message.warning('Шаблон не найден');
      return;
    }
    const resolvedTemplate = String(template.key || LANDING_PRESET_OPTIONS[0].value);
    const fallbackPreset = LANDING_PRESET_OPTIONS[0].value;
    const visualPreset = LANDING_PRESET_OPTIONS.some((item) => item.value === resolvedTemplate)
      ? resolvedTemplate
      : fallbackPreset;
    const stamp = Date.now().toString().slice(-6);
    const title = template.source === 'custom'
      ? `${template.name} Copy`
      : `${template.name} Landing`;
    const slug = toSlug(`${template.name}-${stamp}`);
    setCreatingFromTemplateKey(resolvedTemplate);
    try {
      const { created, presetApplied, presetError } = await createLandingWithPreset({
        title,
        slug,
        visualPreset,
        isActive: true,
        department: null,
        leadSource: selectedLanding?.lead_source || null,
        defaultOwner: selectedLanding?.default_owner || null,
        customDomain: null,
        templateSchema: template.source === 'custom' ? template.schema : null,
        templateBindings: template.source === 'custom' ? template.bindings : null,
      });
      if (!presetApplied) {
        message.warning(extractErrorMessage(presetError, 'Лендинг создан, но стартовый пресет не применился'));
      }
      await loadLandings(created?.id || null);
      setPresetToApply(visualPreset);
      setActiveTab('editor');
      message.success(`Лендинг создан из шаблона: ${template.name}`);
    } catch (error) {
      message.error(extractErrorMessage(error, 'Не удалось создать лендинг из шаблона'));
    } finally {
      setCreatingFromTemplateKey('');
    }
  };

  const handlePatchLandingMeta = async (patch) => {
    if (!selectedLandingId) return;
    try {
      await landingsApi.patch(selectedLandingId, patch);
      await loadLandings(selectedLandingId);
      message.success('Метаданные обновлены');
    } catch (error) {
      message.error(extractErrorMessage(error, 'Не удалось обновить лендинг'));
    }
  };

  const handleDeleteLanding = async (landingId) => {
    try {
      await landingsApi.remove(landingId);
      message.success('Лендинг удален');
      const nextId = String(landingId) === String(selectedLandingId) ? null : selectedLandingId;
      setSelectedLandingId(nextId);
      await loadLandings(nextId);
    } catch (error) {
      message.error(extractErrorMessage(error, 'Не удалось удалить лендинг'));
    }
  };

  const handleSaveDraft = async ({ silent = false } = {}) => {
    if (!selectedLandingId) {
      message.warning('Сначала выберите лендинг');
      return false;
    }

    const nextSchema = buildSchemaForSave(schema);
    const errors = validateSchemaClient(nextSchema);
    if (errors.length) {
      if (!silent) {
        Modal.error({
          title: 'Невозможно сохранить draft',
          content: (
            <ul>
              {errors.slice(0, 12).map((item) => <li key={item}>{item}</li>)}
            </ul>
          ),
          width: 680,
        });
      }
      return false;
    }

    setSaving(true);
    try {
      const draftResponse = await landingsApi.putDraft(selectedLandingId, nextSchema, {
        headers: { 'X-Draft-Version': String(draftVersion) },
      });
      const payload = bindingsToPayload(bindingsMap);
      await landingsApi.putBindings(selectedLandingId, payload);

      setSchema(ensureSchema(draftResponse?.draft_schema || nextSchema, selectedLanding?.title || 'Landing'));
      setDraftVersion(Number(draftResponse?.draft_version || draftVersion + 1));
      setDirty(false);
      if (!silent) message.success('Черновик сохранен');
      return true;
    } catch (error) {
      const currentDraft = Number(error?.details?.current_draft_version || 0);
      if (error?.status === 409 && currentDraft) {
        message.error('Конфликт версии черновика: обновите страницу лендинга и повторите сохранение');
      } else {
        message.error(extractErrorMessage(error, 'Не удалось сохранить draft'));
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedLandingId) return;
    setPublishing(true);
    try {
      const saved = await handleSaveDraft({ silent: true });
      if (!saved) return;
      await landingsApi.publish(selectedLandingId);
      await Promise.all([loadLandings(selectedLandingId), loadLandingDetails(selectedLandingId)]);
      message.success('Лендинг опубликован');
    } catch (error) {
      message.error(extractErrorMessage(error, 'Публикация не выполнена'));
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveAndPublish = async () => {
    setSaveAndPublishing(true);
    try {
      const saved = await handleSaveDraft({ silent: true });
      if (!saved || !selectedLandingId) return;
      await landingsApi.publish(selectedLandingId);
      await Promise.all([loadLandings(selectedLandingId), loadLandingDetails(selectedLandingId)]);
      message.success('Draft сохранен и лендинг опубликован');
    } catch (error) {
      message.error(extractErrorMessage(error, 'Save & Publish не выполнен'));
    } finally {
      setSaveAndPublishing(false);
    }
  };

  const handleRollback = async (revisionId) => {
    if (!selectedLandingId || !revisionId) return;
    try {
      await landingsApi.rollback(selectedLandingId, revisionId);
      await loadLandingDetails(selectedLandingId);
      message.success('Откат к выбранной ревизии выполнен');
    } catch (error) {
      message.error(extractErrorMessage(error, 'Не удалось откатить ревизию'));
    }
  };

  const handleLoadReport = async () => {
    if (!selectedLandingId) return;
    setReportLoading(true);
    try {
      const params = {};
      if (reportFilters.date_from) params.date_from = reportFilters.date_from;
      if (reportFilters.date_to) params.date_to = reportFilters.date_to;
      if (reportFilters.form_key) params.form_key = reportFilters.form_key;
      if (reportFilters.utm_campaign) params.utm_campaign = reportFilters.utm_campaign;
      const data = await landingsApi.report(selectedLandingId, params);
      setReport(data || null);
    } catch (error) {
      message.error(extractErrorMessage(error, 'Не удалось загрузить отчет'));
    } finally {
      setReportLoading(false);
    }
  };

  const copyText = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      message.success('Скопировано');
    } catch {
      message.warning('Не удалось скопировать в буфер');
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const normalizedCustomDomain = normalizeCustomDomain(selectedLanding?.custom_domain || '');
  const publicOrigin = normalizedCustomDomain ? `https://${normalizedCustomDomain}` : currentOrigin;
  const publicUrl = selectedLanding?.slug
    ? normalizedCustomDomain
      ? `${publicOrigin}/#/public-landing`
      : `${publicOrigin}/#/public-landing/${selectedLanding.slug}`
    : '';
  const previewUrl = selectedLanding?.slug && previewToken
    ? `${publicOrigin}/#/public-landing/${selectedLanding.slug}/preview/${encodeURIComponent(previewToken)}`
    : '';

  const heatmapMatrix = Array.isArray(report?.behavior?.click_heatmap?.matrix)
    ? report.behavior.click_heatmap.matrix
    : [];
  const maxHeat = Math.max(1, ...heatmapMatrix.flat().map((value) => Number(value || 0)));

  const reportAbVariants = Array.isArray(report?.ab_testing?.variants) ? report.ab_testing.variants : [];
  const templateCategoryOptions = useMemo(() => {
    const categories = Array.from(new Set(templateLibrary.map((item) => item.category)));
    return [{ value: 'all', label: 'Все категории' }, ...categories.map((item) => ({ value: item, label: item }))];
  }, [templateLibrary]);

  const filteredTemplates = useMemo(() => {
    const query = String(templateSearch || '').trim().toLowerCase();
    return templateLibrary.filter((template) => {
      const categoryMatched = templateCategoryFilter === 'all' || template.category === templateCategoryFilter;
      if (!categoryMatched) return false;
      if (!query) return true;
      const haystack = [
        template.name,
        template.category,
        template.description,
        ...(template.styleTags || []),
        ...(template.highlights || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [templateCategoryFilter, templateLibrary, templateSearch]);

  const templatePreviewMap = useMemo(() => {
    const map = {};
    filteredTemplates.forEach((template) => {
      map[template.key] = buildTemplatePreviewDataUri(template);
    });
    return map;
  }, [filteredTemplates]);

  const allTemplatePreviewMap = useMemo(() => {
    const map = {};
    templateLibrary.forEach((template) => {
      map[template.key] = buildTemplatePreviewDataUri(template);
    });
    return map;
  }, [templateLibrary]);

  const createPresetTemplate = useMemo(
    () => templateLibrary.find((item) => item.key === createPresetPreview) || null,
    [templateLibrary, createPresetPreview],
  );

  const applyPresetTemplate = useMemo(
    () => templateLibrary.find((item) => item.key === presetToApply) || null,
    [templateLibrary, presetToApply],
  );

  const bindingRows = formSections.map((section) => {
    const key = keyForBinding(section);
    return {
      key,
      block_id: section.blockId,
      form_key: section.formKey,
      title: section.title || section.id,
      binding: bindingsMap[key] || createDefaultBinding({
        leadSource: selectedLanding?.lead_source || null,
        stage: lookups?.stages?.[0]?.id || null,
      }),
    };
  });

  return (
    <div style={{ minHeight: '100vh', background: ui.pageBg, padding: 20 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Title level={3} style={{ margin: 0, color: ui.text }}>
              Landing Builder (CRM-native)
            </Title>
            <Text style={{ color: ui.subtle }}>
              Конструктор посадочных страниц по ТЗ: drag-and-drop, smart forms и data mapping, персонализация, A/B, аналитика, sandbox custom code.
            </Text>
            {!canManageLandings && (
              <Alert
                type="info"
                showIcon
                message="Режим только чтения"
                description="У вас нет прав на изменение лендингов. Доступен просмотр и аналитика."
              />
            )}
          </Space>
        </Card>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'templates',
              label: '0) Шаблоны',
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Card
                    title="Template Marketplace (Dribbble-style)"
                    extra={(
                      <Button
                        icon={<SaveOutlined />}
                        disabled={!selectedLanding || !canManageLandings}
                        onClick={openSaveTemplateModal}
                      >
                        Сохранить текущий как шаблон
                      </Button>
                    )}
                    style={{ background: ui.cardBg, borderColor: ui.cardBorder }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Text type="secondary">
                        Выберите визуальный шаблон и создайте лендинг в один клик. Каждый шаблон уже включает hero, преимущества, форму и контакты.
                      </Text>
                      <Text type="secondary">
                        Всего шаблонов: {templateLibrary.length}. Пользовательских: {customTemplates.length}.
                      </Text>
                      <Row gutter={8}>
                        <Col xs={24} md={8}>
                          <Select
                            style={{ width: '100%' }}
                            value={templateCategoryFilter}
                            options={templateCategoryOptions}
                            onChange={setTemplateCategoryFilter}
                          />
                        </Col>
                        <Col xs={24} md={16}>
                          <Input.Search
                            allowClear
                            placeholder="Поиск по стилю, категории, описанию..."
                            value={templateSearch}
                            onChange={(event) => setTemplateSearch(event.target.value)}
                          />
                        </Col>
                      </Row>
                    </Space>
                  </Card>

                  {filteredTemplates.length === 0 ? (
                    <Empty description="Шаблоны не найдены по текущему фильтру" />
                  ) : (
                    <Row gutter={[12, 12]}>
                      {filteredTemplates.map((template) => (
                        <Col key={template.key} xs={24} md={12} xl={6}>
                          <Card
                            style={{ background: ui.cardBg, borderColor: ui.cardBorder }}
                            cover={(
                              <div style={{ height: 136, overflow: 'hidden' }}>
                                <img
                                  src={templatePreviewMap[template.key]}
                                  alt={`${template.name} preview`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              </div>
                            )}
                          >
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Text strong>{template.name}</Text>
                                <Space size={4}>
                                  {template.source === 'custom' ? <Tag color="gold">Custom</Tag> : <Tag color="blue">Built-in</Tag>}
                                  <Tag>{template.category}</Tag>
                                </Space>
                              </Space>
                              <Space wrap>
                                {(template.styleTags || []).map((tag) => (
                                  <Tag key={`${template.key}-${tag}`} color="blue">{tag}</Tag>
                                ))}
                              </Space>
                              <Text type="secondary" style={{ minHeight: 44 }}>{template.description}</Text>
                              <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {(template.highlights || []).slice(0, 3).map((item) => (
                                  <li key={`${template.key}-hl-${item}`} style={{ marginBottom: 4 }}>
                                    <Text style={{ fontSize: 12 }}>{item}</Text>
                                  </li>
                                ))}
                              </ul>
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <Button
                                  type="primary"
                                  block
                                  disabled={!canManageLandings}
                                  loading={creatingFromTemplateKey === template.key}
                                  onClick={() => handleCreateFromTemplate(template.key)}
                                >
                                  Создать из шаблона
                                </Button>
                                <Button
                                  block
                                  disabled={!selectedLanding || !canManageLandings}
                                  onClick={() => handleApplyTemplateToCurrent(template.key)}
                                >
                                  Применить к текущему draft
                                </Button>
                                {template.source === 'custom' && (
                                  <Popconfirm
                                    title="Удалить пользовательский шаблон?"
                                    onConfirm={() => handleDeleteCustomTemplate(template.key)}
                                  >
                                    <Button danger block disabled={!canManageLandings}>
                                      Удалить шаблон
                                    </Button>
                                  </Popconfirm>
                                )}
                              </Space>
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Space>
              ),
            },
            {
              key: 'catalog',
              label: '1) Лендинги',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} xl={14}>
                    <Card
                      title="Список лендингов"
                      extra={<Button onClick={() => loadLandings(selectedLandingId)} loading={loadingList}>Обновить</Button>}
                      style={{ background: ui.cardBg, borderColor: ui.cardBorder }}
                    >
                      <Table
                        rowKey="id"
                        loading={loadingList}
                        dataSource={landings}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 1060 }}
                        rowClassName={(record) => (String(record.id) === String(selectedLandingId) ? 'landing-row-selected' : '')}
                        onRow={(record) => ({ onClick: () => setSelectedLandingId(record.id) })}
                        columns={[
                          {
                            title: 'Title',
                            dataIndex: 'title',
                            width: 340,
                            render: (value, record) => (
                              <Space size={6} align="start" wrap>
                                <Text
                                  strong={String(record.id) === String(selectedLandingId)}
                                  style={{
                                    display: 'inline-block',
                                    maxWidth: 260,
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.25,
                                  }}
                                >
                                  {value}
                                </Text>
                                <Tag color={record.status === 'published' ? 'green' : record.status === 'archived' ? 'red' : 'default'}>
                                  {record.status || 'draft'}
                                </Tag>
                              </Space>
                            ),
                          },
                          {
                            title: 'Slug',
                            dataIndex: 'slug',
                            width: 250,
                            ellipsis: true,
                            render: (value) => (
                              <Tooltip title={value || '-'}>
                                <span>{value || '-'}</span>
                              </Tooltip>
                            ),
                          },
                          {
                            title: 'Domain',
                            dataIndex: 'custom_domain',
                            width: 180,
                            render: (value) => value || '-',
                          },
                          {
                            title: 'Updated',
                            dataIndex: 'updated_at',
                            width: 170,
                            render: (value) => formatDateTime(value),
                          },
                          {
                            title: 'Actions',
                            width: 110,
                            render: (_, record) => (
                              <Popconfirm
                                title="Удалить лендинг?"
                                disabled={!canManageLandings}
                                onConfirm={() => handleDeleteLanding(record.id)}
                              >
                                <Button danger size="small" disabled={!canManageLandings} icon={<DeleteOutlined />} />
                              </Popconfirm>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} xl={10}>
                    <Card title="Новый лендинг" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                        <Form
                          form={createForm}
                          layout="vertical"
                          initialValues={{ is_active: true, visual_preset: LANDING_PRESET_OPTIONS[0].value }}
                        >
                        <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
                          <Input
                            placeholder="Например: Лидогенерация B2B"
                            onBlur={(event) => {
                              const slug = createForm.getFieldValue('slug');
                              if (!slug) createForm.setFieldValue('slug', toSlug(event.target.value));
                            }}
                          />
                        </Form.Item>
                        <Form.Item name="slug" label="Slug" rules={[{ required: true, message: 'Введите slug' }]}>
                          <Input placeholder="b2b-leadgen" />
                        </Form.Item>
                        <Form.Item name="custom_domain" label="Custom domain">
                          <Input placeholder="promo.example.com" />
                        </Form.Item>
                        <Form.Item
                          name="visual_preset"
                          label="Дизайн-пресет (Dribbble-style)"
                          tooltip="Стартовый визуальный стиль лендинга"
                        >
                          <Select
                            options={LANDING_PRESET_OPTIONS.map((item) => ({
                              value: item.value,
                              label: `${item.label} — ${item.description}`,
                            }))}
                            onChange={(value) => setCreatePresetPreview(String(value || LANDING_PRESET_OPTIONS[0].value))}
                          />
                        </Form.Item>
                        {createPresetTemplate && (
                          <Card size="small" title="Предпросмотр пресета" style={{ marginBottom: 12 }}>
                            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                              <img
                                src={allTemplatePreviewMap[createPresetTemplate.key]}
                                alt={`${createPresetTemplate.name} preview`}
                                style={{ width: '100%', height: 148, objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                            <Space style={{ marginTop: 8 }} wrap>
                              <Text strong>{createPresetTemplate.name}</Text>
                              <Tag>{createPresetTemplate.category}</Tag>
                            </Space>
                          </Card>
                        )}

                        <Row gutter={8}>
                          <Col xs={24} md={12}>
                            <Form.Item name="department" label="Department">
                              <Select
                                allowClear
                                options={(lookups.departments || []).map((item) => ({ value: item.id, label: item.name }))}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name="lead_source" label="Lead source">
                              <Select
                                allowClear
                                options={(lookups.lead_sources || []).map((item) => ({ value: item.id, label: item.name }))}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={8}>
                          <Col xs={24} md={12}>
                            <Form.Item name="default_owner" label="Default owner">
                              <Select
                                allowClear
                                options={(lookups.users || []).map((item) => ({ value: item.id, label: item.username || item.full_name || item.email || item.id }))}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name="is_active" label="Активен" valuePropName="checked">
                              <Switch />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Button type="primary" block icon={<PlusOutlined />} onClick={handleCreateLanding} disabled={!canManageLandings}>
                          Создать лендинг
                        </Button>
                      </Form>
                    </Card>

                    {selectedLanding && (
                      <Card title="Метаданные выбранного лендинга" style={{ marginTop: 12, background: ui.cardBg, borderColor: ui.cardBorder }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Input
                            addonBefore="Title"
                            defaultValue={selectedLanding.title}
                            onBlur={(event) => {
                              const value = event.target.value.trim();
                              if (value && value !== selectedLanding.title) {
                                handlePatchLandingMeta({ title: value });
                              }
                            }}
                            disabled={!canManageLandings}
                          />
                          <Input
                            addonBefore="Slug"
                            defaultValue={selectedLanding.slug}
                            onBlur={(event) => {
                              const value = toSlug(event.target.value);
                              if (value && value !== selectedLanding.slug) {
                                handlePatchLandingMeta({ slug: value });
                              }
                            }}
                            disabled={!canManageLandings}
                          />
                          <Input
                            addonBefore="Domain"
                            defaultValue={selectedLanding.custom_domain || ''}
                            onBlur={(event) => {
                              const value = normalizeCustomDomain(event.target.value);
                              if (value !== normalizeCustomDomain(selectedLanding.custom_domain || '')) {
                                handlePatchLandingMeta({ custom_domain: value || null });
                              }
                            }}
                            disabled={!canManageLandings}
                          />
                          <Space>
                            <Text type="secondary">Статус:</Text>
                            <Tag color={selectedLanding.status === 'published' ? 'green' : 'default'}>{selectedLanding.status || 'draft'}</Tag>
                          </Space>
                          <Space>
                            <Text type="secondary">Активен:</Text>
                            <Switch
                              checked={selectedLanding.is_active !== false}
                              disabled={!canManageLandings}
                              onChange={(checked) => handlePatchLandingMeta({ is_active: checked })}
                            />
                          </Space>
                        </Space>
                      </Card>
                    )}
                  </Col>
                </Row>
              ),
            },
            {
              key: 'editor',
              label: '2) Редактор',
              children: (
                <Spin spinning={loadingLanding}>
                  {!selectedLanding ? (
                    <Empty description="Выберите лендинг в первой вкладке" />
                  ) : (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} xl={12}>
                        <Card title="Структура страницы" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                              type="info"
                              showIcon
                              message="FR-01: drag-and-drop + row/block"
                              description="Разрешено максимум 3 блока в строке. При превышении валидация не даст сохранить draft."
                            />

                            <Card
                              size="small"
                              title="Dribbble-style пресеты"
                              extra={<Tag color="purple">Новый</Tag>}
                            >
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <Text type="secondary">
                                  Быстрый старт с современными визуальными стилями: SaaS, Agency, Fintech, Minimal.
                                </Text>
                                <Row gutter={8}>
                                  <Col xs={24} md={16}>
                                    <Select
                                      style={{ width: '100%' }}
                                      value={presetToApply}
                                      options={LANDING_PRESET_OPTIONS.map((item) => ({
                                        value: item.value,
                                        label: `${item.label} — ${item.description}`,
                                      }))}
                                      onChange={setPresetToApply}
                                      disabled={!canManageLandings}
                                    />
                                  </Col>
                                  <Col xs={24} md={8}>
                                    <Popconfirm
                                      title="Применить пресет к текущему draft?"
                                      description="Текущие секции будут заменены на структуру пресета."
                                      onConfirm={handleApplyPresetToCurrent}
                                      disabled={!canManageLandings}
                                    >
                                      <Button type="primary" block disabled={!canManageLandings}>
                                        Применить
                                      </Button>
                                    </Popconfirm>
                                  </Col>
                                </Row>
                                {applyPresetTemplate && (
                                  <Card size="small" title="Предпросмотр выбранного пресета">
                                    <Row gutter={8} align="middle">
                                      <Col xs={24} md={12}>
                                        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                          <img
                                            src={allTemplatePreviewMap[applyPresetTemplate.key]}
                                            alt={`${applyPresetTemplate.name} preview`}
                                            style={{ width: '100%', height: 132, objectFit: 'cover', display: 'block' }}
                                          />
                                        </div>
                                      </Col>
                                      <Col xs={24} md={12}>
                                        <Space direction="vertical" size={4}>
                                          <Text strong>{applyPresetTemplate.name}</Text>
                                          <Text type="secondary">{applyPresetTemplate.description}</Text>
                                          <Space wrap>
                                            {(applyPresetTemplate.styleTags || []).slice(0, 4).map((tag) => (
                                              <Tag key={`${applyPresetTemplate.key}-preview-${tag}`}>{tag}</Tag>
                                            ))}
                                          </Space>
                                        </Space>
                                      </Col>
                                    </Row>
                                  </Card>
                                )}
                              </Space>
                            </Card>

                            <Row gutter={8}>
                              <Col xs={24} md={12}>
                                <Select
                                  style={{ width: '100%' }}
                                  value={sectionTypeToAdd}
                                  options={SECTION_TYPE_OPTIONS}
                                  onChange={setSectionTypeToAdd}
                                  disabled={!canManageLandings}
                                />
                              </Col>
                              <Col xs={24} md={12}>
                                <Space style={{ width: '100%' }}>
                                  <Button type="primary" icon={<PlusOutlined />} onClick={addSection} disabled={!canManageLandings}>
                                    Добавить
                                  </Button>
                                  <Button onClick={autoLayoutRows} disabled={!canManageLandings}>Auto layout rows</Button>
                                </Space>
                              </Col>
                            </Row>

                            <Card size="small" title="Page meta / SEO / Theme">
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <Input
                                  addonBefore="title"
                                  value={schema?.page?.meta?.title || ''}
                                  onChange={(e) => updateSchema((prev) => ({
                                    ...prev,
                                    page: {
                                      ...prev.page,
                                      meta: { ...prev.page.meta, title: e.target.value },
                                    },
                                  }))}
                                />
                                <Input.TextArea
                                  rows={2}
                                  value={schema?.page?.meta?.description || ''}
                                  onChange={(e) => updateSchema((prev) => ({
                                    ...prev,
                                    page: {
                                      ...prev.page,
                                      meta: { ...prev.page.meta, description: e.target.value },
                                    },
                                  }))}
                                  placeholder="description"
                                />

                                <Row gutter={8}>
                                  <Col xs={24} md={12}>
                                    <Input
                                      addonBefore="seo.title"
                                      value={schema?.page?.meta?.seo?.title || ''}
                                      onChange={(e) => updateSchema((prev) => ({
                                        ...prev,
                                        page: {
                                          ...prev.page,
                                          meta: {
                                            ...prev.page.meta,
                                            seo: { ...prev.page.meta.seo, title: e.target.value },
                                          },
                                        },
                                      }))}
                                    />
                                  </Col>
                                  <Col xs={24} md={12}>
                                    <Input
                                      addonBefore="seo.og_title"
                                      value={schema?.page?.meta?.seo?.og_title || ''}
                                      onChange={(e) => updateSchema((prev) => ({
                                        ...prev,
                                        page: {
                                          ...prev.page,
                                          meta: {
                                            ...prev.page.meta,
                                            seo: { ...prev.page.meta.seo, og_title: e.target.value },
                                          },
                                        },
                                      }))}
                                    />
                                  </Col>
                                </Row>

                                <Row gutter={8}>
                                  <Col xs={24} md={12}>
                                    <Input
                                      addonBefore="theme.primary"
                                      value={schema?.page?.theme?.primary || ''}
                                      onChange={(e) => updateSchema((prev) => ({
                                        ...prev,
                                        page: {
                                          ...prev.page,
                                          theme: { ...prev.page.theme, primary: e.target.value },
                                        },
                                      }))}
                                    />
                                  </Col>
                                  <Col xs={24} md={12}>
                                    <Input
                                      addonBefore="theme.accent"
                                      value={schema?.page?.theme?.accent || ''}
                                      onChange={(e) => updateSchema((prev) => ({
                                        ...prev,
                                        page: {
                                          ...prev.page,
                                          theme: { ...prev.page.theme, accent: e.target.value },
                                        },
                                      }))}
                                    />
                                  </Col>
                                </Row>

                                <Switch
                                  checked={Boolean(schema?.page?.meta?.seo?.noindex)}
                                  onChange={(checked) => updateSchema((prev) => ({
                                    ...prev,
                                    page: {
                                      ...prev.page,
                                      meta: {
                                        ...prev.page.meta,
                                        seo: { ...prev.page.meta.seo, noindex: checked },
                                      },
                                    },
                                  }))}
                                  checkedChildren="noindex"
                                  unCheckedChildren="index"
                                />
                              </Space>
                            </Card>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                              <SortableContext items={sections.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  {sections.map((section) => (
                                    <SortableSectionCard
                                      key={section.id}
                                      section={section}
                                      selected={String(selectedSectionId) === String(section.id)}
                                      rowCount={Number(rowCounts[Number(section.row_index || 1)] || 0)}
                                      onSelect={() => setSelectedSectionId(section.id)}
                                      onDuplicate={() => duplicateSection(section)}
                                      onDelete={() => deleteSection(section.id)}
                                    />
                                  ))}
                                </Space>
                              </SortableContext>
                            </DndContext>
                          </Space>
                        </Card>
                      </Col>

                      <Col xs={24} xl={12}>
                        <Card title="Редактирование секции" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                          <SectionEditor
                            section={selectedSection}
                            selectedLandingId={selectedLandingId}
                            canManage={canManageLandings}
                            onChange={updateSection}
                            onUploadImage={handleUploadImage}
                          />
                        </Card>
                      </Col>
                    </Row>
                  )}
                </Spin>
              ),
            },
            {
              key: 'mapping',
              label: '3) Формы и CRM-маппинг',
              children: (
                <Spin spinning={loadingLanding}>
                  {!selectedLanding ? (
                    <Empty description="Выберите лендинг" />
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Alert
                        type="info"
                        showIcon
                        message="FR-02 + FR-04"
                        description="Умные формы, data mapping и автоматизация CRM (создание сделки + назначение менеджера)."
                      />

                      {!bindingRows.length ? (
                        <Empty description="На странице нет секций типа form" />
                      ) : (
                        bindingRows.map((row) => (
                          <Card
                            key={row.key}
                            title={`Binding: ${row.block_id} :: ${row.form_key}`}
                            extra={<Tag>{row.title}</Tag>}
                            style={{ background: ui.cardBg, borderColor: ui.cardBorder }}
                          >
                            <Row gutter={[8, 8]}>
                              <Col xs={24} md={12}>
                                <Text type="secondary">Lead source</Text>
                                <Select
                                  allowClear
                                  style={{ width: '100%' }}
                                  value={row.binding.lead_source}
                                  options={lookups.lead_sources.map((item) => ({ value: item.id, label: item.name }))}
                                  onChange={(value) => {
                                    setBindingsMap((prev) => ({
                                      ...prev,
                                      [row.key]: { ...row.binding, lead_source: value || null },
                                    }));
                                    setDirty(true);
                                  }}
                                />
                              </Col>

                              <Col xs={24} md={12}>
                                <Text type="secondary">Stage on deal create</Text>
                                <Select
                                  allowClear
                                  style={{ width: '100%' }}
                                  value={row.binding.stage_on_deal_create}
                                  options={lookups.stages.map((item) => ({ value: item.id, label: item.name }))}
                                  onChange={(value) => {
                                    setBindingsMap((prev) => ({
                                      ...prev,
                                      [row.key]: { ...row.binding, stage_on_deal_create: value || null },
                                    }));
                                    setDirty(true);
                                  }}
                                />
                              </Col>

                              <Col xs={24} md={8}>
                                <Text type="secondary">Create deal</Text>
                                <div>
                                  <Switch
                                    checked={row.binding.create_deal !== false}
                                    onChange={(checked) => {
                                      setBindingsMap((prev) => ({
                                        ...prev,
                                        [row.key]: { ...row.binding, create_deal: checked },
                                      }));
                                      setDirty(true);
                                    }}
                                  />
                                </div>
                              </Col>

                              <Col xs={24} md={8}>
                                <Text type="secondary">Owner strategy</Text>
                                <Select
                                  style={{ width: '100%' }}
                                  value={row.binding.owner_strategy || 'inherit'}
                                  options={OWNER_STRATEGY_OPTIONS}
                                  onChange={(value) => {
                                    setBindingsMap((prev) => ({
                                      ...prev,
                                      [row.key]: { ...row.binding, owner_strategy: value },
                                    }));
                                    setDirty(true);
                                  }}
                                />
                              </Col>

                              <Col xs={24} md={8}>
                                <Text type="secondary">Fixed owner</Text>
                                <Select
                                  allowClear
                                  disabled={row.binding.owner_strategy !== 'fixed_user'}
                                  style={{ width: '100%' }}
                                  value={row.binding.fixed_owner}
                                  options={lookups.users.map((item) => ({ value: item.id, label: item.username || item.full_name || item.email || item.id }))}
                                  onChange={(value) => {
                                    setBindingsMap((prev) => ({
                                      ...prev,
                                      [row.key]: { ...row.binding, fixed_owner: value || null },
                                    }));
                                    setDirty(true);
                                  }}
                                />
                              </Col>

                              <Col xs={24} md={8}>
                                <Text type="secondary">Assignment queue ID (round-robin)</Text>
                                <InputNumber
                                  min={1}
                                  style={{ width: '100%' }}
                                  value={row.binding.assignment_queue || null}
                                  disabled={row.binding.owner_strategy !== 'round_robin'}
                                  onChange={(value) => {
                                    setBindingsMap((prev) => ({
                                      ...prev,
                                      [row.key]: { ...row.binding, assignment_queue: value || null },
                                    }));
                                    setDirty(true);
                                  }}
                                />
                              </Col>

                              <Col xs={24} md={8}>
                                <Text type="secondary">Binding active</Text>
                                <div>
                                  <Switch
                                    checked={row.binding.active !== false}
                                    onChange={(checked) => {
                                      setBindingsMap((prev) => ({
                                        ...prev,
                                        [row.key]: { ...row.binding, active: checked },
                                      }));
                                      setDirty(true);
                                    }}
                                  />
                                </div>
                              </Col>

                              <Col xs={24} md={12}>
                                <Text type="secondary">SLA minutes</Text>
                                <InputNumber
                                  min={1}
                                  max={1440}
                                  style={{ width: '100%' }}
                                  value={Number(row.binding.sla_minutes || 15)}
                                  onChange={(value) => {
                                    setBindingsMap((prev) => ({
                                      ...prev,
                                      [row.key]: { ...row.binding, sla_minutes: Number(value || 15) },
                                    }));
                                    setDirty(true);
                                  }}
                                />
                              </Col>

                              <Col xs={24} md={12}>
                                <Text type="secondary">Dedup window (minutes)</Text>
                                <InputNumber
                                  min={1}
                                  max={10080}
                                  style={{ width: '100%' }}
                                  value={Number(row.binding.dedup_window_minutes || 120)}
                                  onChange={(value) => {
                                    setBindingsMap((prev) => ({
                                      ...prev,
                                      [row.key]: { ...row.binding, dedup_window_minutes: Number(value || 120) },
                                    }));
                                    setDirty(true);
                                  }}
                                />
                              </Col>
                            </Row>
                          </Card>
                        ))
                      )}

                      <Card title="Таблица рекомендуемого Data Mapping" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                        <Table
                          rowKey="web_field"
                          pagination={false}
                          dataSource={[
                            { web_field: 'Полное имя', crm_field: 'Имя + Фамилия', type: 'text', validation: 'split + title case' },
                            { web_field: 'Номер телефона', crm_field: 'Основной телефон', type: 'string', validation: 'E.164 normalize' },
                            { web_field: 'Размер бизнеса', crm_field: 'Количество сотрудников', type: 'number', validation: 'int only' },
                            { web_field: 'Годовой доход', crm_field: 'Годовой оборот', type: 'currency', validation: 'to decimal(2)' },
                            { web_field: 'Электронная почта', crm_field: 'Основной Email', type: 'email', validation: 'mask + dedup' },
                          ]}
                          columns={[
                            { title: 'Поле веб-формы', dataIndex: 'web_field' },
                            { title: 'Поле CRM', dataIndex: 'crm_field' },
                            { title: 'Тип', dataIndex: 'type', width: 120 },
                            { title: 'Валидация/трансформация', dataIndex: 'validation' },
                          ]}
                        />
                      </Card>
                    </Space>
                  )}
                </Spin>
              ),
            },
            {
              key: 'personalization',
              label: '4) Персонализация / A-B',
              children: (
                <Spin spinning={loadingLanding}>
                  {!selectedLanding ? (
                    <Empty description="Выберите лендинг" />
                  ) : (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} xl={12}>
                        <Card title="Секционный personalization editor" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                          {!selectedSection ? (
                            <Empty description="Выберите секцию во вкладке 'Редактор'" />
                          ) : (
                            <PersonalizationRuleEditor
                              section={selectedSection}
                              onChange={(patch) => updateSection({ ...selectedSection, ...patch })}
                            />
                          )}
                        </Card>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Card title="A/B editor" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                          <AbTestEditor
                            abTest={schema?.page?.meta?.ab_test}
                            onChange={(ab_test) => {
                              updateSchema((prev) => ({
                                ...prev,
                                page: {
                                  ...prev.page,
                                  meta: {
                                    ...prev.page.meta,
                                    ab_test,
                                  },
                                },
                              }));
                            }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  )}
                </Spin>
              ),
            },
            {
              key: 'publish',
              label: '5) Публикация',
              children: (
                <Spin spinning={loadingLanding}>
                  {!selectedLanding ? (
                    <Empty description="Выберите лендинг" />
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Card style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                        <Space wrap>
                          <Button icon={<SaveOutlined />} onClick={() => handleSaveDraft()} loading={saving} disabled={!canManageLandings || !selectedLandingId}>
                            Сохранить draft
                          </Button>
                          <Button icon={<PlayCircleOutlined />} onClick={handlePublish} loading={publishing} disabled={!canManageLandings || !selectedLandingId}>
                            Опубликовать
                          </Button>
                          <Button type="primary" onClick={handleSaveAndPublish} loading={saveAndPublishing} disabled={!canManageLandings || !selectedLandingId}>
                            Save & Publish
                          </Button>
                          <Tag color={dirty ? 'orange' : 'green'}>{dirty ? 'Есть несохраненные изменения' : 'Состояние синхронизировано'}</Tag>
                          <Tag>Draft version: {draftVersion}</Tag>
                        </Space>
                      </Card>

                      <Card title="Публичные ссылки" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong>Public URL</Text>
                            <Space>
                              <Button icon={<EyeOutlined />} onClick={() => publicUrl && window.open(publicUrl, '_blank')} disabled={!publicUrl}>Открыть</Button>
                              <Button icon={<CopyOutlined />} onClick={() => copyText(publicUrl)} disabled={!publicUrl}>Копировать</Button>
                            </Space>
                          </Space>
                          <Input value={publicUrl} readOnly />

                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong>Preview URL</Text>
                            <Space>
                              <Button icon={<EyeOutlined />} onClick={() => previewUrl && window.open(previewUrl, '_blank')} disabled={!previewUrl}>Открыть</Button>
                              <Button icon={<CopyOutlined />} onClick={() => copyText(previewUrl)} disabled={!previewUrl}>Копировать</Button>
                            </Space>
                          </Space>
                          <Input value={previewUrl} readOnly />
                        </Space>
                      </Card>

                      <Card title="История ревизий" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                        <Table
                          rowKey="id"
                          dataSource={revisions}
                          pagination={{ pageSize: 6 }}
                          columns={[
                            { title: 'ID', dataIndex: 'id', width: 90 },
                            { title: 'Type', dataIndex: 'kind', width: 120 },
                            { title: 'Schema v', dataIndex: 'schema_version', width: 120 },
                            { title: 'Created By', dataIndex: 'created_by_name', width: 180 },
                            {
                              title: 'Created',
                              dataIndex: 'created_at',
                              render: (value) => formatDateTime(value),
                              width: 170,
                            },
                            {
                              title: 'Action',
                              width: 120,
                              render: (_, record) => (
                                <Popconfirm
                                  title={`Откатить к ревизии #${record.id}?`}
                                  disabled={!canManageLandings}
                                  onConfirm={() => handleRollback(record.id)}
                                >
                                  <Button icon={<RollbackOutlined />} disabled={!canManageLandings}>Rollback</Button>
                                </Popconfirm>
                              ),
                            },
                          ]}
                        />
                      </Card>
                    </Space>
                  )}
                </Spin>
              ),
            },
            {
              key: 'analytics',
              label: '6) Аналитика',
              children: (
                <Spin spinning={loadingLanding}>
                  {!selectedLanding ? (
                    <Empty description="Выберите лендинг" />
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Card title="Фильтры отчета" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                        <Row gutter={8}>
                          <Col xs={24} md={6}>
                            <DatePicker
                              style={{ width: '100%' }}
                              placeholder="date_from"
                              value={reportFilters.date_from ? dayjs(reportFilters.date_from) : null}
                              onChange={(value) => setReportFilters((prev) => ({ ...prev, date_from: value ? value.format('YYYY-MM-DD') : '' }))}
                            />
                          </Col>
                          <Col xs={24} md={6}>
                            <DatePicker
                              style={{ width: '100%' }}
                              placeholder="date_to"
                              value={reportFilters.date_to ? dayjs(reportFilters.date_to) : null}
                              onChange={(value) => setReportFilters((prev) => ({ ...prev, date_to: value ? value.format('YYYY-MM-DD') : '' }))}
                            />
                          </Col>
                          <Col xs={24} md={6}>
                            <Input
                              placeholder="form_key"
                              value={reportFilters.form_key}
                              onChange={(e) => setReportFilters((prev) => ({ ...prev, form_key: e.target.value }))}
                            />
                          </Col>
                          <Col xs={24} md={6}>
                            <Input
                              placeholder="utm_campaign"
                              value={reportFilters.utm_campaign}
                              onChange={(e) => setReportFilters((prev) => ({ ...prev, utm_campaign: e.target.value }))}
                            />
                          </Col>
                        </Row>
                        <Divider style={{ margin: '12px 0' }} />
                        <Button type="primary" onClick={handleLoadReport} loading={reportLoading}>
                          Загрузить отчет
                        </Button>
                      </Card>

                      {report && (
                        <>
                          <Card title="Метрики и конверсии" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                            <Row gutter={[12, 12]}>
                              <Col xs={12} md={6}><Statistic title="Visits" value={report?.metrics?.visits || report?.metrics?.landing_view || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="Form view" value={report?.metrics?.form_view || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="Form start" value={report?.metrics?.form_start || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="Form submit" value={report?.metrics?.form_submit || 0} /></Col>

                              <Col xs={12} md={6}><Statistic title="Lead created" value={report?.metrics?.lead_created || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="Deal created" value={report?.metrics?.deal_created || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="View->Submit %" value={report?.conversions?.view_to_submit_pct || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="Submit->Lead %" value={report?.conversions?.submit_to_lead_pct || 0} /></Col>

                              <Col xs={12} md={6}><Statistic title="Dedup hit" value={report?.metrics?.dedup_hit || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="SLA breached" value={report?.metrics?.sla_breached || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="Scroll avg %" value={report?.behavior?.scroll_depth?.avg_pct || 0} /></Col>
                              <Col xs={12} md={6}><Statistic title="Heatmap clicks" value={report?.behavior?.click_heatmap?.total_clicks || 0} /></Col>
                            </Row>
                          </Card>

                          {Array.isArray(heatmapMatrix) && heatmapMatrix.length > 0 && (
                            <Card title="Heatmap (10x10)" style={{ background: ui.cardBg, borderColor: ui.cardBorder }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gap: 4 }}>
                                {heatmapMatrix.flatMap((row, y) =>
                                  row.map((value, x) => {
                                    const normalized = Number(value || 0) / maxHeat;
                                    const bg = `rgba(37, 99, 235, ${Math.max(0.08, normalized)})`;
                                    return (
                                      <div
                                        key={`heat-${x}-${y}`}
                                        title={`x=${x}, y=${y}, clicks=${value || 0}`}
                                        style={{
                                          borderRadius: 6,
                                          border: '1px solid #dbe5f4',
                                          minHeight: 34,
                                          display: 'grid',
                                          placeItems: 'center',
                                          fontSize: 12,
                                          background: bg,
                                        }}
                                      >
                                        {Number(value || 0)}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </Card>
                          )}

                          {reportAbVariants.length > 0 && (
                            <Card
                              title={`A/B результаты${report?.ab_testing?.control_variant ? ` (control: ${report.ab_testing.control_variant})` : ''}`}
                              style={{ background: ui.cardBg, borderColor: ui.cardBorder }}
                            >
                              <Table
                                rowKey="variant"
                                pagination={false}
                                dataSource={reportAbVariants}
                                columns={[
                                  { title: 'Variant', dataIndex: 'variant', width: 140 },
                                  { title: 'Views', dataIndex: 'views', width: 100 },
                                  { title: 'Submit', dataIndex: 'form_submit', width: 100 },
                                  { title: 'Leads', dataIndex: 'lead_created', width: 100 },
                                  { title: 'Deals', dataIndex: 'deal_created', width: 100 },
                                  { title: 'Submit/View %', dataIndex: 'submit_to_view_pct', width: 140 },
                                  {
                                    title: 'Significance vs control',
                                    render: (_, record) => {
                                      const sig = record.significance_vs_control;
                                      if (!sig || sig.p_value === null || sig.p_value === undefined) return '-';
                                      return (
                                        <Space>
                                          <Tag color={sig.significant ? 'green' : 'default'}>
                                            p={sig.p_value}
                                          </Tag>
                                          <Tag>z={sig.z_score}</Tag>
                                        </Space>
                                      );
                                    },
                                  },
                                ]}
                              />
                            </Card>
                          )}
                        </>
                      )}
                    </Space>
                  )}
                </Spin>
              ),
            },
          ]}
        />

        <Modal
          title="Сохранить текущий лендинг как шаблон"
          open={templateSaveModalOpen}
          onCancel={() => {
            if (savingTemplate) return;
            setTemplateSaveModalOpen(false);
          }}
          onOk={handleSaveCurrentAsTemplate}
          confirmLoading={savingTemplate}
          okText="Сохранить шаблон"
          cancelText="Отмена"
          destroyOnClose
        >
          <Form form={saveTemplateForm} layout="vertical">
            <Form.Item
              name="name"
              label="Название шаблона"
              rules={[{ required: true, message: 'Введите название шаблона' }]}
            >
              <Input placeholder="Например: SaaS Growth Dark" maxLength={72} />
            </Form.Item>
            <Form.Item
              name="category"
              label="Категория"
              rules={[{ required: true, message: 'Введите категорию' }]}
            >
              <Input placeholder="SaaS / Agency / Fintech / Custom" maxLength={48} />
            </Form.Item>
            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={2} placeholder="Кратко опишите назначение шаблона" maxLength={220} showCount />
            </Form.Item>
            <Form.Item name="style_tags" label="Style tags (через запятую)">
              <Input placeholder="Bold, Minimal, High-contrast" />
            </Form.Item>
            <Form.Item name="highlights" label="Ключевые особенности (по одной на строку)">
              <Input.TextArea rows={4} placeholder={'Hero с оффером\nБлок преимуществ\nФорма заявки'} />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  );
}
