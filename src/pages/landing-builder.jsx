import {
  Alert,
  App,
  Button,
  Card,
  Carousel,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Upload,
  Typography,
  Segmented,
} from 'antd';
import { Editor, Element, Frame, useEditor, useNode } from '@craftjs/core';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { landingsApi } from '../lib/api/client';
import brandLogo from '../assets/brand/logo.svg';
import { useTheme } from '../lib/hooks/useTheme.js';
import { canWrite } from '../lib/rbac.js';

const { Title, Text } = Typography;
const LANGUAGES = ['ru', 'uz', 'en'];
const LandingLocaleContext = createContext('ru');
const FONT_OPTIONS = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: '"Manrope", "Inter", system-ui, sans-serif', label: 'Manrope' },
  { value: '"SF Pro Display", "Inter", system-ui, sans-serif', label: 'SF Pro' },
  { value: '"Roboto", system-ui, sans-serif', label: 'Roboto' },
  { value: '"Georgia", serif', label: 'Georgia' },
];

const DEFAULT_THEME = {
  primary: '#1f2937',
  background: '#f8fafc',
  text: '#111827',
  accent: '#2563eb',
};

function safeParseJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function uid(prefix = 'node') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureI18nObject(value, fallback = '') {
  const pick = (...items) => items.find((item) => item !== undefined && item !== null);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      ru: pick(value.ru, value.en, value.uz, fallback) ?? '',
      uz: pick(value.uz, value.ru, value.en, fallback) ?? '',
      en: pick(value.en, value.ru, value.uz, fallback) ?? '',
    };
  }
  const normalized = String(value || fallback || '');
  return { ru: normalized, uz: normalized, en: normalized };
}

function textByLocale(nodeProps, key, locale, fallback = '') {
  const map = ensureI18nObject(nodeProps?.[`${key}_i18n`], nodeProps?.[key] || fallback);
  return map?.[locale] ?? map?.ru ?? map?.en ?? map?.uz ?? fallback;
}

function toSafeFilePart(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40);
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

function formatNumber(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '0';
  return String(num);
}

function formatPercent(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '0.00%';
  return `${num.toFixed(2)}%`;
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function svgUrlToPngDataUrl(url, width = 90, height = 22) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context is not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = url;
  });
}

function bindingKey(blockId, formKey) {
  return `${blockId}::${formKey}`;
}

function defaultBindingConfig(landing) {
  return {
    lead_source: landing?.lead_source || null,
    stage_on_deal_create: null,
    create_deal: false,
    owner_strategy: 'inherit',
    fixed_owner: null,
    assignment_queue: null,
    sla_minutes: 15,
    dedup_window_minutes: 120,
    active: true,
  };
}

function getNodeLabel(node) {
  const name = node?.type?.resolvedName || node?.displayName;
  const props = node?.props || {};
  if (name === 'HeroBlock') return props.title || 'Hero';
  if (name === 'TextBlock') return props.title || 'Text';
  if (name === 'FeaturesBlock') return props.title || 'Features';
  if (name === 'CtaBlock') return props.title || 'CTA';
  if (name === 'FormBlock') return props.title || 'Form';
  if (name === 'CarouselBlock') return props.title || 'Carousel';
  if (props?.title) return props.title;
  return name || 'Block';
}

function useBlockSelection() {
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return {
    connect,
    drag,
    selected,
  };
}

function blockContainerStyles(props = {}) {
  return {
    background: props.background || '#ffffff',
    backgroundImage: props.backgroundImageUrl ? `url(${props.backgroundImageUrl})` : 'none',
    backgroundSize: props.backgroundSize || 'cover',
    backgroundPosition: props.backgroundPosition || 'center',
    backgroundRepeat: props.backgroundRepeat || 'no-repeat',
    opacity: typeof props.opacity === 'number' ? props.opacity : 1,
    fontFamily: props.fontFamily || 'Inter, system-ui, sans-serif',
    fontSize: props.fontSize ? `${Number(props.fontSize)}px` : undefined,
  };
}

function BlockImage({ props }) {
  if (!props?.imageUrl) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <img
        src={props.imageUrl}
        alt="block visual"
        style={{
          width: '100%',
          maxHeight: Number(props.imageMaxHeight || 360),
          objectFit: props.imageFit || 'cover',
          borderRadius: Number(props.imageBorderRadius || 12),
          opacity: typeof props.imageOpacity === 'number' ? props.imageOpacity : 1,
        }}
      />
    </div>
  );
}

function BlockShell({ children, background, textColor, name, props }) {
  const { connect, drag, selected } = useBlockSelection();
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{
        padding: `${Number(props?.paddingY || 72)}px ${Number(props?.paddingX || 28)}px`,
        borderRadius: Number(props?.borderRadius || 14),
        border: selected ? '2px solid #1677ff' : '1px solid #dbe5f4',
        ...blockContainerStyles({ ...props, background }),
        color: textColor || '#111827',
        marginBottom: 12,
        position: 'relative',
        boxShadow: selected ? '0 8px 22px rgba(22, 119, 255, 0.18)' : '0 4px 14px rgba(15, 23, 42, 0.04)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ position: 'absolute', left: 12, top: 10, zIndex: 5 }}>
        <Tag color={selected ? 'blue' : 'default'}>{name}</Tag>
      </div>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <BlockImage props={props} />
        {children}
      </div>
    </div>
  );
}

function CanvasRoot(props) {
  const { children, background, title, description, titleColor } = props;
  const locale = useContext(LandingLocaleContext);
  const { connectors: { connect } } = useNode();
  return (
    <div
      ref={connect}
      style={{
        minHeight: 700,
        background: background || '#f8fafc',
        backgroundImage: props.backgroundImageUrl ? `url(${props.backgroundImageUrl})` : 'none',
        backgroundSize: props.backgroundSize || 'cover',
        backgroundPosition: props.backgroundPosition || 'center',
        backgroundRepeat: props.backgroundRepeat || 'no-repeat',
        padding: 14,
        borderRadius: 18,
        border: '1px solid #dbe5f4',
      }}
    >
      <div
        style={{
          padding: 20,
          marginBottom: 14,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
          border: '1px solid #dbe5f4',
          borderRadius: 14,
        }}
      >
        <Title level={4} style={{ margin: 0, color: titleColor || '#111827' }}>
          {textByLocale(props, 'title', locale, title || 'Landing Page')}
        </Title>
        <Text type="secondary">
          {textByLocale(props, 'description', locale, description || 'Добавьте описание лендинга')}
        </Text>
      </div>
      {children}
    </div>
  );
}
CanvasRoot.craft = { displayName: 'CanvasRoot' };

function HeroBlock(props) {
  const { title, subtitle, buttonText, background, textColor } = props;
  const locale = useContext(LandingLocaleContext);
  return (
    <BlockShell background={background} textColor={textColor} name="Hero" props={props}>
      <Title level={2} style={{ margin: 0, color: textColor || '#111827' }}>
        {textByLocale(props, 'title', locale, title || '')}
      </Title>
      <Text>{textByLocale(props, 'subtitle', locale, subtitle || '')}</Text>
      <div style={{ marginTop: 12 }}>
        <Button type="primary">{textByLocale(props, 'buttonText', locale, buttonText || 'CTA')}</Button>
      </div>
    </BlockShell>
  );
}
HeroBlock.craft = { displayName: 'HeroBlock' };

function TextBlock(props) {
  const { title, body, background, textColor } = props;
  const locale = useContext(LandingLocaleContext);
  return (
    <BlockShell background={background} textColor={textColor} name="Text" props={props}>
      <Title level={4} style={{ margin: 0, color: textColor || '#111827' }}>
        {textByLocale(props, 'title', locale, title || '')}
      </Title>
      <Text>{textByLocale(props, 'body', locale, body || '')}</Text>
    </BlockShell>
  );
}
TextBlock.craft = { displayName: 'TextBlock' };

function FeaturesBlock(props) {
  const { title, items, background, textColor } = props;
  const locale = useContext(LandingLocaleContext);
  const features = Array.isArray(items) ? items : [];
  return (
    <BlockShell background={background} textColor={textColor} name="Features" props={props}>
      <Title level={4} style={{ margin: 0, color: textColor || '#111827' }}>
        {textByLocale(props, 'title', locale, title || '')}
      </Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        {features.map((item, idx) => (
          <Card key={`feature-${idx}`} size="small" styles={{ body: { padding: 10 } }}>
            {item}
          </Card>
        ))}
      </Space>
    </BlockShell>
  );
}
FeaturesBlock.craft = { displayName: 'FeaturesBlock' };

function CtaBlock(props) {
  const { title, body, buttonText, background, textColor } = props;
  const locale = useContext(LandingLocaleContext);
  return (
    <BlockShell background={background} textColor={textColor} name="CTA" props={props}>
      <Title level={4} style={{ margin: 0, color: textColor || '#111827' }}>
        {textByLocale(props, 'title', locale, title || '')}
      </Title>
      <Text>{textByLocale(props, 'body', locale, body || '')}</Text>
      <div style={{ marginTop: 12 }}>
        <Button type="primary">{textByLocale(props, 'buttonText', locale, buttonText || 'CTA')}</Button>
      </div>
    </BlockShell>
  );
}
CtaBlock.craft = { displayName: 'CtaBlock' };

function FormBlock(props) {
  const { title, subtitle, fields, buttonText, background, textColor } = props;
  const locale = useContext(LandingLocaleContext);
  const formFields = Array.isArray(fields) ? fields : [];
  return (
    <BlockShell background={background} textColor={textColor} name="Form" props={props}>
      <Title level={4} style={{ margin: 0, color: textColor || '#111827' }}>
        {textByLocale(props, 'title', locale, title || '')}
      </Title>
      <Text>{textByLocale(props, 'subtitle', locale, subtitle || '')}</Text>
      <Space direction="vertical" style={{ width: '100%', marginTop: 10 }}>
        {formFields.map((field) => (
          <Input key={field.key} placeholder={textByLocale(field, 'label', locale, field.label || '')} disabled />
        ))}
      </Space>
      <div style={{ marginTop: 12 }}>
        <Button type="primary">{textByLocale(props, 'buttonText', locale, buttonText || 'Отправить')}</Button>
      </div>
    </BlockShell>
  );
}
FormBlock.craft = { displayName: 'FormBlock' };

function CarouselBlock(props) {
  const { title, images, background, textColor } = props;
  const locale = useContext(LandingLocaleContext);
  const items = Array.isArray(images) ? images.filter(Boolean) : [];
  return (
    <BlockShell background={background} textColor={textColor} name="Carousel" props={props}>
      <Title level={4} style={{ margin: 0, color: textColor || '#111827' }}>
        {textByLocale(props, 'title', locale, title || '')}
      </Title>
      <div style={{ marginTop: 14 }}>
        {items.length > 0 ? (
          <Carousel autoplay dots>
            {items.map((url, idx) => (
              <div key={`carousel-${idx}`}>
                <img
                  src={url}
                  alt={`slide-${idx + 1}`}
                  style={{
                    width: '100%',
                    height: Number(props.slideHeight || 340),
                    objectFit: props.imageFit || 'cover',
                    borderRadius: Number(props.imageBorderRadius || 12),
                  }}
                />
              </div>
            ))}
          </Carousel>
        ) : (
          <Text type="secondary">Добавьте изображения для карусели</Text>
        )}
      </div>
    </BlockShell>
  );
}
CarouselBlock.craft = { displayName: 'CarouselBlock' };

