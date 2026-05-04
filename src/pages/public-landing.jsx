import { Alert, App, Button, Card, Carousel, Col, Input, Row, Space, Spin, Typography } from 'antd';
import {
  EnvironmentOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, landingsApi } from '../lib/api/client';
import ChannelBrandIcon from '../components/channel/ChannelBrandIcon.jsx';
import { useTheme } from '../lib/hooks/useTheme.js';

const { Title, Text } = Typography;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseHashParts() {
  const raw = (window.location.hash || '').replace(/^#/, '');
  const [pathPart = '', queryPart = ''] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  const hashQuery = new URLSearchParams(queryPart || '');

  const slug = parts[1] || '';
  const isPreview = parts[2] === 'preview';
  const token = isPreview ? decodeURIComponent(parts[3] || '') : '';

  return { slug, isPreview, token, hashQuery };
}

function ensureI18n(value, fallback = '') {
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

function tByLocale(props, key, locale, fallback = '') {
  const map = ensureI18n(props?.[`${key}_i18n`], props?.[key] || fallback);
  return map?.[locale] || map?.ru || map?.en || map?.uz || fallback;
}

function readLocale() {
  const saved = String(localStorage.getItem('enterprise_crm_locale') || '').toLowerCase();
  if (saved.startsWith('uz')) return 'uz';
  if (saved.startsWith('en')) return 'en';
  return 'ru';
}

function normalizePhoneHref(value) {
  const normalized = String(value || '').replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : '';
}

function normalizeColor(value) {
  return String(value || '').trim().toLowerCase();
}

function hexToRgb(value) {
  const normalized = normalizeColor(value);
  if (!normalized.startsWith('#')) return null;
  const hex = normalized.slice(1);
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  return null;
}

function relativeLuminance({ r, g, b }) {
  const transform = (v) => {
    const channel = v / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const rr = transform(r);
  const gg = transform(g);
  const bb = transform(b);
  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
}

function contrastRatio(colorA, colorB) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  if (!rgbA || !rgbB) return null;
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveThemeSurfaceColor(value, isDark, lightFallback = '#ffffff', darkFallback = '#111827') {
  if (!value) return isDark ? darkFallback : lightFallback;
  const normalized = normalizeColor(value);
  if (!isDark) return value;
  if (normalized === '#fff' || normalized === '#ffffff' || normalized === '#f8fafc' || normalized === '#f9fafb' || normalized === '#f1f7ff' || normalized === '#fafafa') {
    return darkFallback;
  }
  return value;
}

function resolveThemeTextColor(value, isDark) {
  if (!value) return isDark ? '#e2e8f0' : '#111827';
  const normalized = normalizeColor(value);
  if (!isDark) return value;
  if (normalized === '#111827' || normalized === '#1f2937' || normalized === '#0f172a' || normalized === '#000' || normalized === '#000000') {
    return '#e2e8f0';
  }
  return value;
}

function resolveReadableTextColor(value, background, isDark) {
  const text = resolveThemeTextColor(value, isDark);
  const bg = resolveThemeSurfaceColor(background, isDark, '#ffffff', '#111827');
  const ratio = contrastRatio(text, bg);
  if (ratio !== null && ratio < 4.5) {
    return isDark ? '#e2e8f0' : '#111827';
  }
  return text;
}

function sectionCardStyle(section = {}, isDark = false) {
  const bg = resolveThemeSurfaceColor(section.background, isDark, '#ffffff', '#111827');
  const text = resolveReadableTextColor(section.textColor, section.background, isDark);
  const border = isDark ? '#2d3343' : '#e5e7eb';
  return {
    borderRadius: Number(section.borderRadius || 14),
    background: bg,
    color: text,
    borderColor: border,
    opacity: typeof section.opacity === 'number' ? section.opacity : 1,
    fontFamily: section.fontFamily || 'Inter, system-ui, sans-serif',
    fontSize: section.fontSize ? `${Number(section.fontSize)}px` : undefined,
    backgroundImage: section.backgroundImageUrl ? `url(${section.backgroundImageUrl})` : 'none',
    backgroundSize: section.backgroundSize || 'cover',
    backgroundPosition: section.backgroundPosition || 'center',
    backgroundRepeat: section.backgroundRepeat || 'no-repeat',
    '--landing-card-bg': bg,
    '--landing-card-text': text,
    '--landing-card-border': border,
  };
}

function sectionContentStyle(section = {}) {
  return {
    padding: `${Number(section.paddingY || 12)}px ${Number(section.paddingX || 12)}px`,
  };
}

function SectionImage({ section }) {
  if (!section?.imageUrl) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <img
        src={section.imageUrl}
        alt="section visual"
        style={{
          width: '100%',
          maxHeight: Number(section.imageMaxHeight || 360),
          objectFit: section.imageFit || 'cover',
          borderRadius: Number(section.imageBorderRadius || 12),
          opacity: typeof section.imageOpacity === 'number' ? section.imageOpacity : 1,
        }}
      />
    </div>
  );
}

function readCookieMap() {
  const result = {};
  String(document.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const index = entry.indexOf('=');
      if (index <= 0) return;
      const key = decodeURIComponent(entry.slice(0, index));
      const value = decodeURIComponent(entry.slice(index + 1));
      result[key] = value;
    });
  return result;
}

function normalizeRule(rule) {
  if (!rule || typeof rule !== 'object') return null;
  if (rule.source && rule.key) return rule;
  if (rule.utm_campaign || rule.utm_source || rule.utm_medium || rule.utm_term || rule.utm_content) {
    const key = rule.utm_campaign ? 'campaign' : rule.utm_source ? 'source' : rule.utm_medium ? 'medium' : rule.utm_term ? 'term' : 'content';
    const value = rule.utm_campaign || rule.utm_source || rule.utm_medium || rule.utm_term || rule.utm_content;
    return { source: 'utm', key, equals: value, overrides: rule.overrides || {} };
  }
  if (rule.cookie_key) {
    return {
      source: 'cookie',
      key: rule.cookie_key,
      equals: rule.cookie_value || '',
      overrides: rule.overrides || {},
    };
  }
  return null;
}

function isRuleMatched(rule, context) {
  if (!rule || typeof rule !== 'object') return false;
  const source = String(rule.source || '').toLowerCase();
  const key = String(rule.key || '').trim();
  if (!source || !key) return false;

  const value = source === 'utm'
    ? String((context.utm || {})[key] || '')
    : String((context.cookies || {})[key] || '');
  const expected = String(rule.equals || '');
  const contains = String(rule.contains || '');

  if (expected && value !== expected) return false;
  if (contains && !value.includes(contains)) return false;
  if (!expected && !contains) return Boolean(value);
  return true;
}

function applyPersonalization(section, context) {
  if (!section || typeof section !== 'object') return section;
  const rulesRaw = Array.isArray(section.personalization_rules)
    ? section.personalization_rules
    : Array.isArray(section.dynamic_rules)
      ? section.dynamic_rules
      : [];

  let merged = { ...section };
  for (let i = 0; i < rulesRaw.length; i += 1) {
    const rule = normalizeRule(rulesRaw[i]);
    if (!rule || !isRuleMatched(rule, context)) continue;
    if (rule.overrides && typeof rule.overrides === 'object') {
      merged = { ...merged, ...rule.overrides };
    }
  }

  const campaignMap = section.dynamic_by_utm_campaign;
  const campaign = context?.utm?.campaign || '';
  if (campaign && campaignMap && typeof campaignMap === 'object' && campaignMap[campaign] && typeof campaignMap[campaign] === 'object') {
    merged = { ...merged, ...campaignMap[campaign] };
  }

  return merged;
}

function sanitizeSandboxContent(raw = '') {
  return String(raw || '')
    .replace(/<script[^>]+src=["']http:\/\//gi, '<script data-blocked-src=')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '');
}

function buildSandboxSrcDoc(section = {}) {
  const html = sanitizeSandboxContent(section.custom_html || section.html || '');
  const css = sanitizeSandboxContent(section.custom_css || section.css || '');
  const js = sanitizeSandboxContent(section.custom_js || section.js || '');
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>html,body{margin:0;padding:0;}body{font-family:Inter,system-ui,sans-serif;}${css}</style>
  </head>
  <body>
    ${html}
    ${js ? `<script>${js}</script>` : ''}
  </body>
</html>`;
}

function readOrCreateSessionId(slug) {
  const key = `landing_session_${slug || 'default'}`;
  const existing = String(localStorage.getItem(key) || '').trim();
  if (existing) return existing;
  const generated = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `sid_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  localStorage.setItem(key, generated);
  return generated;
}

function groupSectionsByRows(sections = []) {
  const grouped = new Map();
  sections.forEach((section, idx) => {
    const rowIndex = Number(section.row_index || section.row || Math.floor(idx / 3) + 1);
    const resolvedRow = Number.isFinite(rowIndex) && rowIndex > 0 ? rowIndex : (Math.floor(idx / 3) + 1);
    if (!grouped.has(resolvedRow)) grouped.set(resolvedRow, []);
    const rowItems = grouped.get(resolvedRow);
    if (rowItems.length < 3) {
      rowItems.push({ ...section, __idx: idx, __row: resolvedRow });
    }
  });
  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, items]) => items);
}

