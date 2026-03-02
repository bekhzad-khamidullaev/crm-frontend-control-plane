import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { Editor, Element, Frame, useEditor, useNode } from '@craftjs/core';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { landingsApi } from '../lib/api/client';
import brandLogo from '../assets/brand/logo.svg';

const { Title, Text } = Typography;
const LANGUAGES = ['ru', 'uz', 'en'];
const LandingLocaleContext = createContext('ru');

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
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      ru: value.ru || value.en || value.uz || fallback,
      uz: value.uz || value.ru || value.en || fallback,
      en: value.en || value.ru || value.uz || fallback,
    };
  }
  const normalized = String(value || fallback || '');
  return { ru: normalized, uz: normalized, en: normalized };
}

function textByLocale(nodeProps, key, locale, fallback = '') {
  const map = ensureI18nObject(nodeProps?.[`${key}_i18n`], nodeProps?.[key] || fallback);
  return map?.[locale] || map?.ru || map?.en || map?.uz || fallback;
}

function toSafeFilePart(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40);
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
  const name = node?.type?.resolvedName;
  const props = node?.props || {};
  if (name === 'HeroBlock') return props.title || 'Hero';
  if (name === 'TextBlock') return props.title || 'Text';
  if (name === 'FeaturesBlock') return props.title || 'Features';
  if (name === 'CtaBlock') return props.title || 'CTA';
  if (name === 'FormBlock') return props.title || 'Form';
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