function defaultCraftObject() {
  const heroId = uid('hero');
  const featuresId = uid('features');
  const formId = uid('form');
  const formBlockId = `form-${formId}`;

  return {
    ROOT: {
      type: { resolvedName: 'CanvasRoot' },
      isCanvas: true,
      props: {
        background: DEFAULT_THEME.background,
        title: 'Landing Page',
        title_i18n: ensureI18nObject('Landing Page'),
        description: 'Визуальный лендинг как в Tilda',
        description_i18n: ensureI18nObject('Визуальный лендинг как в Tilda'),
        titleColor: DEFAULT_THEME.text,
      },
      displayName: 'CanvasRoot',
      custom: {},
      hidden: false,
      nodes: [heroId, featuresId, formId],
      linkedNodes: {},
    },
    [heroId]: {
      type: { resolvedName: 'HeroBlock' },
      isCanvas: false,
      props: {
        title: 'Большой заголовок оффера',
        title_i18n: ensureI18nObject('Большой заголовок оффера'),
        subtitle: 'Короткое пояснение ценности и преимуществ',
        subtitle_i18n: ensureI18nObject('Короткое пояснение ценности и преимуществ'),
        buttonText: 'Оставить заявку',
        buttonText_i18n: ensureI18nObject('Оставить заявку'),
        background: '#ffffff',
        textColor: '#111827',
      },
      displayName: 'HeroBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [featuresId]: {
      type: { resolvedName: 'FeaturesBlock' },
      isCanvas: false,
      props: {
        title: 'Преимущества',
        title_i18n: ensureI18nObject('Преимущества'),
        items: ['Быстрый старт', 'Сквозная аналитика', 'Поддержка 24/7'],
        background: '#ffffff',
        textColor: '#111827',
      },
      displayName: 'FeaturesBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [formId]: {
      type: { resolvedName: 'FormBlock' },
      isCanvas: false,
      props: {
        title: 'Форма заявки',
        title_i18n: ensureI18nObject('Форма заявки'),
        subtitle: 'Оставьте контакты, менеджер свяжется с вами.',
        subtitle_i18n: ensureI18nObject('Оставьте контакты, менеджер свяжется с вами.'),
        buttonText: 'Отправить',
        buttonText_i18n: ensureI18nObject('Отправить'),
        background: '#ffffff',
        textColor: '#111827',
        blockId: formBlockId,
        formKey: 'lead_main',
        fields: [
          { key: 'name', label: 'Имя', label_i18n: ensureI18nObject('Имя'), type: 'text', required: true },
          { key: 'phone', label: 'Телефон', label_i18n: ensureI18nObject('Телефон'), type: 'tel', required: true },
          { key: 'email', label: 'Email', label_i18n: ensureI18nObject('Email'), type: 'email', required: false },
        ],
        lead_source: null,
        stage_on_deal_create: null,
        create_deal: false,
        owner_strategy: 'inherit',
        fixed_owner: null,
        assignment_queue: null,
        sla_minutes: 15,
        dedup_window_minutes: 120,
        active: true,
      },
      displayName: 'FormBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
  };
}

function defaultCrmSalesCraftObject() {
  const heroId = uid('hero');
  const introId = uid('text');
  const valueId = uid('features');
  const roleId = uid('features');
  const carouselId = uid('carousel');
  const pricingId = uid('features');
  const faqId = uid('features');
  const ctaId = uid('cta');
  const formId = uid('form');
  const formBlockId = `form-${formId}`;

  return {
    ROOT: {
      type: { resolvedName: 'CanvasRoot' },
      isCanvas: true,
      props: {
        background: '#f1f7ff',
        title: 'Enterprise CRM Sales Landing',
        title_i18n: ensureI18nObject('Enterprise CRM Sales Landing'),
        description: 'Готовый продающий шаблон CRM: оффер, ценность, кейсы, тарифы, FAQ и лид-форма.',
        description_i18n: ensureI18nObject('Готовый продающий шаблон CRM: оффер, ценность, кейсы, тарифы, FAQ и лид-форма.'),
        titleColor: '#111827',
      },
      displayName: 'CanvasRoot',
      custom: {},
      hidden: false,
      nodes: [heroId, introId, valueId, roleId, carouselId, pricingId, faqId, ctaId, formId],
      linkedNodes: {},
    },
    [heroId]: {
      type: { resolvedName: 'HeroBlock' },
      isCanvas: false,
      props: {
        title: 'Превратите хаос продаж в управляемую систему роста',
        title_i18n: ensureI18nObject('Превратите хаос продаж в управляемую систему роста'),
        subtitle: 'Enterprise CRM объединяет лиды, сделки, задачи, коммуникации и аналитику в одной платформе.',
        subtitle_i18n: ensureI18nObject('Enterprise CRM объединяет лиды, сделки, задачи, коммуникации и аналитику в одной платформе.'),
        buttonText: 'Получить персональное демо',
        buttonText_i18n: ensureI18nObject('Получить персональное демо'),
        background: '#0f2748',
        textColor: '#ffffff',
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        fontSize: 18,
        paddingY: 84,
        borderRadius: 20,
      },
      displayName: 'HeroBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [introId]: {
      type: { resolvedName: 'TextBlock' },
      isCanvas: false,
      props: {
        title: 'Почему Enterprise CRM работает',
        title_i18n: ensureI18nObject('Почему Enterprise CRM работает'),
        body: 'Вы получаете контроль над воронкой, прозрачные метрики и автоматизацию рутины. Менеджеры продают больше, а руководители видят причины роста и просадок в реальном времени.',
        body_i18n: ensureI18nObject('Вы получаете контроль над воронкой, прозрачные метрики и автоматизацию рутины. Менеджеры продают больше, а руководители видят причины роста и просадок в реальном времени.'),
        background: '#ffffff',
        textColor: '#111827',
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        fontSize: 17,
        borderRadius: 18,
      },
      displayName: 'TextBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [valueId]: {
      type: { resolvedName: 'FeaturesBlock' },
      isCanvas: false,
      props: {
        title: 'Ценности для бизнеса',
        title_i18n: ensureI18nObject('Ценности для бизнеса'),
        items: [
          'Единая платформа вместо набора разрозненных сервисов',
          'Автоматизация этапов и задач без ручного контроля',
          'Сквозная аналитика по каналам, менеджерам и этапам',
          'Быстрый запуск и понятное масштабирование команды',
        ],
        background: '#ffffff',
        textColor: '#111827',
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        fontSize: 16,
        borderRadius: 18,
      },
      displayName: 'FeaturesBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [roleId]: {
      type: { resolvedName: 'FeaturesBlock' },
      isCanvas: false,
      props: {
        title: 'Польза по ролям',
        title_i18n: ensureI18nObject('Польза по ролям'),
        items: [
          'Собственник: прогноз выручки и контроль воронки без Excel',
          'РОП: рост конверсии, дисциплина и контроль SLA команды',
          'Менеджер: меньше рутины, больше времени на продажи',
        ],
        background: '#ffffff',
        textColor: '#111827',
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        fontSize: 16,
        borderRadius: 18,
      },
      displayName: 'FeaturesBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [carouselId]: {
      type: { resolvedName: 'CarouselBlock' },
      isCanvas: false,
      props: {
        title: 'CRM в действии',
        title_i18n: ensureI18nObject('CRM в действии'),
        images: [
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
          'https://picsum.photos/seed/crm-hero/1400/800',
          'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
        ],
        background: '#ffffff',
        textColor: '#111827',
        slideHeight: 360,
        imageFit: 'cover',
        imageBorderRadius: 14,
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        borderRadius: 18,
      },
      displayName: 'CarouselBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [pricingId]: {
      type: { resolvedName: 'FeaturesBlock' },
      isCanvas: false,
      props: {
        title: 'Тарифы',
        title_i18n: ensureI18nObject('Тарифы'),
        items: [
          'Start: $19/user/mo — лиды, сделки, задачи, базовая аналитика',
          'Growth: $39/user/mo — автоматизация, расширенная аналитика, API',
          'Enterprise: custom — безопасность, SLA, кастомные роли и отчеты',
        ],
        background: '#ffffff',
        textColor: '#111827',
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        borderRadius: 18,
      },
      displayName: 'FeaturesBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [faqId]: {
      type: { resolvedName: 'FeaturesBlock' },
      isCanvas: false,
      props: {
        title: 'FAQ',
        title_i18n: ensureI18nObject('FAQ'),
        items: [
          'Внедрение: базовый запуск 1-3 дня, полный цикл 2-4 недели',
          'Миграция: переносим данные из Excel и других CRM',
          'Интеграции: телефония, мессенджеры, email, API и webhooks',
          'ROI: первые эффекты обычно видны в первые 2-3 недели',
        ],
        background: '#ffffff',
        textColor: '#111827',
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        borderRadius: 18,
      },
      displayName: 'FeaturesBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [ctaId]: {
      type: { resolvedName: 'CtaBlock' },
      isCanvas: false,
      props: {
        title: 'Готовы увеличить продажи без лишних затрат?',
        title_i18n: ensureI18nObject('Готовы увеличить продажи без лишних затрат?'),
        body: 'Оставьте заявку, и мы покажем персональный план внедрения CRM под ваш отдел продаж.',
        body_i18n: ensureI18nObject('Оставьте заявку, и мы покажем персональный план внедрения CRM под ваш отдел продаж.'),
        buttonText: 'Получить план внедрения',
        buttonText_i18n: ensureI18nObject('Получить план внедрения'),
        background: '#0b1e3b',
        textColor: '#ffffff',
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        borderRadius: 18,
      },
      displayName: 'CtaBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    [formId]: {
      type: { resolvedName: 'FormBlock' },
      isCanvas: false,
      props: {
        title: 'Запросить демо и расчёт ROI',
        title_i18n: ensureI18nObject('Запросить демо и расчёт ROI'),
        subtitle: 'Ответим в течение 15 минут в рабочее время.',
        subtitle_i18n: ensureI18nObject('Ответим в течение 15 минут в рабочее время.'),
        buttonText: 'Получить демо',
        buttonText_i18n: ensureI18nObject('Получить демо'),
        background: '#ffffff',
        textColor: '#111827',
        fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        borderRadius: 18,
        blockId: formBlockId,
        formKey: 'crm_sales_demo',
        fields: [
          { key: 'name', label: 'Имя', label_i18n: ensureI18nObject('Имя'), type: 'text', required: true },
          { key: 'phone', label: 'Телефон', label_i18n: ensureI18nObject('Телефон'), type: 'tel', required: true },
          { key: 'email', label: 'Рабочий email', label_i18n: ensureI18nObject('Рабочий email'), type: 'email', required: false },
          { key: 'company', label: 'Компания', label_i18n: ensureI18nObject('Компания'), type: 'text', required: false },
        ],
        lead_source: null,
        stage_on_deal_create: null,
        create_deal: true,
        owner_strategy: 'inherit',
        fixed_owner: null,
        assignment_queue: null,
        sla_minutes: 15,
        dedup_window_minutes: 120,
        active: true,
      },
      displayName: 'FormBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
  };
}

function rootFromCraft(craft) {
  return craft?.ROOT || { nodes: [] };
}

function extractSectionsFromCraft(craft) {
  const sections = [];
  const ordered = rootFromCraft(craft).nodes || [];

  ordered.forEach((id) => {
    const node = craft[id];
    if (!node) return;
    const type = node?.type?.resolvedName;
    const props = node?.props || {};

    if (type === 'HeroBlock') {
      sections.push({ id, type: 'hero', ...props });
    } else if (type === 'TextBlock') {
      sections.push({ id, type: 'text', ...props });
    } else if (type === 'FeaturesBlock') {
      sections.push({ id, type: 'features', ...props });
    } else if (type === 'CtaBlock') {
      sections.push({ id, type: 'cta', ...props });
    } else if (type === 'CarouselBlock') {
      sections.push({ id, type: 'carousel', ...props });
    } else if (type === 'FormBlock') {
      sections.push({
        id,
        type: 'form',
        ...props,
        block_id: props.blockId,
        form_key: props.formKey,
      });
    }
  });

  return sections;
}

function mapBindingsToCraft(craft, bindings, landing) {
  const result = cloneJson(craft);
  const mapping = {};

  (Array.isArray(bindings) ? bindings : []).forEach((binding) => {
    mapping[bindingKey(binding.block_id, binding.form_key)] = binding;
  });

  Object.entries(result).forEach(([, node]) => {
    if (node?.type?.resolvedName !== 'FormBlock') return;
    const props = node.props || {};
    const key = bindingKey(props.blockId, props.formKey);
    const binding = mapping[key];
    const defaults = defaultBindingConfig(landing);
    if (!binding) {
      node.props = {
        ...props,
        ...defaults,
      };
      return;
    }

    node.props = {
      ...props,
      lead_source: binding.lead_source ?? defaults.lead_source,
      stage_on_deal_create: binding.stage_on_deal_create ?? defaults.stage_on_deal_create,
      create_deal: Boolean(binding.create_deal),
      owner_strategy: binding.owner_strategy || defaults.owner_strategy,
      fixed_owner: binding.fixed_owner ?? defaults.fixed_owner,
      assignment_queue: binding.assignment_queue ?? defaults.assignment_queue,
      sla_minutes: Number(binding.sla_minutes || defaults.sla_minutes),
      dedup_window_minutes: Number(binding.dedup_window_minutes || defaults.dedup_window_minutes),
      active: binding.active !== false,
    };
  });

  return result;
}

function ensureCraftI18n(craft) {
  const result = cloneJson(craft || {});
  Object.entries(result).forEach(([nodeId, node]) => {
    if (!node || !node.props) return;
    const props = node.props;

    if (nodeId === 'ROOT') {
      props.title_i18n = ensureI18nObject(props.title_i18n || props.title || 'Landing Page');
      props.description_i18n = ensureI18nObject(props.description_i18n || props.description || '');
      return;
    }

    if (props.title !== undefined || props.title_i18n !== undefined) {
      props.title_i18n = ensureI18nObject(props.title_i18n || props.title || '');
    }
    if (props.subtitle !== undefined || props.subtitle_i18n !== undefined) {
      props.subtitle_i18n = ensureI18nObject(props.subtitle_i18n || props.subtitle || '');
    }
    if (props.body !== undefined || props.body_i18n !== undefined) {
      props.body_i18n = ensureI18nObject(props.body_i18n || props.body || '');
    }
    if (props.buttonText !== undefined || props.buttonText_i18n !== undefined) {
      props.buttonText_i18n = ensureI18nObject(props.buttonText_i18n || props.buttonText || '');
    }
    if (Array.isArray(props.fields)) {
      props.fields = props.fields.map((field) => ({
        ...field,
        label_i18n: ensureI18nObject(field.label_i18n || field.label || ''),
      }));
    }
  });
  return result;
}

function legacySectionsToCraft(schema) {
  const draft = defaultCraftObject();
  const nodes = [];

  const sections = Array.isArray(schema?.page?.sections) ? schema.page.sections : [];
  if (!sections.length) return draft;

  sections.forEach((section) => {
    const id = section.id || uid('section');
    const base = {
      isCanvas: false,
      displayName: 'TextBlock',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    };

    if (section.type === 'hero') {
      draft[id] = {
        ...base,
        type: { resolvedName: 'HeroBlock' },
        displayName: 'HeroBlock',
        props: {
          title: section.title || 'Hero',
          title_i18n: ensureI18nObject(section.title_i18n || section.title || 'Hero'),
          subtitle: section.subtitle || '',
          subtitle_i18n: ensureI18nObject(section.subtitle_i18n || section.subtitle || ''),
          buttonText: section.buttonText || 'CTA',
          buttonText_i18n: ensureI18nObject(section.buttonText_i18n || section.buttonText || 'CTA'),
          background: section.background || '#ffffff',
          textColor: section.textColor || '#111827',
          fontFamily: section.fontFamily || 'Inter, system-ui, sans-serif',
          fontSize: section.fontSize || undefined,
          opacity: section.opacity ?? 1,
          backgroundImageUrl: section.backgroundImageUrl || '',
          backgroundSize: section.backgroundSize || 'cover',
          backgroundPosition: section.backgroundPosition || 'center',
          backgroundRepeat: section.backgroundRepeat || 'no-repeat',
          imageUrl: section.imageUrl || '',
          imageMaxHeight: section.imageMaxHeight || 360,
          imageOpacity: section.imageOpacity ?? 1,
          imageFit: section.imageFit || 'cover',
          imageBorderRadius: section.imageBorderRadius || 12,
          paddingX: section.paddingX || 28,
          paddingY: section.paddingY || 72,
          borderRadius: section.borderRadius || 14,
        },
      };
    } else if (section.type === 'features') {
      draft[id] = {
        ...base,
        type: { resolvedName: 'FeaturesBlock' },
        displayName: 'FeaturesBlock',
        props: {
          title: section.title || 'Features',
          title_i18n: ensureI18nObject(section.title_i18n || section.title || 'Features'),
          items: Array.isArray(section.items) ? section.items : [],
          background: section.background || '#ffffff',
          textColor: section.textColor || '#111827',
          fontFamily: section.fontFamily || 'Inter, system-ui, sans-serif',
          fontSize: section.fontSize || undefined,
          opacity: section.opacity ?? 1,
          backgroundImageUrl: section.backgroundImageUrl || '',
          backgroundSize: section.backgroundSize || 'cover',
          backgroundPosition: section.backgroundPosition || 'center',
          backgroundRepeat: section.backgroundRepeat || 'no-repeat',
          imageUrl: section.imageUrl || '',
          imageMaxHeight: section.imageMaxHeight || 360,
          imageOpacity: section.imageOpacity ?? 1,
          imageFit: section.imageFit || 'cover',
          imageBorderRadius: section.imageBorderRadius || 12,
          paddingX: section.paddingX || 28,
          paddingY: section.paddingY || 72,
          borderRadius: section.borderRadius || 14,
        },
      };
    } else if (section.type === 'cta') {
      draft[id] = {
        ...base,
        type: { resolvedName: 'CtaBlock' },
        displayName: 'CtaBlock',
        props: {
          title: section.title || 'CTA',
          title_i18n: ensureI18nObject(section.title_i18n || section.title || 'CTA'),
          body: section.body || section.subtitle || '',
          body_i18n: ensureI18nObject(section.body_i18n || section.body || section.subtitle || ''),
          buttonText: section.buttonText || 'Связаться',
          buttonText_i18n: ensureI18nObject(section.buttonText_i18n || section.buttonText || 'Связаться'),
          background: section.background || '#ffffff',
          textColor: section.textColor || '#111827',
          fontFamily: section.fontFamily || 'Inter, system-ui, sans-serif',
          fontSize: section.fontSize || undefined,
          opacity: section.opacity ?? 1,
          backgroundImageUrl: section.backgroundImageUrl || '',
          backgroundSize: section.backgroundSize || 'cover',
          backgroundPosition: section.backgroundPosition || 'center',
          backgroundRepeat: section.backgroundRepeat || 'no-repeat',
          imageUrl: section.imageUrl || '',
          imageMaxHeight: section.imageMaxHeight || 360,
          imageOpacity: section.imageOpacity ?? 1,
          imageFit: section.imageFit || 'cover',
          imageBorderRadius: section.imageBorderRadius || 12,
          paddingX: section.paddingX || 28,
          paddingY: section.paddingY || 72,
          borderRadius: section.borderRadius || 14,
        },
      };
    } else if (section.type === 'carousel') {
      draft[id] = {
        ...base,
        type: { resolvedName: 'CarouselBlock' },
        displayName: 'CarouselBlock',
        props: {
          title: section.title || 'Carousel',
          title_i18n: ensureI18nObject(section.title_i18n || section.title || 'Carousel'),
          images: Array.isArray(section.images) ? section.images : [],
          background: section.background || '#ffffff',
          textColor: section.textColor || '#111827',
          slideHeight: section.slideHeight || 340,
          imageFit: section.imageFit || 'cover',
          imageBorderRadius: section.imageBorderRadius || 12,
          fontFamily: section.fontFamily || 'Inter, system-ui, sans-serif',
          fontSize: section.fontSize || undefined,
          opacity: section.opacity ?? 1,
          backgroundImageUrl: section.backgroundImageUrl || '',
          backgroundSize: section.backgroundSize || 'cover',
          backgroundPosition: section.backgroundPosition || 'center',
          backgroundRepeat: section.backgroundRepeat || 'no-repeat',
          imageUrl: section.imageUrl || '',
          imageMaxHeight: section.imageMaxHeight || 360,
          imageOpacity: section.imageOpacity ?? 1,
          paddingX: section.paddingX || 28,
          paddingY: section.paddingY || 72,
          borderRadius: section.borderRadius || 14,
        },
      };
    } else if (section.type === 'form') {
      draft[id] = {
        ...base,
        type: { resolvedName: 'FormBlock' },
        displayName: 'FormBlock',
        props: {
          title: section.title || 'Форма заявки',
          title_i18n: ensureI18nObject(section.title_i18n || section.title || 'Форма заявки'),
          subtitle: section.subtitle || '',
          subtitle_i18n: ensureI18nObject(section.subtitle_i18n || section.subtitle || ''),
          buttonText: section.buttonText || 'Отправить',
          buttonText_i18n: ensureI18nObject(section.buttonText_i18n || section.buttonText || 'Отправить'),
          background: section.background || '#ffffff',
          textColor: section.textColor || '#111827',
          blockId: section.blockId || section.block_id || `form-${id}`,
          formKey: section.formKey || section.form_key || 'lead_main',
          fontFamily: section.fontFamily || 'Inter, system-ui, sans-serif',
          fontSize: section.fontSize || undefined,
          opacity: section.opacity ?? 1,
          backgroundImageUrl: section.backgroundImageUrl || '',
          backgroundSize: section.backgroundSize || 'cover',
          backgroundPosition: section.backgroundPosition || 'center',
          backgroundRepeat: section.backgroundRepeat || 'no-repeat',
          imageUrl: section.imageUrl || '',
          imageMaxHeight: section.imageMaxHeight || 360,
          imageOpacity: section.imageOpacity ?? 1,
          imageFit: section.imageFit || 'cover',
          imageBorderRadius: section.imageBorderRadius || 12,
          paddingX: section.paddingX || 28,
          paddingY: section.paddingY || 72,
          borderRadius: section.borderRadius || 14,
          fields: Array.isArray(section.fields)
            ? section.fields.map((field) => ({
                ...field,
                label_i18n: ensureI18nObject(field.label_i18n || field.label || ''),
              }))
            : [
                { key: 'name', label: 'Имя', label_i18n: ensureI18nObject('Имя'), type: 'text', required: true },
                { key: 'phone', label: 'Телефон', label_i18n: ensureI18nObject('Телефон'), type: 'tel', required: true },
              ],
        },
      };
    } else {
      draft[id] = {
        ...base,
        type: { resolvedName: 'TextBlock' },
        displayName: 'TextBlock',
        props: {
          title: section.title || 'Text',
          title_i18n: ensureI18nObject(section.title_i18n || section.title || 'Text'),
          body: section.body || '',
          body_i18n: ensureI18nObject(section.body_i18n || section.body || ''),
          background: section.background || '#ffffff',
          textColor: section.textColor || '#111827',
          fontFamily: section.fontFamily || 'Inter, system-ui, sans-serif',
          fontSize: section.fontSize || undefined,
          opacity: section.opacity ?? 1,
          backgroundImageUrl: section.backgroundImageUrl || '',
          backgroundSize: section.backgroundSize || 'cover',
          backgroundPosition: section.backgroundPosition || 'center',
          backgroundRepeat: section.backgroundRepeat || 'no-repeat',
          imageUrl: section.imageUrl || '',
          imageMaxHeight: section.imageMaxHeight || 360,
          imageOpacity: section.imageOpacity ?? 1,
          imageFit: section.imageFit || 'cover',
          imageBorderRadius: section.imageBorderRadius || 12,
          paddingX: section.paddingX || 28,
          paddingY: section.paddingY || 72,
          borderRadius: section.borderRadius || 14,
        },
      };
    }

    nodes.push(id);
  });

  draft.ROOT = {
    ...draft.ROOT,
    nodes,
    props: {
      ...draft.ROOT.props,
      title: schema?.page?.meta?.title || 'Landing Page',
      title_i18n: ensureI18nObject(schema?.page?.meta?.title_i18n || schema?.page?.meta?.title || 'Landing Page'),
      description: schema?.page?.meta?.description || '',
      description_i18n: ensureI18nObject(schema?.page?.meta?.description_i18n || schema?.page?.meta?.description || ''),
      background: schema?.page?.theme?.background || DEFAULT_THEME.background,
      titleColor: schema?.page?.theme?.text || DEFAULT_THEME.text,
    },
  };

  return draft;
}

function schemaToCraftObject(schema, bindings, landing) {
  let craft;

  if (schema?.craft && schema.craft.ROOT) {
    craft = cloneJson(schema.craft);
  } else if (Array.isArray(schema?.page?.sections)) {
    craft = legacySectionsToCraft(schema);
  } else {
    craft = defaultCraftObject();
  }

  return ensureCraftI18n(mapBindingsToCraft(craft, bindings, landing));
}

function getSelectedId(selectedEvent) {
  if (!selectedEvent) return null;
  if (Array.isArray(selectedEvent)) return selectedEvent[0] || null;
  if (selectedEvent instanceof Set) return selectedEvent.values().next().value || null;
  return null;
}

function AddBlockToolbar() {
  const { query, actions } = useEditor();

  const addBlock = (type) => {
    if (type === 'HeroBlock') {
      const tree = query
        .parseReactElement(
          <HeroBlock
            title="Новый hero"
            title_i18n={ensureI18nObject('Новый hero')}
            subtitle="Опишите ваше предложение"
            subtitle_i18n={ensureI18nObject('Опишите ваше предложение')}
            buttonText="Оставить заявку"
            buttonText_i18n={ensureI18nObject('Оставить заявку')}
            background="#ffffff"
            textColor="#111827"
          />,
        )
        .toNodeTree();
      actions.addNodeTree(tree, 'ROOT');
      return;
    }

    if (type === 'TextBlock') {
      const tree = query
        .parseReactElement(
          <TextBlock
            title="Текстовый блок"
            title_i18n={ensureI18nObject('Текстовый блок')}
            body="Добавьте описание"
            body_i18n={ensureI18nObject('Добавьте описание')}
            background="#ffffff"
            textColor="#111827"
          />,
        )
        .toNodeTree();
      actions.addNodeTree(tree, 'ROOT');
      return;
    }

    if (type === 'FeaturesBlock') {
      const tree = query
        .parseReactElement(
          <FeaturesBlock
            title="Преимущества"
            title_i18n={ensureI18nObject('Преимущества')}
            items={['Преимущество 1', 'Преимущество 2']}
            background="#ffffff"
            textColor="#111827"
          />,
        )
        .toNodeTree();
      actions.addNodeTree(tree, 'ROOT');
      return;
    }

    if (type === 'CtaBlock') {
      const tree = query
        .parseReactElement(
          <CtaBlock
            title="CTA блок"
            title_i18n={ensureI18nObject('CTA блок')}
            body="Призыв к действию"
            body_i18n={ensureI18nObject('Призыв к действию')}
            buttonText="Связаться"
            buttonText_i18n={ensureI18nObject('Связаться')}
            background="#ffffff"
            textColor="#111827"
          />,
        )
        .toNodeTree();
      actions.addNodeTree(tree, 'ROOT');
      return;
    }

    if (type === 'CarouselBlock') {
      const tree = query
        .parseReactElement(
          <CarouselBlock
            title="Карусель изображений"
            title_i18n={ensureI18nObject('Карусель изображений')}
            images={[
              'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
              'https://picsum.photos/seed/crm-dashboard/1400/800',
            ]}
            background="#ffffff"
            textColor="#111827"
            slideHeight={340}
            imageFit="cover"
            imageBorderRadius={12}
          />,
        )
        .toNodeTree();
      actions.addNodeTree(tree, 'ROOT');
      return;
    }

    const id = uid('form');
    const tree = query
      .parseReactElement(
        <FormBlock
          title="Форма"
          title_i18n={ensureI18nObject('Форма')}
          subtitle="Оставьте контакты"
          subtitle_i18n={ensureI18nObject('Оставьте контакты')}
          buttonText="Отправить"
          buttonText_i18n={ensureI18nObject('Отправить')}
          background="#ffffff"
          textColor="#111827"
          blockId={`form-${id}`}
          formKey="lead_main"
          fields={[
            { key: 'name', label: 'Имя', label_i18n: ensureI18nObject('Имя'), type: 'text', required: true },
            { key: 'phone', label: 'Телефон', label_i18n: ensureI18nObject('Телефон'), type: 'tel', required: true },
          ]}
          lead_source={null}
          stage_on_deal_create={null}
          create_deal={false}
          owner_strategy="inherit"
          fixed_owner={null}
          assignment_queue={null}
          sla_minutes={15}
          dedup_window_minutes={120}
          active
        />,
      )
      .toNodeTree();
    actions.addNodeTree(tree, 'ROOT');
  };

  const addPromoTemplate = () => {
    addBlock('HeroBlock');
    addBlock('FeaturesBlock');
    addBlock('CtaBlock');
    addBlock('FormBlock');
  };

  return (
    <Space wrap>
      <Button size="small" onClick={() => addBlock('HeroBlock')}>+ Cover</Button>
      <Button size="small" onClick={() => addBlock('TextBlock')}>+ Text</Button>
      <Button size="small" onClick={() => addBlock('FeaturesBlock')}>+ Cards</Button>
      <Button size="small" onClick={() => addBlock('CtaBlock')}>+ CTA</Button>
      <Button size="small" onClick={() => addBlock('FormBlock')}>+ Form</Button>
      <Button size="small" onClick={() => addBlock('CarouselBlock')}>+ Carousel</Button>
      <Button size="small" type="dashed" onClick={addPromoTemplate}>+ Template Promo</Button>
    </Space>
  );
}

function HistoryToolbar() {
  const { actions, canUndo, canRedo } = useEditor((state) => ({
    canUndo: state.options.enabled && state.events?.history?.canUndo,
    canRedo: state.options.enabled && state.events?.history?.canRedo,
  }));

  return (
    <Space size="small">
      <Button size="small" onClick={() => actions.history.undo()} disabled={!canUndo}>Undo</Button>
      <Button size="small" onClick={() => actions.history.redo()} disabled={!canRedo}>Redo</Button>
    </Space>
  );
}

function LayersPanel() {
  const { query, actions, rootNodes, selectedId } = useEditor((state) => ({
    rootNodes: state.nodes?.ROOT?.data?.nodes || [],
    selectedId: getSelectedId(state.events?.selected),
  }));

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {rootNodes.map((nodeId, index) => {
        const node = query.node(nodeId).get()?.data;
        return (
          <Card
            key={nodeId}
            size="small"
            style={{ borderColor: selectedId === nodeId ? '#1677ff' : undefined, cursor: 'pointer' }}
            onClick={() => actions.selectNode(nodeId)}
          >
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text strong>{getNodeLabel(node)}</Text>
                <Tag>{node?.type?.resolvedName || 'Block'}</Tag>
              </Space>
              <Space>
                <Button size="small" disabled={index === 0} onClick={() => actions.move(nodeId, 'ROOT', index - 1)}>
                  Up
                </Button>
                <Button
                  size="small"
                  disabled={index === rootNodes.length - 1}
                  onClick={() => actions.move(nodeId, 'ROOT', index + 1)}
                >
                  Down
                </Button>
                <Button danger size="small" onClick={() => actions.delete(nodeId)}>Delete</Button>
              </Space>
            </Space>
          </Card>
        );
      })}
    </Space>
  );
}

function NodePropertiesPanel({ lookups, activeLocale, selectedLandingId }) {
  const { message } = App.useApp();
  const { query, actions, selectedId } = useEditor((state) => ({
    selectedId: getSelectedId(state.events?.selected),
  }));

  if (!selectedId) {
    return <Text type="secondary">Выберите блок на канвасе или в списке слева</Text>;
  }

  const node = query.node(selectedId).get()?.data;
  const type = node?.type?.resolvedName || node?.displayName || '';
  const props = node?.props || {};
  const isCanvasRoot = type === 'CanvasRoot' || selectedId === 'ROOT';
  const canEditTitle = props.title !== undefined || props.title_i18n !== undefined;
  const canEditBody = props.body !== undefined || props.body_i18n !== undefined;
  const canEditSubtitle = props.subtitle !== undefined || props.subtitle_i18n !== undefined;
  const canEditButton = props.buttonText !== undefined || props.buttonText_i18n !== undefined;
  const canEditFeatures = Array.isArray(props.items);
  const canEditCarousel = type === 'CarouselBlock' || Array.isArray(props.images);
  const canEditForm = Array.isArray(props.fields) || props.blockId !== undefined || props.formKey !== undefined;

  const setProp = (key, value) => {
    actions.setProp(selectedId, (draft) => {
      draft[key] = value;
    });
  };

  const setI18nProp = (key, value) => {
    const currentMap = ensureI18nObject(props?.[`${key}_i18n`], props?.[key] || '');
    setProp(`${key}_i18n`, { ...currentMap, [activeLocale]: value });
    setProp(key, value);
  };

  const setFeatureItem = (idx, value) => {
    const next = Array.isArray(props.items) ? [...props.items] : [];
    next[idx] = value;
    setProp('items', next);
  };

  const removeFeatureItem = (idx) => {
    const next = (Array.isArray(props.items) ? props.items : []).filter((_, i) => i !== idx);
    setProp('items', next);
  };

  const setFieldItem = (idx, patch) => {
    const next = Array.isArray(props.fields) ? [...props.fields] : [];
    next[idx] = {
      ...next[idx],
      ...patch,
    };
    setProp('fields', next);
  };

  const removeFieldItem = (idx) => {
    const next = (Array.isArray(props.fields) ? props.fields : []).filter((_, i) => i !== idx);
    setProp('fields', next);
  };

  const setCarouselImage = (idx, value) => {
    const next = Array.isArray(props.images) ? [...props.images] : [];
    next[idx] = value;
    setProp('images', next);
  };

  const removeCarouselImage = (idx) => {
    const next = (Array.isArray(props.images) ? props.images : []).filter((_, i) => i !== idx);
    setProp('images', next);
  };

  const uploadImageAndSet = async (file, onSuccess) => {
    if (!selectedLandingId) {
      message.error('Сначала выберите лендинг');
      return false;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await landingsApi.uploadAsset(selectedLandingId, formData);
      const uploadedUrl = response?.url || '';
      if (!uploadedUrl) {
        message.error('Не удалось получить URL загруженного файла');
        return false;
      }
      onSuccess(uploadedUrl);
      message.success('Изображение загружено');
    } catch (err) {
      message.error(err?.details?.detail || err?.message || 'Ошибка загрузки файла');
    }
    return false;
  };

  return (
    <Form layout="vertical">
      {isCanvasRoot && (
        <>
          <Form.Item label="Page title">
            <Input
              value={textByLocale(props, 'title', activeLocale, props.title || '')}
              onChange={(e) => setI18nProp('title', e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Page description">
            <Input.TextArea
              rows={3}
              value={textByLocale(props, 'description', activeLocale, props.description || '')}
              onChange={(e) => setI18nProp('description', e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Background color">
            <Input type="color" value={props.background || DEFAULT_THEME.background} onChange={(e) => setProp('background', e.target.value)} style={{ width: 72, padding: 4 }} />
          </Form.Item>
          <Form.Item label="Title color">
            <Input type="color" value={props.titleColor || DEFAULT_THEME.text} onChange={(e) => setProp('titleColor', e.target.value)} style={{ width: 72, padding: 4 }} />
          </Form.Item>
          <Form.Item label="Background image URL">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="https://..."
                value={props.backgroundImageUrl || ''}
                onChange={(e) => setProp('backgroundImageUrl', e.target.value)}
              />
              <Upload
                showUploadList={false}
                accept="image/*"
                beforeUpload={(file) => uploadImageAndSet(file, (url) => setProp('backgroundImageUrl', url))}
              >
                <Button>Upload</Button>
              </Upload>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="Background size">
            <Select
              value={props.backgroundSize || 'cover'}
              onChange={(value) => setProp('backgroundSize', value)}
              options={[
                { value: 'cover', label: 'cover' },
                { value: 'contain', label: 'contain' },
                { value: 'auto', label: 'auto' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Background position">
            <Select
              value={props.backgroundPosition || 'center'}
              onChange={(value) => setProp('backgroundPosition', value)}
              options={[
                { value: 'center', label: 'center' },
                { value: 'top', label: 'top' },
                { value: 'bottom', label: 'bottom' },
                { value: 'left', label: 'left' },
                { value: 'right', label: 'right' },
                { value: 'top left', label: 'top left' },
                { value: 'top right', label: 'top right' },
                { value: 'bottom left', label: 'bottom left' },
                { value: 'bottom right', label: 'bottom right' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Background repeat">
            <Select
              value={props.backgroundRepeat || 'no-repeat'}
              onChange={(value) => setProp('backgroundRepeat', value)}
              options={[
                { value: 'no-repeat', label: 'no-repeat' },
                { value: 'repeat', label: 'repeat' },
                { value: 'repeat-x', label: 'repeat-x' },
                { value: 'repeat-y', label: 'repeat-y' },
              ]}
            />
          </Form.Item>
        </>
      )}

      {!isCanvasRoot && (
        <>
          <Form.Item label="Background color">
            <Input type="color" value={props.background || '#ffffff'} onChange={(e) => setProp('background', e.target.value)} style={{ width: 72, padding: 4 }} />
          </Form.Item>
          <Form.Item label="Text color">
            <Input type="color" value={props.textColor || '#111827'} onChange={(e) => setProp('textColor', e.target.value)} style={{ width: 72, padding: 4 }} />
          </Form.Item>
          <Form.Item label="Font family">
            <Select
              value={props.fontFamily || 'Inter, system-ui, sans-serif'}
              options={FONT_OPTIONS}
              onChange={(value) => setProp('fontFamily', value)}
            />
          </Form.Item>
          <Form.Item label="Font size (px)">
            <InputNumber
              min={10}
              max={72}
              value={props.fontSize || 16}
              onChange={(value) => setProp('fontSize', Number(value || 16))}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Opacity">
            <InputNumber
              min={0}
              max={1}
              step={0.05}
              value={typeof props.opacity === 'number' ? props.opacity : 1}
              onChange={(value) => setProp('opacity', Number(value ?? 1))}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Padding X (px)">
            <InputNumber min={0} max={220} value={Number(props.paddingX || 28)} onChange={(value) => setProp('paddingX', Number(value || 0))} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Padding Y (px)">
            <InputNumber min={0} max={260} value={Number(props.paddingY || 72)} onChange={(value) => setProp('paddingY', Number(value || 0))} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Border radius (px)">
            <InputNumber min={0} max={80} value={Number(props.borderRadius || 14)} onChange={(value) => setProp('borderRadius', Number(value || 0))} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Background image URL">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="https://..."
                value={props.backgroundImageUrl || ''}
                onChange={(e) => setProp('backgroundImageUrl', e.target.value)}
              />
              <Upload
                showUploadList={false}
                accept="image/*"
                beforeUpload={(file) => uploadImageAndSet(file, (url) => setProp('backgroundImageUrl', url))}
              >
                <Button>Upload</Button>
              </Upload>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="Background size">
            <Select
              value={props.backgroundSize || 'cover'}
              onChange={(value) => setProp('backgroundSize', value)}
              options={[
                { value: 'cover', label: 'cover' },
                { value: 'contain', label: 'contain' },
                { value: 'auto', label: 'auto' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Background position">
            <Select
              value={props.backgroundPosition || 'center'}
              onChange={(value) => setProp('backgroundPosition', value)}
              options={[
                { value: 'center', label: 'center' },
                { value: 'top', label: 'top' },
                { value: 'bottom', label: 'bottom' },
                { value: 'left', label: 'left' },
                { value: 'right', label: 'right' },
                { value: 'top left', label: 'top left' },
                { value: 'top right', label: 'top right' },
                { value: 'bottom left', label: 'bottom left' },
                { value: 'bottom right', label: 'bottom right' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Background repeat">
            <Select
              value={props.backgroundRepeat || 'no-repeat'}
              onChange={(value) => setProp('backgroundRepeat', value)}
              options={[
                { value: 'no-repeat', label: 'no-repeat' },
                { value: 'repeat', label: 'repeat' },
                { value: 'repeat-x', label: 'repeat-x' },
                { value: 'repeat-y', label: 'repeat-y' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Block image URL">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="https://..."
                value={props.imageUrl || ''}
                onChange={(e) => setProp('imageUrl', e.target.value)}
              />
              <Upload
                showUploadList={false}
                accept="image/*"
                beforeUpload={(file) => uploadImageAndSet(file, (url) => setProp('imageUrl', url))}
              >
                <Button>Upload</Button>
              </Upload>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="Image fit">
            <Select
              value={props.imageFit || 'cover'}
              onChange={(value) => setProp('imageFit', value)}
              options={[
                { value: 'cover', label: 'cover' },
                { value: 'contain', label: 'contain' },
                { value: 'fill', label: 'fill' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Image max height (px)">
            <InputNumber min={80} max={1200} value={Number(props.imageMaxHeight || 360)} onChange={(value) => setProp('imageMaxHeight', Number(value || 360))} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Image opacity">
            <InputNumber
              min={0}
              max={1}
              step={0.05}
              value={typeof props.imageOpacity === 'number' ? props.imageOpacity : 1}
              onChange={(value) => setProp('imageOpacity', Number(value ?? 1))}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Image border radius (px)">
            <InputNumber min={0} max={80} value={Number(props.imageBorderRadius || 12)} onChange={(value) => setProp('imageBorderRadius', Number(value || 0))} style={{ width: '100%' }} />
          </Form.Item>
        </>
      )}

      {canEditTitle && (
        <Form.Item label="Title">
          <Input
            value={textByLocale(props, 'title', activeLocale, props.title || '')}
            onChange={(e) => setI18nProp('title', e.target.value)}
          />
        </Form.Item>
      )}

      {(canEditSubtitle || canEditBody) && (
        <Form.Item label="Subtitle / body">
          <Input.TextArea
            rows={3}
            value={
              canEditBody && !canEditSubtitle
                ? textByLocale(props, 'body', activeLocale, props.body || '')
                : textByLocale(props, 'subtitle', activeLocale, props.subtitle || '')
            }
            onChange={(e) => {
              if (canEditBody && !canEditSubtitle) {
                setI18nProp('body', e.target.value);
              } else {
                setI18nProp('subtitle', e.target.value);
              }
            }}
          />
        </Form.Item>
      )}

      {canEditBody && canEditSubtitle && (
        <Form.Item label="Body">
          <Input.TextArea
            rows={4}
            value={textByLocale(props, 'body', activeLocale, props.body || '')}
            onChange={(e) => setI18nProp('body', e.target.value)}
          />
        </Form.Item>
      )}

      {canEditButton && (
        <Form.Item label="Button text">
          <Input
            value={textByLocale(props, 'buttonText', activeLocale, props.buttonText || '')}
            onChange={(e) => setI18nProp('buttonText', e.target.value)}
          />
        </Form.Item>
      )}

      {canEditFeatures && (
        <>
          <Text strong>Feature items</Text>
          <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
            {(Array.isArray(props.items) ? props.items : []).map((item, idx) => (
              <Space key={`feature-${idx}`} align="start" style={{ width: '100%' }}>
                <Input value={item} onChange={(e) => setFeatureItem(idx, e.target.value)} />
                <Button danger onClick={() => removeFeatureItem(idx)}>Remove</Button>
              </Space>
            ))}
            <Button onClick={() => setProp('items', [...(Array.isArray(props.items) ? props.items : []), 'Новый пункт'])}>
              + Add item
            </Button>
          </Space>
        </>
      )}

      {canEditCarousel && (
        <>
          <Form.Item label="Slide height (px)">
            <InputNumber
              min={120}
              max={1000}
              value={Number(props.slideHeight || 340)}
              onChange={(value) => setProp('slideHeight', Number(value || 340))}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Text strong>Carousel images</Text>
          <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
            {(Array.isArray(props.images) ? props.images : []).map((image, idx) => (
              <Space key={`carousel-image-${idx}`} align="start" style={{ width: '100%' }}>
                <Input
                  value={image}
                  placeholder="https://..."
                  onChange={(e) => setCarouselImage(idx, e.target.value)}
                />
                <Upload
                  showUploadList={false}
                  accept="image/*"
                  beforeUpload={(file) => uploadImageAndSet(file, (url) => setCarouselImage(idx, url))}
                >
                  <Button>Upload</Button>
                </Upload>
                <Button danger onClick={() => removeCarouselImage(idx)}>Remove</Button>
              </Space>
            ))}
            <Button onClick={() => setProp('images', [...(Array.isArray(props.images) ? props.images : []), ''])}>
              + Add image
            </Button>
          </Space>
        </>
      )}

      {canEditForm && (
        <>
          <Form.Item label="Block ID" style={{ marginTop: 12 }}>
            <Input value={props.blockId || ''} onChange={(e) => setProp('blockId', e.target.value || `form-${selectedId}`)} />
          </Form.Item>
          <Form.Item label="Form Key">
            <Input value={props.formKey || ''} onChange={(e) => setProp('formKey', e.target.value || 'lead_main')} />
          </Form.Item>

          <Text strong>Form fields</Text>
          <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
            {(Array.isArray(props.fields) ? props.fields : []).map((field, idx) => (
              <Card key={`field-${idx}`} size="small">
                <Form.Item label="Field key" style={{ marginBottom: 8 }}>
                  <Input value={field.key} onChange={(e) => setFieldItem(idx, { key: e.target.value })} />
                </Form.Item>
                <Form.Item label="Field label" style={{ marginBottom: 8 }}>
                  <Input
                    value={textByLocale(field, 'label', activeLocale, field.label || '')}
                    onChange={(e) =>
                      setFieldItem(idx, {
                        label: e.target.value,
                        label_i18n: { ...ensureI18nObject(field.label_i18n, field.label || ''), [activeLocale]: e.target.value },
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="Type" style={{ marginBottom: 8 }}>
                  <Select
                    value={field.type}
                    onChange={(value) => setFieldItem(idx, { type: value })}
                    options={[
                      { value: 'text', label: 'text' },
                      { value: 'tel', label: 'tel' },
                      { value: 'email', label: 'email' },
                      { value: 'textarea', label: 'textarea' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="Required" valuePropName="checked" style={{ marginBottom: 8 }}>
                  <Switch checked={Boolean(field.required)} onChange={(checked) => setFieldItem(idx, { required: checked })} />
                </Form.Item>
                <Button danger onClick={() => removeFieldItem(idx)}>Remove field</Button>
              </Card>
            ))}
            <Button
              onClick={() =>
                setProp('fields', [
                  ...(Array.isArray(props.fields) ? props.fields : []),
                  { key: `field_${Date.now()}`, label: 'Новое поле', type: 'text', required: false },
                ])
              }
            >
              + Add field
            </Button>
          </Space>

          <Text strong style={{ marginTop: 12, display: 'block' }}>CRM binding</Text>
          <Form.Item label="Lead source" style={{ marginTop: 8 }}>
            <Select
              allowClear
              value={props.lead_source ?? null}
              options={lookups.lead_sources.map((s) => ({ value: s.id, label: s.name }))}
              onChange={(value) => setProp('lead_source', value || null)}
            />
          </Form.Item>
          <Form.Item label="Create deal" valuePropName="checked">
            <Switch checked={Boolean(props.create_deal)} onChange={(checked) => setProp('create_deal', checked)} />
          </Form.Item>
          <Form.Item label="Deal stage">
            <Select
              allowClear
              value={props.stage_on_deal_create ?? null}
              options={lookups.stages.map((s) => ({ value: s.id, label: s.name }))}
              onChange={(value) => setProp('stage_on_deal_create', value || null)}
            />
          </Form.Item>
          <Form.Item label="Owner strategy">
            <Select
              value={props.owner_strategy || 'inherit'}
              options={[
                { value: 'inherit', label: 'inherit' },
                { value: 'round_robin', label: 'round_robin' },
                { value: 'fixed_user', label: 'fixed_user' },
                { value: 'by_department', label: 'by_department' },
              ]}
              onChange={(value) => setProp('owner_strategy', value)}
            />
          </Form.Item>
          {props.owner_strategy === 'fixed_user' && (
            <Form.Item label="Fixed owner">
              <Select
                allowClear
                value={props.fixed_owner ?? null}
                options={lookups.users.map((u) => ({ value: u.id, label: u.full_name || u.username || `User #${u.id}` }))}
                onChange={(value) => setProp('fixed_owner', value || null)}
              />
            </Form.Item>
          )}
          <Form.Item label="SLA (minutes)">
            <InputNumber min={1} max={1440} value={Number(props.sla_minutes || 15)} onChange={(value) => setProp('sla_minutes', Number(value || 15))} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Dedup window (minutes)">
            <InputNumber min={1} max={10080} value={Number(props.dedup_window_minutes || 120)} onChange={(value) => setProp('dedup_window_minutes', Number(value || 120))} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Binding active" valuePropName="checked">
            <Switch checked={props.active !== false} onChange={(checked) => setProp('active', checked)} />
          </Form.Item>
        </>
      )}
    </Form>
  );
}

function CraftBuilder({ frameData, editorKey, onNodesChange, lookups, activeLocale, previewMode, editorMode, ui, selectedLandingId }) {
  const canvasWidth = previewMode === 'mobile' ? 390 : previewMode === 'tablet' ? 820 : 1200;
  const editorEnabled = editorMode === 'edit';
  return (
    <LandingLocaleContext.Provider value={activeLocale}>
      <Editor
        enabled={editorEnabled}
        resolver={{ CanvasRoot, HeroBlock, TextBlock, FeaturesBlock, CtaBlock, FormBlock, CarouselBlock }}
        onNodesChange={(query) => {
          const serialized = query.serialize();
          queueMicrotask(() => onNodesChange(serialized));
        }}
      >
        <Row gutter={[12, 12]}>
          {editorEnabled && (
            <Col xs={24} xl={6}>
              <Card title="Блоки" size="small" style={ui.cardStyle} styles={{ body: ui.cardBody }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <AddBlockToolbar />
                  <HistoryToolbar />
                  <LayersPanel />
                </Space>
              </Card>
            </Col>
          )}

          <Col xs={24} xl={editorEnabled ? 12 : 24}>
            <Card
              title={`Canvas (${activeLocale.toUpperCase()})`}
              size="small"
              style={ui.cardStyle}
              styles={{ body: { ...ui.cardBody, background: ui.canvasPanelBg } }}
            >
              <div
                style={{
                  width: canvasWidth,
                  maxWidth: '100%',
                  margin: '0 auto',
                  borderRadius: 20,
                  padding: 10,
                  border: ui.canvasShellBorder,
                  boxShadow: ui.canvasShellShadow,
                  background: ui.canvasShellBg,
                }}
              >
                <Frame key={editorKey} data={frameData}>
                  <Element is={CanvasRoot} canvas />
                </Frame>
              </div>
            </Card>
          </Col>

          {editorEnabled && (
            <Col xs={24} xl={6}>
              <Card title={`Свойства (${activeLocale.toUpperCase()})`} size="small" style={ui.cardStyle} styles={{ body: ui.cardBody }}>
                <NodePropertiesPanel lookups={lookups} activeLocale={activeLocale} selectedLandingId={selectedLandingId} />
              </Card>
            </Col>
          )}
        </Row>
      </Editor>
    </LandingLocaleContext.Provider>
  );
}

export default function LandingBuilderPage() {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const canManageLandings = canWrite('landings.change_landingpage');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveAndPublishing, setSaveAndPublishing] = useState(false);
  const [landings, setLandings] = useState([]);
  const [lookups, setLookups] = useState({ stages: [], lead_sources: [], users: [], departments: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLanding, setSelectedLanding] = useState(null);
  const [existingBindings, setExistingBindings] = useState([]);
  const [frameData, setFrameData] = useState(JSON.stringify(defaultCraftObject()));
  const [craftSerialized, setCraftSerialized] = useState(JSON.stringify(defaultCraftObject()));
  const [savedSerialized, setSavedSerialized] = useState(JSON.stringify(defaultCraftObject()));
  const [editorKey, setEditorKey] = useState(0);
  const [activeLocale, setActiveLocale] = useState('ru');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [editorMode, setEditorMode] = useState('edit');
  const [revisions, setRevisions] = useState([]);
  const [previewToken, setPreviewToken] = useState('');
  const [draftVersion, setDraftVersion] = useState(1);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [shareCampaign, setShareCampaign] = useState('');
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [autosaving, setAutosaving] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState(null);
  const [liveValidationErrors, setLiveValidationErrors] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    date_from: null,
    date_to: null,
    form_key: '',
    utm_campaign: '',
  });
  const [createForm] = Form.useForm();
  const blurAutosaveAtRef = useRef(0);
  const ui = useMemo(
    () => ({
      pageBg: isDark
        ? 'linear-gradient(180deg, #0b1220 0%, #0e1628 35%, #111827 100%)'
        : 'linear-gradient(180deg, #f3f6ff 0%, #f8fbff 25%, #f9fafb 60%, #f5f7fb 100%)',
      cardStyle: {
        borderRadius: 16,
        border: isDark ? '1px solid #253047' : '1px solid #e5e7eb',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        background: isDark ? '#111a2c' : '#ffffff',
      },
      cardBody: { padding: 18 },
      heroBg: isDark
        ? 'linear-gradient(120deg, #0b1220 0%, #12243f 55%, #1d4ed8 100%)'
        : 'linear-gradient(120deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)',
      stickyBg: isDark ? 'rgba(17,26,44,0.92)' : 'rgba(255,255,255,0.92)',
      canvasPanelBg: isDark ? 'linear-gradient(180deg, #0f172a 0%, #111827 100%)' : 'linear-gradient(180deg, #f8fbff 0%, #f4f6fb 100%)',
      canvasShellBg: isDark ? '#0b1220' : '#ffffff',
      canvasShellBorder: isDark ? '1px solid #2a3550' : '1px solid #dbe5f4',
      canvasShellShadow: isDark ? '0 14px 28px rgba(0,0,0,0.36)' : '0 14px 28px rgba(15,23,42,0.08)',
      titleColor: '#ffffff',
      subtitleColor: isDark ? 'rgba(226,232,240,0.88)' : 'rgba(255,255,255,0.85)',
      softBorder: isDark ? '#2a3550' : '#dbe5f4',
    }),
    [isDark],
  );

  const selectedLandingItem = useMemo(
    () => landings.find((item) => item.id === selectedId) || null,
    [landings, selectedId],
  );
  const effectiveEditorMode = canManageLandings ? editorMode : 'preview';
  const isDirty = Boolean(selectedId) && craftSerialized !== savedSerialized;

  const loadLandings = async () => {
    setLoading(true);
    try {
      const data = await landingsApi.list();
      const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      setLandings(items);

      if (!selectedId && items.length > 0) {
        setSelectedId(items[0].id);
      }
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось загрузить лендинги');
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const data = await landingsApi.lookups();
      setLookups(data || { stages: [], lead_sources: [], users: [], departments: [] });
    } catch {
      // non-blocking
    }
  };

  const loadLandingDetails = async (landingId) => {
    if (!landingId) return;
    try {
      const [landing, draft, bindings, revisionsData, tokenData] = await Promise.all([
        landingsApi.retrieve(landingId),
        landingsApi.getDraft(landingId),
        landingsApi.getBindings(landingId),
        landingsApi.revisions(landingId),
        landingsApi.previewToken(landingId),
      ]);

      const draftSchema = draft?.draft_schema || {};
      const craftObject = schemaToCraftObject(draftSchema, bindings, landing);
      const serialized = JSON.stringify(craftObject);

      setSelectedLanding(landing);
      setFrameData(serialized);
      setCraftSerialized(serialized);
      setSavedSerialized(serialized);
      setDraftVersion(Number(draft?.draft_version || 1));
      setEditorKey((prev) => prev + 1);
      setExistingBindings(Array.isArray(bindings) ? bindings : []);
      setRevisions(Array.isArray(revisionsData) ? revisionsData : []);
      setPreviewToken(tokenData?.token || '');
      setReport(null);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось загрузить данные лендинга');
    }
  };

  useEffect(() => {
    loadLandings();
    loadLookups();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadLandingDetails(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    const beforeUnloadHandler = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
  }, [isDirty]);

  useEffect(() => {
    const craftObj = safeParseJson(craftSerialized, null);
    if (!craftObj || !craftObj.ROOT) {
      setLiveValidationErrors(['Повреждённая структура редактора']);
      return;
    }
    const sections = extractSectionsFromCraft(craftObj);
    const errors = [];
    const formError = validateFormSections(sections);
    if (formError) errors.push(formError);
    if ((craftObj?.ROOT?.props?.title || '').trim() === '') {
      errors.push('Заполните заголовок страницы (Page title).');
    }
    setLiveValidationErrors(errors);
  }, [craftSerialized]);

  const validateFormSections = (sections) => {
    const formSections = sections.filter((section) => section.type === 'form');
    const uniqueBindingKeys = new Set();

    for (let i = 0; i < formSections.length; i += 1) {
      const section = formSections[i];
      const blockId = String(section.blockId || section.block_id || '').trim();
      const formKey = String(section.formKey || section.form_key || '').trim();
      const sectionTitle = section?.title || `Форма #${i + 1}`;

      if (!blockId || !formKey) {
        return `У блока "${sectionTitle}" заполните Block ID и Form Key.`;
      }

      const key = bindingKey(blockId, formKey);
      if (uniqueBindingKeys.has(key)) {
        return `Дубликат form binding: ${blockId} / ${formKey}. Сделайте значения уникальными.`;
      }
      uniqueBindingKeys.add(key);

      const fields = Array.isArray(section.fields) ? section.fields : [];
      if (!fields.length) {
        return `У блока "${sectionTitle}" должна быть минимум 1 форма-поле.`;
      }
      const fieldKeys = new Set();
      for (let j = 0; j < fields.length; j += 1) {
        const field = fields[j];
        const fieldKey = String(field?.key || '').trim();
        if (!fieldKey) {
          return `У блока "${sectionTitle}" поле #${j + 1} не имеет key.`;
        }
        if (fieldKeys.has(fieldKey)) {
          return `У блока "${sectionTitle}" повторяется key поля: ${fieldKey}.`;
        }
        fieldKeys.add(fieldKey);
      }
    }

    return null;
  };

  const buildDraftAndBindingsPayload = () => {
    const craftObj = safeParseJson(craftSerialized, null);
    if (!craftObj || !craftObj.ROOT) {
      return { error: 'Не удалось прочитать структуру craft.js' };
    }

    const rootProps = craftObj.ROOT.props || {};
    const sections = extractSectionsFromCraft(craftObj);
    const validationError = validateFormSections(sections);
    if (validationError) {
      return { error: validationError };
    }

    const schema = {
      schema_version: 1,
      page: {
        meta: {
          title: rootProps.title || selectedLandingItem?.title || 'Landing Page',
          title_i18n: ensureI18nObject(rootProps.title_i18n || rootProps.title || selectedLandingItem?.title || 'Landing Page'),
          description: rootProps.description || '',
          description_i18n: ensureI18nObject(rootProps.description_i18n || rootProps.description || ''),
        },
        theme: {
          ...DEFAULT_THEME,
          background: rootProps.background || DEFAULT_THEME.background,
          text: rootProps.titleColor || DEFAULT_THEME.text,
        },
        sections,
      },
      craft: craftObj,
    };

    const bindingsPayload = sections
      .filter((section) => section.type === 'form')
      .map((section) => ({
        block_id: String(section.blockId || section.block_id || '').trim(),
        form_key: String(section.formKey || section.form_key || '').trim(),
        lead_source: section.lead_source || selectedLanding?.lead_source || null,
        stage_on_deal_create: section.stage_on_deal_create || null,
        create_deal: Boolean(section.create_deal),
        owner_strategy: section.owner_strategy || 'inherit',
        fixed_owner: section.fixed_owner || null,
        assignment_queue: section.assignment_queue || null,
        sla_minutes: Number(section.sla_minutes || 15),
        dedup_window_minutes: Number(section.dedup_window_minutes || 120),
        active: section.active !== false,
      }));

    const currentKeys = new Set(
      bindingsPayload.map((item) => bindingKey(item.block_id, item.form_key)),
    );
    const removedBindings = (Array.isArray(existingBindings) ? existingBindings : [])
      .filter((item) => !currentKeys.has(bindingKey(item.block_id, item.form_key)))
      .map((item) => ({
        block_id: item.block_id,
        form_key: item.form_key,
        lead_source: item.lead_source ?? null,
        stage_on_deal_create: item.stage_on_deal_create ?? null,
        create_deal: Boolean(item.create_deal),
        owner_strategy: item.owner_strategy || 'inherit',
        fixed_owner: item.fixed_owner ?? null,
        assignment_queue: item.assignment_queue ?? null,
        sla_minutes: Number(item.sla_minutes || 15),
        dedup_window_minutes: Number(item.dedup_window_minutes || 120),
        active: false,
      }));

    return {
      schema,
      bindings: [...bindingsPayload, ...removedBindings],
    };
  };

  const handleCreateLanding = async () => {
    if (!canManageLandings) {
      message.error('Недостаточно прав для создания лендингов');
      return;
    }
    try {
      const values = await createForm.validateFields();
      const slug = toSlug(values.slug || values.title);
      if (!slug) {
        message.error('Укажите валидный slug');
        return;
      }
      const payload = {
        title: values.title,
        slug,
        is_active: values.is_active !== false,
        department: values.department,
        lead_source: values.lead_source,
      };
      const created = await landingsApi.create(payload);
      createForm.resetFields();
      message.success('Лендинг создан');
      await loadLandings();
      if (created?.id) {
        setSelectedId(created.id);
      }
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.details?.detail || 'Не удалось создать лендинг');
    }
  };

  const buildDraftPayloadFromCraft = (craftObj, landingValues = {}) => {
    const rootProps = craftObj?.ROOT?.props || {};
    const sections = extractSectionsFromCraft(craftObj);
    const schema = {
      schema_version: 1,
      page: {
        meta: {
          title: rootProps.title || landingValues.title || 'Landing Page',
          title_i18n: ensureI18nObject(rootProps.title_i18n || rootProps.title || landingValues.title || 'Landing Page'),
          description: rootProps.description || '',
          description_i18n: ensureI18nObject(rootProps.description_i18n || rootProps.description || ''),
        },
        theme: {
          ...DEFAULT_THEME,
          background: rootProps.background || DEFAULT_THEME.background,
          text: rootProps.titleColor || DEFAULT_THEME.text,
        },
        sections,
      },
      craft: craftObj,
    };

    const bindings = sections
      .filter((section) => section.type === 'form')
      .map((section) => ({
        block_id: String(section.blockId || section.block_id || '').trim(),
        form_key: String(section.formKey || section.form_key || '').trim(),
        lead_source: section.lead_source || landingValues.lead_source || null,
        stage_on_deal_create: section.stage_on_deal_create || null,
        create_deal: Boolean(section.create_deal),
        owner_strategy: section.owner_strategy || 'inherit',
        fixed_owner: section.fixed_owner || null,
        assignment_queue: section.assignment_queue || null,
        sla_minutes: Number(section.sla_minutes || 15),
        dedup_window_minutes: Number(section.dedup_window_minutes || 120),
        active: section.active !== false,
      }));

    return { schema, bindings };
  };

  const handleCreateCrmSalesLanding = async () => {
    if (!canManageLandings) {
      message.error('Недостаточно прав для создания шаблонов лендинга');
      return;
    }
    try {
      const suffix = Date.now().toString().slice(-6);
      const payload = {
        title: 'Enterprise CRM - Sales Landing (Template)',
        slug: `enterprise-crm-sales-${suffix}`,
        is_active: true,
        department: null,
        lead_source: null,
      };
      const created = await landingsApi.create(payload);
      const craftObj = defaultCrmSalesCraftObject();
      const { schema, bindings } = buildDraftPayloadFromCraft(craftObj, payload);

      await landingsApi.putDraft(
        created.id,
        schema,
        { headers: { 'X-Draft-Version': '1' } },
      );
      if (bindings.length > 0) {
        await landingsApi.putBindings(created.id, bindings);
      }

      message.success('Обновленный шаблон CRM Sales лендинга создан');
      await loadLandings();
      setSelectedId(created.id);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось создать шаблонный лендинг');
    }
  };

  const saveDraft = async ({ silentSuccess = false, reloadAfterSave = true, background = false } = {}) => {
    if (!selectedId) return;
    if (!canManageLandings) {
      if (!background) {
        message.error('Недостаточно прав для сохранения лендинга');
      }
      return false;
    }

    const serializedSnapshot = craftSerialized;
    const { schema, bindings, error } = buildDraftAndBindingsPayload();
    if (error) {
      message.error(error);
      return false;
    }

    if (background) {
      setAutosaving(true);
    } else {
      setSaving(true);
    }
    try {
      const draftResponse = await landingsApi.putDraft(
        selectedId,
        schema,
        { headers: { 'X-Draft-Version': String(draftVersion) } },
      );
      await landingsApi.putBindings(selectedId, bindings);
      setDraftVersion(Number(draftResponse?.draft_version || draftVersion + 1));
      if (!silentSuccess) {
        message.success('Визуальный лендинг и формы сохранены');
      }
      setSavedSerialized(serializedSnapshot);
      setExistingBindings(bindings);
      if (reloadAfterSave) {
        await loadLandingDetails(selectedId);
      }
      return true;
    } catch (err) {
      if (err?.status === 409 || err?.details?.code === 'draft_conflict') {
        message.error('Конфликт черновика: кто-то уже обновил этот лендинг. Загружаю актуальную версию.');
        await loadLandingDetails(selectedId);
        return false;
      }
      message.error(err?.details?.detail || err.message || 'Ошибка сохранения');
      return false;
    } finally {
      if (background) {
        setAutosaving(false);
      } else {
        setSaving(false);
      }
    }
  };

  const handleSaveDraft = async () => saveDraft();

  const handlePublish = async () => {
    if (!selectedId) return;
    if (!canManageLandings) {
      message.error('Недостаточно прав для публикации лендинга');
      return;
    }
    setPublishing(true);
    try {
      if (isDirty) {
        const saved = await saveDraft({ silentSuccess: true, reloadAfterSave: false });
        if (!saved) return;
      }
      await landingsApi.publish(selectedId);
      message.success('Лендинг опубликован');
      await loadLandingDetails(selectedId);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось опубликовать лендинг');
    } finally {
      setPublishing(false);
    }
  };

  const handleSelectLanding = (nextId) => {
    if (nextId === selectedId) return;
    if (isDirty && !window.confirm('Есть несохранённые изменения. Переключиться без сохранения?')) {
      return;
    }
    setSelectedId(nextId);
  };

  useEffect(() => {
    if (!canManageLandings || !autosaveEnabled || !selectedId || !isDirty || saving || publishing || autosaving || saveAndPublishing) return;
    const timer = setTimeout(async () => {
      const ok = await saveDraft({ silentSuccess: true, reloadAfterSave: false, background: true });
      if (ok) {
        setLastAutosavedAt(new Date());
      }
    }, 25000);

    return () => clearTimeout(timer);
  }, [autosaveEnabled, selectedId, isDirty, saving, publishing, autosaving, saveAndPublishing, craftSerialized, canManageLandings]);

  const handleCopyUrl = async (value, successText = 'Ссылка скопирована') => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      message.success(successText);
    } catch {
      message.error('Не удалось скопировать ссылку');
    }
  };

  const openUrl = (value) => {
    if (!value) return;
    window.open(value, '_blank', 'noopener,noreferrer');
  };

  const handleEditorBlurAutosave = async () => {
    if (!canManageLandings || !autosaveEnabled || !selectedId || !isDirty || saving || publishing || autosaving || saveAndPublishing) return;
    const now = Date.now();
    if (now - blurAutosaveAtRef.current < 3000) return;
    blurAutosaveAtRef.current = now;
    const ok = await saveDraft({ silentSuccess: true, reloadAfterSave: false, background: true });
    if (ok) {
      setLastAutosavedAt(new Date());
    }
  };

  const handleSaveAndPublish = async () => {
    if (!selectedId) return;
    if (!canManageLandings) {
      message.error('Недостаточно прав для публикации лендинга');
      return;
    }
    setSaveAndPublishing(true);
    try {
      const saved = await saveDraft({ silentSuccess: true, reloadAfterSave: false });
      if (!saved) return;
      await landingsApi.publish(selectedId);
      message.success('Лендинг сохранён и опубликован');
      await loadLandingDetails(selectedId);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось сохранить и опубликовать лендинг');
    } finally {
      setSaveAndPublishing(false);
    }
  };

  const handleToggleActive = async (checked) => {
    if (!selectedId) return;
    if (!canManageLandings) {
      message.error('Недостаточно прав для изменения статуса лендинга');
      return;
    }
    try {
      await landingsApi.patch(selectedId, { is_active: checked });
      message.success(checked ? 'Лендинг активирован' : 'Лендинг деактивирован');
      await loadLandings();
      await loadLandingDetails(selectedId);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось обновить статус');
    }
  };

  const handleLoadReport = async () => {
    if (!selectedId) return;
    setReportLoading(true);
    try {
      const params = {};
      if (reportFilters.date_from) params.date_from = reportFilters.date_from;
      if (reportFilters.date_to) params.date_to = reportFilters.date_to;
      if (reportFilters.form_key) params.form_key = reportFilters.form_key;
      if (reportFilters.utm_campaign) params.utm_campaign = reportFilters.utm_campaign;
      const data = await landingsApi.report(selectedId, params);
      setReport(data || null);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось загрузить отчет');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!report || !selectedLandingItem) return;
    const suffix = [
      toSafeFilePart(reportFilters.date_from),
      toSafeFilePart(reportFilters.date_to),
      toSafeFilePart(reportFilters.form_key),
      toSafeFilePart(reportFilters.utm_campaign),
    ]
      .filter(Boolean)
      .join('_');
    const rows = [
      ['metric', 'value'],
      ['filter_date_from', report?.filters?.date_from || ''],
      ['filter_date_to', report?.filters?.date_to || ''],
      ['filter_form_key', report?.filters?.form_key || ''],
      ['filter_utm_campaign', report?.filters?.utm_campaign || ''],
      ['landing_view', report?.metrics?.landing_view || 0],
      ['form_start', report?.metrics?.form_start || 0],
      ['form_submit', report?.metrics?.form_submit || 0],
      ['lead_created', report?.metrics?.lead_created || 0],
      ['deal_created', report?.metrics?.deal_created || 0],
      ['dedup_hit', report?.metrics?.dedup_hit || 0],
      ['sla_breached', report?.metrics?.sla_breached || 0],
      ['share_link_copied', report?.metrics?.share_link_copied || 0],
      ['share_link_opened', report?.metrics?.share_link_opened || 0],
      ['view_to_start_pct', report?.conversions?.view_to_start_pct || 0],
      ['start_to_submit_pct', report?.conversions?.start_to_submit_pct || 0],
      ['submit_to_lead_pct', report?.conversions?.submit_to_lead_pct || 0],
      ['lead_to_deal_pct', report?.conversions?.lead_to_deal_pct || 0],
      ['share_copy_to_open_pct', report?.conversions?.share_copy_to_open_pct || 0],
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const filename = suffix
      ? `landing-funnel-${selectedLandingItem.slug}-${suffix}.csv`
      : `landing-funnel-${selectedLandingItem.slug}.csv`;
    downloadTextFile(filename, csv, 'text/csv;charset=utf-8;');
  };

  const handleExportPdf = async () => {
    if (!report || !selectedLandingItem) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const rowHeight = 8;
      let y = 20;

      const headerTitle = 'Landing Funnel Report';
      const subtitle = selectedLandingItem.title;
      const generatedAt = new Date().toLocaleString();

      const ensureSpace = (needed = rowHeight) => {
        if (y + needed <= pageHeight - 14) return;
        doc.addPage();
        y = 20;
      };

      const drawHeader = () => {
        doc.setFillColor(24, 24, 27);
        doc.rect(0, 0, pageWidth, 16, 'F');
        try {
          if (logoPngDataUrl) {
            doc.addImage(logoPngDataUrl, 'PNG', margin, 3.5, 30, 8);
          }
        } catch {
          // ignore logo rendering issues
        }
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(headerTitle, margin + 34, 10.5);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(generatedAt, pageWidth - margin, 10.5, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      };

      const drawKeyValue = (label, value) => {
        ensureSpace();
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), margin + 55, y);
        y += rowHeight;
      };

      const drawTable = (tableTitle, rows) => {
        ensureSpace(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(tableTitle, margin, y);
        y += 4;

        ensureSpace(10);
        doc.setFillColor(244, 244, 245);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Metric', margin + 2, y + 5.5);
        doc.text('Value', margin + contentWidth - 2, y + 5.5, { align: 'right' });
        y += rowHeight;

        doc.setFont('helvetica', 'normal');
        rows.forEach((row, index) => {
          ensureSpace(10);
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, y, contentWidth, rowHeight, 'F');
          }
          doc.text(String(row.label), margin + 2, y + 5.5);
          doc.text(String(row.value), margin + contentWidth - 2, y + 5.5, { align: 'right' });
          y += rowHeight;
        });

        y += 4;
      };

      const logoPngDataUrl = await svgUrlToPngDataUrl(brandLogo).catch(() => '');
      drawHeader();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(subtitle, margin, y);
      y += 9;
      doc.setFontSize(10);
      drawKeyValue('Slug', selectedLandingItem.slug);
      drawKeyValue('Date From', report?.filters?.date_from || '-');
      drawKeyValue('Date To', report?.filters?.date_to || '-');
      drawKeyValue('Form Key', report?.filters?.form_key || '-');
      drawKeyValue('UTM Campaign', report?.filters?.utm_campaign || '-');
      y += 2;

      drawTable('Funnel Metrics', [
        { label: 'Landing Views', value: formatNumber(report?.metrics?.landing_view) },
        { label: 'Form Start', value: formatNumber(report?.metrics?.form_start) },
        { label: 'Form Submit', value: formatNumber(report?.metrics?.form_submit) },
        { label: 'Lead Created', value: formatNumber(report?.metrics?.lead_created) },
        { label: 'Deal Created', value: formatNumber(report?.metrics?.deal_created) },
        { label: 'Dedup Hit', value: formatNumber(report?.metrics?.dedup_hit) },
        { label: 'SLA Breached', value: formatNumber(report?.metrics?.sla_breached) },
        { label: 'Share Link Copied', value: formatNumber(report?.metrics?.share_link_copied) },
        { label: 'Share Link Opened', value: formatNumber(report?.metrics?.share_link_opened) },
      ]);

      drawTable('Step Conversion', [
        { label: 'View -> Start', value: formatPercent(report?.conversions?.view_to_start_pct) },
        { label: 'Start -> Submit', value: formatPercent(report?.conversions?.start_to_submit_pct) },
        { label: 'Submit -> Lead', value: formatPercent(report?.conversions?.submit_to_lead_pct) },
        { label: 'Lead -> Deal', value: formatPercent(report?.conversions?.lead_to_deal_pct) },
        { label: 'Share Copy -> Open', value: formatPercent(report?.conversions?.share_copy_to_open_pct) },
      ]);

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }

      const suffix = [
        toSafeFilePart(reportFilters.date_from),
        toSafeFilePart(reportFilters.date_to),
        toSafeFilePart(reportFilters.form_key),
        toSafeFilePart(reportFilters.utm_campaign),
      ]
        .filter(Boolean)
        .join('_');
      const filename = suffix
        ? `landing-funnel-${selectedLandingItem.slug}-${suffix}.pdf`
        : `landing-funnel-${selectedLandingItem.slug}.pdf`;
      doc.save(filename);
    } catch (err) {
      message.error(err?.message || 'Не удалось экспортировать PDF');
    }
  };

  const previewUrl = selectedLandingItem
    && previewToken
    ? `${window.location.origin}/#/public-landing/${selectedLandingItem.slug}/preview/${encodeURIComponent(previewToken)}`
    : '';
  const publicUrl = selectedLandingItem
    ? `${window.location.origin}/#/public-landing/${selectedLandingItem.slug}`
    : '';
  const shareUrl = selectedLandingItem
    ? `${publicUrl}?via=share&utm_source=crm_landing_builder&utm_medium=copy_link${shareCampaign.trim() ? `&utm_campaign=${encodeURIComponent(shareCampaign.trim())}` : ''}`
    : '';

  const handleCopyShareLink = async () => {
    if (!selectedLandingItem || !shareUrl) return;
    const utmCampaign = shareCampaign.trim();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      await landingsApi.trackEvent({
        landing_slug: selectedLandingItem.slug,
        event_type: 'share_link_copied',
        meta: {
          via: 'share',
          channel: 'copy_link',
          utm: {
            source: 'crm_landing_builder',
            medium: 'copy_link',
            campaign: utmCampaign,
          },
        },
      });
      message.success('Share-ссылка скопирована');
    } catch {
      message.error('Не удалось скопировать share-ссылку');
    }
  };

  return (
    <div style={{ padding: 24, background: ui.pageBg, minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card variant="borderless" style={{ ...ui.cardStyle, background: ui.heroBg }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Title level={3} style={{ margin: 0, color: ui.titleColor }}>
              Landing Builder
            </Title>
            <Text style={{ color: ui.subtitleColor }}>
              Визуальный конструктор посадочных страниц с CRM-формами, публикацией и аналитикой воронки.
            </Text>
          </Space>
        </Card>
        {!canManageLandings && (
          <Alert
            type="info"
            showIcon
            message="Режим только чтения"
            description="У вас есть доступ к просмотру лендингов, но нет прав на создание, редактирование и публикацию."
          />
        )}

        <Card title="Новый лендинг" style={ui.cardStyle} styles={{ body: ui.cardBody }}>
          <Form layout="vertical" form={createForm}>
            <Row gutter={12} style={{ position: 'sticky', top: 8, zIndex: 20, background: ui.stickyBg, backdropFilter: 'blur(6px)', padding: '8px 0', marginBottom: 6 }}>
              <Col xs={24} md={6}>
                <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                  <Input
                    placeholder="Summer Campaign"
                    onBlur={(event) => {
                      const currentSlug = createForm.getFieldValue('slug');
                      if (!String(currentSlug || '').trim()) {
                        createForm.setFieldValue('slug', toSlug(event.target.value));
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={5}>
                <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                  <Input placeholder="summer-campaign" />
                </Form.Item>
              </Col>
              <Col xs={24} md={5}>
                <Form.Item name="department" label="Department">
                  <Select allowClear options={lookups.departments.map((d) => ({ value: d.id, label: d.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={5}>
                <Form.Item name="lead_source" label="Lead Source">
                  <Select allowClear options={lookups.lead_sources.map((s) => ({ value: s.id, label: s.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={3}>
                <Form.Item name="is_active" label="Active" valuePropName="checked" initialValue>
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button type="primary" onClick={handleCreateLanding} disabled={!canManageLandings}>Создать</Button>
              <Button onClick={handleCreateCrmSalesLanding} disabled={!canManageLandings}>Создать шаблон CRM Sales</Button>
            </Space>
          </Form>
        </Card>

        <Card
          title="Визуальный редактор"
          style={ui.cardStyle}
          styles={{ body: ui.cardBody }}
          onBlurCapture={(event) => {
            const nextFocused = event.relatedTarget;
            if (nextFocused && event.currentTarget.contains(nextFocused)) return;
            handleEditorBlurAutosave();
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Выберите лендинг"
                  loading={loading}
                  value={selectedId}
                  onChange={handleSelectLanding}
                  options={landings.map((l) => ({ value: l.id, label: `${l.title} (${l.slug})` }))}
                />
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <Text type="secondary">Active</Text>
                  <Switch checked={selectedLanding?.is_active} onChange={handleToggleActive} disabled={!selectedLanding || !canManageLandings} />
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space wrap>
                  <Select
                    value={activeLocale}
                    style={{ width: 110 }}
                    onChange={setActiveLocale}
                    options={LANGUAGES.map((lang) => ({ value: lang, label: lang.toUpperCase() }))}
                  />
                  <Select
                    value={previewMode}
                    style={{ width: 120 }}
                    onChange={setPreviewMode}
                    options={[
                      { value: 'desktop', label: 'Desktop' },
                      { value: 'tablet', label: 'Tablet' },
                      { value: 'mobile', label: 'Mobile' },
                    ]}
                  />
                  <Segmented
                    value={effectiveEditorMode}
                    onChange={setEditorMode}
                    disabled={!canManageLandings}
                    options={[
                      { label: 'Edit', value: 'edit' },
                      { label: 'Preview', value: 'preview' },
                    ]}
                  />
                  <Button onClick={handleSaveDraft} loading={saving} disabled={!selectedId || saveAndPublishing || !canManageLandings}>Сохранить</Button>
                  <Button onClick={handlePublish} loading={publishing} disabled={!selectedId || saveAndPublishing || !canManageLandings}>Publish</Button>
                  <Button type="primary" onClick={handleSaveAndPublish} loading={saveAndPublishing} disabled={!selectedId || saving || publishing || !canManageLandings}>
                    Save & Publish
                  </Button>
                  <Space size={4}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Autosave</Text>
                    <Switch size="small" checked={autosaveEnabled} onChange={setAutosaveEnabled} disabled={!selectedId || !canManageLandings} />
                  </Space>
                  <Tag color={isDirty ? 'orange' : 'green'}>
                    {isDirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}
                  </Tag>
                  {autosaving && <Tag color="processing">Autosaving...</Tag>}
                  {lastAutosavedAt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Автосейв: {lastAutosavedAt.toLocaleTimeString()}
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>
            {liveValidationErrors.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Проблемы в контенте"
                description={(
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {liveValidationErrors.map((item, idx) => <li key={`ve-${idx}`}>{item}</li>)}
                  </ul>
                )}
              />
            )}

            {selectedLandingItem && (
              <Alert
                type="info"
                showIcon
                message="Ссылки лендинга"
                description={(
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input value={publicUrl} readOnly />
                      <Button onClick={() => openUrl(publicUrl)}>Open</Button>
                      <Button onClick={() => handleCopyUrl(publicUrl, 'Public ссылка скопирована')}>Copy</Button>
                    </Space.Compact>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input value={previewUrl} readOnly />
                      <Button onClick={() => openUrl(previewUrl)}>Open preview</Button>
                      <Button onClick={() => handleCopyUrl(previewUrl, 'Preview ссылка скопирована')}>Copy</Button>
                    </Space.Compact>
                  </Space>
                )}
                style={{ borderRadius: 12, borderColor: ui.softBorder }}
              />
            )}
            {selectedLandingItem && (
              <Card size="small" title="Share link" style={{ borderRadius: 12, borderColor: ui.softBorder }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space wrap>
                    <Input
                      placeholder="utm_campaign (optional)"
                      value={shareCampaign}
                      onChange={(e) => setShareCampaign(e.target.value)}
                      style={{ width: 260 }}
                    />
                    <Button type="primary" onClick={handleCopyShareLink}>
                      Copy share link
                    </Button>
                  </Space>
                  <Input value={shareUrl} readOnly />
                </Space>
              </Card>
            )}

            <CraftBuilder
              frameData={frameData}
              editorKey={editorKey}
              onNodesChange={setCraftSerialized}
              lookups={lookups}
              activeLocale={activeLocale}
              previewMode={previewMode}
              editorMode={effectiveEditorMode}
              ui={ui}
              selectedLandingId={selectedId}
            />
          </Space>
        </Card>

        <Card title="Revisions" style={ui.cardStyle} styles={{ body: ui.cardBody }}>
          <Table
            rowKey="id"
            size="small"
            dataSource={revisions}
            pagination={false}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Kind', dataIndex: 'kind', render: (v) => <Tag>{v}</Tag> },
              { title: 'Schema Version', dataIndex: 'schema_version' },
              { title: 'Created By', dataIndex: 'created_by_name' },
              { title: 'Created', dataIndex: 'created_at' },
              {
                title: 'Action',
                render: (_, record) => (
                  <Button
                    size="small"
                    disabled={!selectedId || !canManageLandings}
                  >
                    <Popconfirm
                      title="Откатить версию?"
                      description={`Откат к ревизии #${record.id}. Текущий draft будет заменён.`}
                      okText="Откатить"
                      cancelText="Отмена"
                      onConfirm={async () => {
                        if (!canManageLandings) {
                          message.error('Недостаточно прав для отката ревизий');
                          return;
                        }
                        try {
                          await landingsApi.rollback(selectedId, record.id);
                          message.success('Rollback выполнен');
                          await loadLandingDetails(selectedId);
                        } catch (err) {
                          message.error(err?.details?.detail || 'Rollback failed');
                        }
                      }}
                    >
                      <span>Rollback</span>
                    </Popconfirm>
                  </Button>
                ),
              },
            ]}
          />
        </Card>

        <Card title="Funnel Filters" style={ui.cardStyle} styles={{ body: ui.cardBody }}>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Space>
                <DatePicker
                  placeholder="Date from"
                  format="YYYY-MM-DD"
                  onChange={(_, dateString) => setReportFilters((prev) => ({ ...prev, date_from: dateString || null }))}
                />
                <DatePicker
                  placeholder="Date to"
                  format="YYYY-MM-DD"
                  onChange={(_, dateString) => setReportFilters((prev) => ({ ...prev, date_to: dateString || null }))}
                />
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space>
                <Input
                  placeholder="form_key"
                  value={reportFilters.form_key}
                  onChange={(e) => setReportFilters((prev) => ({ ...prev, form_key: e.target.value }))}
                  style={{ width: 130 }}
                />
                <Input
                  placeholder="utm_campaign"
                  value={reportFilters.utm_campaign}
                  onChange={(e) => setReportFilters((prev) => ({ ...prev, utm_campaign: e.target.value }))}
                  style={{ width: 150 }}
                />
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space>
                <Button onClick={handleLoadReport} loading={reportLoading} disabled={!selectedId}>Conversion report</Button>
                <Button onClick={handleExportCsv} disabled={!report}>Export CSV</Button>
                <Button onClick={handleExportPdf} disabled={!report}>Export PDF</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {report && (
          <Card title="Funnel Report" style={ui.cardStyle} styles={{ body: ui.cardBody }}>
            <Row gutter={12}>
              <Col xs={12} md={6}><Statistic title="Views" value={report?.metrics?.landing_view || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Form start" value={report?.metrics?.form_start || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Submit" value={report?.metrics?.form_submit || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Leads" value={report?.metrics?.lead_created || 0} /></Col>
            </Row>
            <Row gutter={12} style={{ marginTop: 12 }}>
              <Col xs={12} md={6}><Statistic title="Deals" value={report?.metrics?.deal_created || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Dedup hit" value={report?.metrics?.dedup_hit || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="SLA breached" value={report?.metrics?.sla_breached || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Submit->Lead %" value={report?.conversions?.submit_to_lead_pct || 0} /></Col>
            </Row>
            <Row gutter={12} style={{ marginTop: 12 }}>
              <Col xs={12} md={6}><Statistic title="Share copied" value={report?.metrics?.share_link_copied || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Share opened" value={report?.metrics?.share_link_opened || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Copy->Open %" value={report?.conversions?.share_copy_to_open_pct || 0} /></Col>
            </Row>
          </Card>
        )}
      </Space>
    </div>
  );
}