export default function PublicLandingPage() {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locale] = useState(readLocale);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [abVariant, setAbVariant] = useState('');
  const [resolvedSlug, setResolvedSlug] = useState('');

  const { slug, isPreview, token, hashQuery } = parseHashParts();
  const landingSlug = slug || resolvedSlug;
  const sessionId = useMemo(
    () => readOrCreateSessionId(slug || window.location.hostname || 'landing'),
    [slug],
  );
  const startedFormsRef = useRef(new Set());
  const viewedFormsRef = useRef(new Set());
  const lastScrollBucketRef = useRef(0);
  const lastClickTsRef = useRef(0);

  const utm = useMemo(() => ({
    source: hashQuery.get('utm_source') || '',
    medium: hashQuery.get('utm_medium') || '',
    campaign: hashQuery.get('utm_campaign') || '',
    term: hashQuery.get('utm_term') || '',
    content: hashQuery.get('utm_content') || '',
  }), [hashQuery]);

  const cookies = useMemo(() => readCookieMap(), [schema?.page?.meta?.title]);

  const trackEvent = async (eventType, payload = {}) => {
    if (!landingSlug || isPreview) return;
    try {
      await landingsApi.trackEvent({
        landing_slug: landingSlug,
        session_id: sessionId,
        event_type: eventType,
        block_id: payload.block_id || '',
        form_key: payload.form_key || '',
        meta: {
          ...payload.meta,
          utm,
          referrer: document.referrer || '',
          ab: abVariant ? { variant: abVariant } : {},
        },
      });
    } catch {
      // analytics failures are non-blocking
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setFormValues({});
      setFormErrors({});
      setResolvedSlug('');
      startedFormsRef.current.clear();
      viewedFormsRef.current.clear();
      lastScrollBucketRef.current = 0;
      try {
        if (isPreview) {
          if (!slug) {
            setError('Preview token URL is invalid.');
            return;
          }
          const data = await landingsApi.publicPreview(slug, token);
          setSchema(data || {});
          setResolvedSlug(String(data?.page?.meta?.landing_slug || slug || ''));
          setAbVariant(String(data?.page?.meta?.ab_assigned_variant || ''));
          return;
        }

        const params = { session_id: sessionId };
        hashQuery.forEach((value, key) => {
          params[key] = value;
        });
        let data = null;
        if (slug) {
          data = await api.get(`/api/public/landings/${slug}/`, { skipAuth: true, params });
        } else {
          data = await landingsApi.publicSchemaByDomain(window.location.hostname, params);
        }
        setSchema(data || {});
        setResolvedSlug(String(data?.page?.meta?.landing_slug || slug || ''));
        setAbVariant(String(data?.page?.meta?.ab_assigned_variant || hashQuery.get('ab_variant') || ''));
      } catch (err) {
        setError(err?.details?.detail || err?.message || 'Failed to load landing.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, isPreview, token, sessionId]);

  useEffect(() => {
    if (isPreview || !landingSlug) return undefined;
    const onScroll = () => {
      const scrollTop = window.scrollY || 0;
      const doc = document.documentElement;
      const maxScroll = Math.max(0, (doc.scrollHeight || 0) - window.innerHeight);
      const pct = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 100;
      const bucket = Math.min(100, Math.max(0, Math.floor(pct / 10) * 10));
      if (bucket <= lastScrollBucketRef.current || bucket === 0) return;
      lastScrollBucketRef.current = bucket;
      trackEvent('cta_click', { meta: { action: 'scroll_depth', depth_pct: bucket } });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [landingSlug, isPreview, abVariant, utm.source, utm.medium, utm.campaign, utm.term, utm.content]);

  useEffect(() => {
    if (isPreview || !landingSlug) return undefined;
    const onClickCapture = (event) => {
      const now = Date.now();
      if (now - lastClickTsRef.current < 200) return;
      lastClickTsRef.current = now;
      const target = event.target;
      const doc = document.documentElement;
      const totalHeight = Math.max(doc.scrollHeight || 0, window.innerHeight);
      const xPercent = Math.round((event.clientX / Math.max(window.innerWidth, 1)) * 100);
      const yPercent = Math.round(((window.scrollY + event.clientY) / Math.max(totalHeight, 1)) * 100);
      const label = target?.textContent ? String(target.textContent).trim().slice(0, 80) : '';
      trackEvent('cta_click', {
        meta: {
          action: 'click',
          x_percent: xPercent,
          y_percent: yPercent,
          target_tag: target?.tagName ? String(target.tagName).toLowerCase() : '',
          target_label: label,
        },
      });
    };
    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, [landingSlug, isPreview, abVariant, utm.source, utm.medium, utm.campaign, utm.term, utm.content]);

  const pageMeta = schema?.page?.meta || {};
  const baseSections = Array.isArray(schema?.page?.sections) ? schema.page.sections : [];
  const personalisedSections = useMemo(
    () => baseSections.map((section) => applyPersonalization(section, { utm, cookies })),
    [baseSections, utm.source, utm.medium, utm.campaign, utm.term, utm.content, cookies],
  );
  const sectionRows = useMemo(() => groupSectionsByRows(personalisedSections), [personalisedSections]);

  useEffect(() => {
    if (isPreview || !landingSlug) return;
    sectionRows.flat().forEach((section) => {
      if (section.type !== 'form') return;
      const blockId = section.blockId || section.block_id || '';
      const formKey = section.formKey || section.form_key || 'lead_main';
      const trackingKey = `${blockId}::${formKey}`;
      if (viewedFormsRef.current.has(trackingKey)) return;
      viewedFormsRef.current.add(trackingKey);
      trackEvent('form_view', {
        block_id: blockId,
        form_key: formKey,
        meta: { action: 'form_view' },
      });
    });
  }, [sectionRows, landingSlug, isPreview]);

  const pageTitle = tByLocale(pageMeta, 'title', locale, 'Landing');
  const pageDescription = tByLocale(pageMeta, 'description', locale, '');

  const handleFieldChange = (sectionKey, section, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [field.key]: value },
    }));
    setFormErrors((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [field.key]: '' },
    }));

    const blockId = section.blockId || section.block_id || '';
    const formKey = section.formKey || section.form_key || 'lead_main';
    const startKey = `${blockId}::${formKey}`;
    if (!startedFormsRef.current.has(startKey) && !isPreview) {
      startedFormsRef.current.add(startKey);
      trackEvent('form_start', {
        block_id: blockId,
        form_key: formKey,
        meta: { action: 'form_start', field_key: field.key },
      });
    }
  };

  const validateFormSection = (section, sectionKey) => {
    const values = formValues[sectionKey] || {};
    const fields = Array.isArray(section.fields) ? section.fields : [];
    const nextErrors = {};

    fields.forEach((field) => {
      const raw = values[field.key];
      const value = typeof raw === 'string' ? raw.trim() : String(raw || '').trim();
      if (field.required && !value) {
        nextErrors[field.key] = 'Поле обязательно';
      } else if (field.type === 'email' && value && !EMAIL_REGEX.test(value)) {
        nextErrors[field.key] = 'Некорректный email';
      }
    });

    setFormErrors((prev) => ({ ...prev, [sectionKey]: nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (section, sectionKey) => {
    if (!validateFormSection(section, sectionKey)) {
      message.error('Проверьте корректность полей формы');
      return;
    }

    const values = formValues[sectionKey] || {};
    const fields = Array.isArray(section.fields) ? section.fields : [];
    const contact = {
      name: String(values.name || values.full_name || values.first_name || ''),
      phone: String(values.phone || ''),
      email: String(values.email || ''),
    };

    const payload = {
      session_id: sessionId,
      block_id: section.blockId || section.block_id || '',
      form_key: section.formKey || section.form_key || 'lead_main',
      contact,
      payload: { ...values },
      utm,
      referrer: document.referrer || '',
      ab_variant: abVariant || '',
    };

    setSubmitting(true);
    try {
      await trackEvent('cta_click', {
        block_id: payload.block_id,
        form_key: payload.form_key,
        meta: { action: 'form_submit_click' },
      });
      if (!landingSlug) {
        message.error('Landing slug is missing.');
        return;
      }
      await landingsApi.submitLead(landingSlug, payload);
      message.success('Заявка отправлена');
      setFormValues((prev) => ({ ...prev, [sectionKey]: {} }));
      setFormErrors((prev) => ({ ...prev, [sectionKey]: {} }));
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось отправить заявку');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSection = (section, key) => {
    const type = section?.type;
    if (type === 'hero') {
      return (
        <Card key={key} className="landing-public-card" style={sectionCardStyle(section, isDark)}>
          <div style={sectionContentStyle(section)}>
            <SectionImage section={section} />
            <Title level={3} style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'title', locale, '')}</Title>
            <Text style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'subtitle', locale, '')}</Text>
          </div>
        </Card>
      );
    }

    if (type === 'text') {
      return (
        <Card key={key} className="landing-public-card" style={sectionCardStyle(section, isDark)}>
          <div style={sectionContentStyle(section)}>
            <SectionImage section={section} />
            <Title level={4} style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'title', locale, '')}</Title>
            <Text style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'body', locale, '')}</Text>
          </div>
        </Card>
      );
    }

    if (type === 'features') {
      return (
        <Card key={key} className="landing-public-card" style={sectionCardStyle(section, isDark)}>
          <div style={sectionContentStyle(section)}>
            <SectionImage section={section} />
            <Title level={4} style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'title', locale, '')}</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {(Array.isArray(section.items) ? section.items : []).map((item, i) => (
                <Card key={`${key}-item-${i}`} size="small">{item}</Card>
              ))}
            </Space>
          </div>
        </Card>
      );
    }

    if (type === 'cta') {
      return (
        <Card key={key} className="landing-public-card" style={sectionCardStyle(section, isDark)}>
          <div style={sectionContentStyle(section)}>
            <SectionImage section={section} />
            <Title level={4} style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'title', locale, '')}</Title>
            <Text style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'body', locale, '')}</Text>
            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                onClick={() => trackEvent('cta_click', { meta: { action: 'cta_block_click', section_key: key } })}
              >
                {tByLocale(section, 'buttonText', locale, 'Перейти')}
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (type === 'carousel') {
      const images = Array.isArray(section.images) ? section.images.filter(Boolean) : [];
      return (
        <Card key={key} className="landing-public-card" style={sectionCardStyle(section, isDark)}>
          <div style={sectionContentStyle(section)}>
            <SectionImage section={section} />
            <Title level={4} style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'title', locale, '')}</Title>
            {images.length > 0 ? (
              <Carousel autoplay dots>
                {images.map((url, i) => (
                  <div key={`${key}-carousel-${i}`}>
                    <img
                      src={url}
                      alt={`slide-${i + 1}`}
                      style={{
                        width: '100%',
                        height: Number(section.slideHeight || 340),
                        objectFit: section.imageFit || 'cover',
                        borderRadius: Number(section.imageBorderRadius || 12),
                      }}
                    />
                  </div>
                ))}
              </Carousel>
            ) : (
              <Text type="secondary">Карусель пустая</Text>
            )}
          </div>
        </Card>
      );
    }

    if (type === 'contacts') {
      const socials = [
        { key: 'wa', label: 'WhatsApp', url: section.whatsapp, channel: 'whatsapp' },
        { key: 'tg', label: 'Telegram', url: section.telegram, channel: 'telegram' },
        { key: 'ig', label: 'Instagram', url: section.instagram, channel: 'instagram' },
        { key: 'fb', label: 'Facebook', url: section.facebook, channel: 'facebook' },
        { key: 'in', label: 'LinkedIn', url: section.linkedin, icon: LinkedinOutlined },
      ].filter((item) => item.url);
      return (
        <Card key={key} className="landing-public-card" style={sectionCardStyle(section, isDark)}>
          <div style={sectionContentStyle(section)}>
            <SectionImage section={section} />
            <Title level={4} style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'title', locale, 'Контакты')}</Title>
            <Text style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'subtitle', locale, '')}</Text>
            <Space direction="vertical" size="small" style={{ marginTop: 12 }}>
              {section.phone ? <Text><PhoneOutlined /> Телефон: <a href={normalizePhoneHref(section.phone)}>{section.phone}</a></Text> : null}
              {section.email ? <Text><MailOutlined /> Email: <a href={`mailto:${section.email}`}>{section.email}</a></Text> : null}
              {section.address ? <Text><EnvironmentOutlined /> Адрес: {section.address}</Text> : null}
              {socials.length > 0 ? (
                <Space wrap>
                  {socials.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.key}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={item.channel ? <ChannelBrandIcon channel={item.channel} size={16} /> : (Icon ? <Icon /> : null)}
                        onClick={() => trackEvent('cta_click', { meta: { action: 'social_click', social: item.key } })}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Space>
              ) : null}
            </Space>
          </div>
        </Card>
      );
    }

    if (type === 'form') {
      const sectionKey = key;
      const fields = Array.isArray(section.fields) ? section.fields : [];
      const sectionValues = formValues[sectionKey] || {};
      const sectionErrors = formErrors[sectionKey] || {};
      return (
        <Card key={key} className="landing-public-card" style={sectionCardStyle(section, isDark)}>
          <div style={sectionContentStyle(section)}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <SectionImage section={section} />
              <div>
                <Title level={4} style={{ marginBottom: 0, color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'title', locale, 'Форма')}</Title>
                <Text style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>{tByLocale(section, 'subtitle', locale, '')}</Text>
              </div>

              {fields.map((field) => (
                <Space key={field.key} direction="vertical" size={4} style={{ width: '100%' }}>
                  {field.type === 'textarea' ? (
                    <Input.TextArea
                      rows={4}
                      placeholder={tByLocale(field, 'label', locale, field.label || field.key)}
                      value={sectionValues[field.key] || ''}
                      status={sectionErrors[field.key] ? 'error' : ''}
                      onChange={(e) => handleFieldChange(sectionKey, section, field, e.target.value)}
                    />
                  ) : (
                    <Input
                      type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                      placeholder={tByLocale(field, 'label', locale, field.label || field.key)}
                      value={sectionValues[field.key] || ''}
                      status={sectionErrors[field.key] ? 'error' : ''}
                      onChange={(e) => handleFieldChange(sectionKey, section, field, e.target.value)}
                    />
                  )}
                  {sectionErrors[field.key] ? <Text type="danger">{sectionErrors[field.key]}</Text> : null}
                </Space>
              ))}

              <Button type="primary" loading={submitting} onClick={() => handleSubmit(section, sectionKey)}>
                {tByLocale(section, 'buttonText', locale, 'Отправить')}
              </Button>
            </Space>
          </div>
        </Card>
      );
    }

    if (type === 'custom_html') {
      return (
        <Card key={key} className="landing-public-card" style={sectionCardStyle(section, isDark)}>
          <div style={sectionContentStyle(section)}>
            <Title level={4} style={{ color: resolveReadableTextColor(section.textColor, section.background, isDark) }}>
              {tByLocale(section, 'title', locale, 'Custom HTML')}
            </Title>
            <iframe
              title={`${key}-custom-html`}
              sandbox="allow-forms allow-scripts allow-popups"
              referrerPolicy="no-referrer"
              srcDoc={buildSandboxSrcDoc(section)}
              style={{
                width: '100%',
                minHeight: Number(section.iframeHeight || section.iframe_height || 280),
                border: `1px solid ${isDark ? '#2d3343' : '#dbe5f4'}`,
                borderRadius: 12,
                background: '#ffffff',
              }}
            />
          </div>
        </Card>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 16px' }}>
        <Alert type="error" showIcon message="Landing load error" description={error} />
      </div>
    );
  }

  return (
    <div className="landing-public-page" style={{ minHeight: '100vh', background: isDark ? '#0b1220' : '#f8fafc' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 16px 48px' }}>
        {isPreview && (
          <Alert
            style={{ marginBottom: 16 }}
            type="warning"
            showIcon
            message="Preview mode"
            description="Вы просматриваете черновик лендинга."
          />
        )}

        <Card style={{ borderRadius: 14, marginBottom: 16 }}>
          <Title level={2} style={{ marginTop: 0 }}>{pageTitle}</Title>
          {pageDescription ? <Text type="secondary">{pageDescription}</Text> : null}
        </Card>

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {sectionRows.map((rowSections, rowIndex) => {
            const columns = Math.min(3, Math.max(1, rowSections.length));
            const mdSpan = Math.floor(24 / columns);
            return (
              <Row key={`row-${rowIndex}`} gutter={[12, 12]}>
                {rowSections.map((section) => {
                  const key = section?.id || `${section?.type}-${section.__idx}`;
                  return (
                    <Col key={key} xs={24} md={mdSpan}>
                      {renderSection(section, key)}
                    </Col>
                  );
                })}
              </Row>
            );
          })}
        </Space>
      </div>
    </div>
  );
}