function BlockShell({ children, background, textColor, name }) {
  const { connect, drag, selected } = useBlockSelection();
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{
        padding: '72px 24px',
        borderRadius: 0,
        border: selected ? '2px solid #1677ff' : '1px dashed transparent',
        background: background || '#ffffff',
        color: textColor || '#111827',
        marginBottom: 0,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', left: 12, top: 10, zIndex: 5 }}>
        <Tag color={selected ? 'blue' : 'default'}>{name}</Tag>
      </div>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>{children}</div>
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
        padding: 0,
        borderRadius: 0,
        border: '1px solid #d4d4d8',
      }}
    >
      <div style={{ padding: 20, background: '#fff', borderBottom: '1px solid #e4e4e7' }}>
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
    <BlockShell background={background} textColor={textColor} name="Hero">
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
    <BlockShell background={background} textColor={textColor} name="Text">
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
    <BlockShell background={background} textColor={textColor} name="Features">
      <Title level={4} style={{ margin: 0, color: textColor || '#111827' }}>
        {textByLocale(props, 'title', locale, title || '')}
      </Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        {features.map((item, idx) => (
          <Card key={`feature-${idx}`} size="small" bodyStyle={{ padding: 10 }}>
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
    <BlockShell background={background} textColor={textColor} name="CTA">
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
    <BlockShell background={background} textColor={textColor} name="Form">
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

  return (
    <Space wrap>
      <Button size="small" onClick={() => addBlock('HeroBlock')}>+ Cover</Button>
      <Button size="small" onClick={() => addBlock('TextBlock')}>+ Text</Button>
      <Button size="small" onClick={() => addBlock('FeaturesBlock')}>+ Cards</Button>
      <Button size="small" onClick={() => addBlock('CtaBlock')}>+ CTA</Button>
      <Button size="small" onClick={() => addBlock('FormBlock')}>+ Form</Button>
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

function NodePropertiesPanel({ lookups, activeLocale }) {
  const { query, actions, selectedId } = useEditor((state) => ({
    selectedId: getSelectedId(state.events?.selected),
  }));

  if (!selectedId) {
    return <Text type="secondary">Выберите блок на канвасе или в списке слева</Text>;
  }

  const node = query.node(selectedId).get()?.data;
  const type = node?.type?.resolvedName;
  const props = node?.props || {};

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

  return (
    <Form layout="vertical">
      {type === 'CanvasRoot' && (
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
        </>
      )}

      {type !== 'CanvasRoot' && (
        <>
          <Form.Item label="Background color">
            <Input type="color" value={props.background || '#ffffff'} onChange={(e) => setProp('background', e.target.value)} style={{ width: 72, padding: 4 }} />
          </Form.Item>
          <Form.Item label="Text color">
            <Input type="color" value={props.textColor || '#111827'} onChange={(e) => setProp('textColor', e.target.value)} style={{ width: 72, padding: 4 }} />
          </Form.Item>
        </>
      )}

      {(type === 'HeroBlock' || type === 'TextBlock' || type === 'CtaBlock' || type === 'FormBlock' || type === 'FeaturesBlock') && (
        <Form.Item label="Title">
          <Input
            value={textByLocale(props, 'title', activeLocale, props.title || '')}
            onChange={(e) => setI18nProp('title', e.target.value)}
          />
        </Form.Item>
      )}

      {(type === 'HeroBlock' || type === 'CtaBlock' || type === 'FormBlock') && (
        <Form.Item label="Subtitle / body">
          <Input.TextArea
            rows={3}
            value={
              type === 'CtaBlock'
                ? textByLocale(props, 'body', activeLocale, props.body || '')
                : textByLocale(props, 'subtitle', activeLocale, props.subtitle || '')
            }
            onChange={(e) => {
              if (type === 'CtaBlock') {
                setI18nProp('body', e.target.value);
              } else {
                setI18nProp('subtitle', e.target.value);
              }
            }}
          />
        </Form.Item>
      )}

      {type === 'TextBlock' && (
        <Form.Item label="Body">
          <Input.TextArea
            rows={4}
            value={textByLocale(props, 'body', activeLocale, props.body || '')}
            onChange={(e) => setI18nProp('body', e.target.value)}
          />
        </Form.Item>
      )}

      {(type === 'HeroBlock' || type === 'CtaBlock' || type === 'FormBlock') && (
        <Form.Item label="Button text">
          <Input
            value={textByLocale(props, 'buttonText', activeLocale, props.buttonText || '')}
            onChange={(e) => setI18nProp('buttonText', e.target.value)}
          />
        </Form.Item>
      )}

      {type === 'FeaturesBlock' && (
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

      {type === 'FormBlock' && (
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

function CraftBuilder({ frameData, editorKey, onNodesChange, lookups, activeLocale, previewMode }) {
  const canvasWidth = previewMode === 'mobile' ? 390 : previewMode === 'tablet' ? 820 : 1200;
  return (
    <LandingLocaleContext.Provider value={activeLocale}>
      <Editor
        resolver={{ CanvasRoot, HeroBlock, TextBlock, FeaturesBlock, CtaBlock, FormBlock }}
        onNodesChange={(query) => onNodesChange(query.serialize())}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} xl={6}>
            <Card title="Блоки" size="small">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <AddBlockToolbar />
                <LayersPanel />
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card title={`Canvas (${activeLocale.toUpperCase()})`} size="small" bodyStyle={{ background: '#f4f4f5' }}>
              <div style={{ width: canvasWidth, maxWidth: '100%', margin: '0 auto', boxShadow: '0 8px 28px rgba(0,0,0,0.09)' }}>
                <Frame key={editorKey} data={frameData}>
                  <Element is={CanvasRoot} canvas />
                </Frame>
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={6}>
            <Card title={`Свойства (${activeLocale.toUpperCase()})`} size="small">
              <NodePropertiesPanel lookups={lookups} activeLocale={activeLocale} />
            </Card>
          </Col>
        </Row>
      </Editor>
    </LandingLocaleContext.Provider>
  );
}

export default function LandingBuilderPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [landings, setLandings] = useState([]);
  const [lookups, setLookups] = useState({ stages: [], lead_sources: [], users: [], departments: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLanding, setSelectedLanding] = useState(null);
  const [existingBindings, setExistingBindings] = useState([]);
  const [frameData, setFrameData] = useState(JSON.stringify(defaultCraftObject()));
  const [craftSerialized, setCraftSerialized] = useState(JSON.stringify(defaultCraftObject()));
  const [editorKey, setEditorKey] = useState(0);
  const [activeLocale, setActiveLocale] = useState('ru');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [revisions, setRevisions] = useState([]);
  const [previewToken, setPreviewToken] = useState('');
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    date_from: null,
    date_to: null,
    form_key: '',
    utm_campaign: '',
  });
  const [createForm] = Form.useForm();

  const selectedLandingItem = useMemo(
    () => landings.find((item) => item.id === selectedId) || null,
    [landings, selectedId],
  );

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

  const handleCreateLanding = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        title: values.title,
        slug: values.slug,
        is_active: values.is_active !== false,
        department: values.department,
        lead_source: values.lead_source,
      };
      await landingsApi.create(payload);
      createForm.resetFields();
      message.success('Лендинг создан');
      await loadLandings();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.details?.detail || 'Не удалось создать лендинг');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedId) return;

    const craftObj = safeParseJson(craftSerialized, null);
    if (!craftObj || !craftObj.ROOT) {
      message.error('Не удалось прочитать структуру craft.js');
      return;
    }

    const rootProps = craftObj.ROOT.props || {};
    const sections = extractSectionsFromCraft(craftObj);

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
        block_id: section.blockId || section.block_id,
        form_key: section.formKey || section.form_key,
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

    // Keep backend bindings in sync with the canvas:
    // if a form block was removed from the visual editor, explicitly deactivate its binding.
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

    const mergedBindingsPayload = [...bindingsPayload, ...removedBindings];

    setSaving(true);
    try {
      await landingsApi.putDraft(selectedId, schema);
      await landingsApi.putBindings(selectedId, mergedBindingsPayload);
      message.success('Визуальный лендинг и формы сохранены');
      await loadLandingDetails(selectedId);
    } catch (err) {
      message.error(err?.details?.detail || err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedId) return;
    setPublishing(true);
    try {
      await landingsApi.publish(selectedId);
      message.success('Лендинг опубликован');
      await loadLandingDetails(selectedId);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось опубликовать лендинг');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleActive = async (checked) => {
    if (!selectedId) return;
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
      ['view_to_start_pct', report?.conversions?.view_to_start_pct || 0],
      ['start_to_submit_pct', report?.conversions?.start_to_submit_pct || 0],
      ['submit_to_lead_pct', report?.conversions?.submit_to_lead_pct || 0],
      ['lead_to_deal_pct', report?.conversions?.lead_to_deal_pct || 0],
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
      ]);

      drawTable('Step Conversion', [
        { label: 'View -> Start', value: formatPercent(report?.conversions?.view_to_start_pct) },
        { label: 'Start -> Submit', value: formatPercent(report?.conversions?.start_to_submit_pct) },
        { label: 'Submit -> Lead', value: formatPercent(report?.conversions?.submit_to_lead_pct) },
        { label: 'Lead -> Deal', value: formatPercent(report?.conversions?.lead_to_deal_pct) },
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
    ? `${window.location.origin}/api/public/landings/${selectedLandingItem.slug}/preview/?token=${previewToken}`
    : '';
  const publicUrl = selectedLandingItem
    ? `${window.location.origin}/api/public/landings/${selectedLandingItem.slug}/`
    : '';

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>
          Landing Builder (React + craft.js)
        </Title>

        <Card title="Новый лендинг">
          <Form layout="vertical" form={createForm}>
            <Row gutter={12}>
              <Col xs={24} md={6}>
                <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                  <Input placeholder="Summer Campaign" />
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
            <Button type="primary" onClick={handleCreateLanding}>Создать</Button>
          </Form>
        </Card>

        <Card title="Визуальный редактор (Tilda-style)">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Выберите лендинг"
                  loading={loading}
                  value={selectedId}
                  onChange={setSelectedId}
                  options={landings.map((l) => ({ value: l.id, label: `${l.title} (${l.slug})` }))}
                />
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <Text type="secondary">Active</Text>
                  <Switch checked={selectedLanding?.is_active} onChange={handleToggleActive} disabled={!selectedLanding} />
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space>
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
                  <Button onClick={handleSaveDraft} loading={saving} disabled={!selectedId}>Сохранить</Button>
                  <Button type="primary" onClick={handlePublish} loading={publishing} disabled={!selectedId}>Publish</Button>
                </Space>
              </Col>
            </Row>

            {selectedLandingItem && (
              <Alert
                type="info"
                showIcon
                message={`Public: ${publicUrl}`}
                description={`Preview: ${previewUrl}`}
              />
            )}

            <CraftBuilder
              frameData={frameData}
              editorKey={editorKey}
              onNodesChange={setCraftSerialized}
              lookups={lookups}
              activeLocale={activeLocale}
              previewMode={previewMode}
            />
          </Space>
        </Card>

        <Card title="Revisions">
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
                    disabled={!selectedId}
                    onClick={async () => {
                      try {
                        await landingsApi.rollback(selectedId, record.id);
                        message.success('Rollback выполнен');
                        await loadLandingDetails(selectedId);
                      } catch (err) {
                        message.error(err?.details?.detail || 'Rollback failed');
                      }
                    }}
                  >
                    Rollback
                  </Button>
                ),
              },
            ]}
          />
        </Card>

        <Card title="Funnel Filters">
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
          <Card title="Funnel Report">
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
          </Card>
        )}
      </Space>
    </div>
  );
}
