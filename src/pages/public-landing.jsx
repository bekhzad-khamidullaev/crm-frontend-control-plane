import { Alert, App, Button, Card, Carousel, Input, Space, Spin, Typography } from 'antd';
import {
  EnvironmentOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api, landingsApi } from '../lib/api/client';
import ChannelBrandIcon from '../components/channel/ChannelBrandIcon.jsx';
import { useTheme } from '../lib/hooks/useTheme.js';

const { Title, Text } = Typography;

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

  const { slug, isPreview, token, hashQuery } = parseHashParts();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (!slug) {
          setError('Landing slug is missing in URL.');
          return;
        }

        if (isPreview) {
          const data = await landingsApi.publicPreview(slug, token);
          setSchema(data || {});
          return;
        }

        const params = {};
        hashQuery.forEach((value, key) => {
          params[key] = value;
        });
        const data = await api.get(`/api/public/landings/${slug}/`, { skipAuth: true, params });
        setSchema(data || {});
      } catch (err) {
        setError(err?.details?.detail || err?.message || 'Failed to load landing.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, isPreview, token]);

  const pageMeta = schema?.page?.meta || {};
  const sections = Array.isArray(schema?.page?.sections) ? schema.page.sections : [];

  const pageTitle = tByLocale(pageMeta, 'title', locale, 'Landing');
  const pageDescription = tByLocale(pageMeta, 'description', locale, '');

  const handleSubmit = async (section) => {
    const fields = Array.isArray(section.fields) ? section.fields : [];
    const contact = {
      name: fields.find((f) => f.type === 'text' && f.key === 'name') ? String(formValues.name || '') : String(formValues.name || ''),
      phone: String(formValues.phone || ''),
      email: String(formValues.email || ''),
    };

    const payload = {
      block_id: section.blockId || section.block_id || '',
      form_key: section.formKey || section.form_key || 'lead_main',
      contact,
      payload: { ...formValues },
      utm: {
        source: hashQuery.get('utm_source') || '',
        medium: hashQuery.get('utm_medium') || '',
        campaign: hashQuery.get('utm_campaign') || '',
      },
      referrer: document.referrer || '',
    };

    setSubmitting(true);
    try {
      await landingsApi.submitLead(slug, payload);
      message.success('Заявка отправлена');
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось отправить заявку');
    } finally {
      setSubmitting(false);
    }
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
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 16px 48px' }}>
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
          {sections.map((section, idx) => {
            const type = section?.type;
            const key = section?.id || `${type}-${idx}`;

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
                <Card key={key} style={sectionCardStyle(section)}>
                  <div style={sectionContentStyle(section)}>
                    <SectionImage section={section} />
                    <Title level={4} style={{ color: section.textColor || '#111827' }}>{tByLocale(section, 'title', locale, 'Контакты')}</Title>
                    <Text style={{ color: section.textColor || '#111827' }}>{tByLocale(section, 'subtitle', locale, '')}</Text>
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
              const fields = Array.isArray(section.fields) ? section.fields : [];
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
                        <Input
                          key={field.key}
                          placeholder={tByLocale(field, 'label', locale, field.label || field.key)}
                          value={formValues[field.key] || ''}
                          onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        />
                      ))}

                      <Button type="primary" loading={submitting} onClick={() => handleSubmit(section)}>
                        {tByLocale(section, 'buttonText', locale, 'Отправить')}
                      </Button>
                    </Space>
                  </div>
                </Card>
              );
            }

            return null;
          })}
        </Space>
      </div>
    </div>
  );
}
