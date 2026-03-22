import { App, Button, Card, Col, Collapse, Form, Input, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useTheme } from '../lib/hooks/useTheme.js';

const { Title, Text, Paragraph } = Typography;

const VALUE_PILLARS = [
  {
    title: 'Одна платформа вместо 7 инструментов',
    body: 'Лиды, сделки, задачи, звонки, email и отчеты работают в едином контуре без хаоса.',
    accent: '#0ea5e9',
  },
  {
    title: 'Автоматизация, которая экономит часы',
    body: 'Сценарии и триггеры снимают рутину с менеджеров и освобождают время для продаж.',
    accent: '#22c55e',
  },
  {
    title: 'Прозрачная аналитика воронки',
    body: 'Вы видите узкие места по каналам, этапам и сотрудникам в режиме реального времени.',
    accent: '#f59e0b',
  },
  {
    title: 'Быстрый запуск без боли',
    body: 'Внедряем CRM под ваши процессы за 1-3 дня, обучаем команду и доводим до результата.',
    accent: '#3b82f6',
  },
];

const ROLE_SCENARIOS = [
  {
    role: 'Для собственника',
    result: 'Контроль выручки и прогноз продаж без ручных таблиц',
    details: 'Смотрите реальную картину по pipeline, отделам и марже в 2 клика.',
  },
  {
    role: 'Для РОПа',
    result: 'Рост конверсии и дисциплины команды',
    details: 'Автозадачи, SLA, контроль просрочек и аналитика по каждому менеджеру.',
  },
  {
    role: 'Для менеджера',
    result: 'Меньше рутины, больше закрытых сделок',
    details: 'Все коммуникации и история клиента в карточке, шаблоны и быстрые действия.',
  },
];

const IMPLEMENTATION_STEPS = [
  {
    title: 'Диагностика текущей воронки',
    body: 'Фиксируем, где теряются лиды и почему падает конверсия на этапах.',
  },
  {
    title: 'Сборка CRM-процесса под бизнес',
    body: 'Настраиваем этапы, права, интеграции и автоматизации под вашу модель продаж.',
  },
  {
    title: 'Запуск + поддержка роста',
    body: 'Обучаем команду, включаем дашборды и сопровождаем первые циклы продаж.',
  },
];

const PRICING = [
  {
    plan: 'Starter',
    price: '$19',
    period: '/user/mo',
    features: ['Лиды и сделки', 'Базовые отчеты', 'Email и задачи', 'SMB install profile'],
    recommended: false,
  },
  {
    plan: 'Sales',
    price: '$39',
    period: '/user/mo',
    features: ['Все из Starter', 'Автоматизация процессов', 'Сквозная аналитика', 'Sales faststart'],
    recommended: true,
  },
  {
    plan: 'Omnichannel',
    price: '$79',
    period: '/user/mo',
    features: ['Messenger-first workspace', 'VoIP + chat', 'Маркетинг и SLA', 'Omnichannel install profile'],
    recommended: false,
  },
  {
    plan: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['ERP-adjacent модули', 'Документы, invoicing и fulfillment', 'Marketplace readiness', 'Миграция и обучение'],
    recommended: false,
  },
  {
    plan: 'On-prem Enterprise',
    price: 'Custom',
    period: '',
    features: ['On-prem secure profile', 'Compliance и partner delivery', 'Расширенные add-ons', 'Air-gapped rollout'],
    recommended: false,
  },
];

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'Сколько времени занимает внедрение CRM?',
    children: 'Обычно 1-3 дня для базового запуска и 2-4 недели для полноценной автоматизации под сложные процессы.',
  },
  {
    key: '2',
    label: 'Можно ли перенести данные из текущей CRM или Excel?',
    children: 'Да. Мы помогаем с миграцией контактов, сделок, задач и исторических данных с валидацией качества.',
  },
  {
    key: '3',
    label: 'Есть ли интеграции с телефонией и мессенджерами?',
    children: 'Да. Поддерживаются популярные каналы коммуникации, webhooks и API для корпоративных сценариев.',
  },
  {
    key: '4',
    label: 'Как быстро увидеть ROI от внедрения?',
    children: 'Первые эффекты по дисциплине и скорости обработки лидов обычно видны в первые 2-3 недели.',
  },
];

export default function CrmSalesLandingPage() {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [submitting, setSubmitting] = useState(false);

  const ui = useMemo(
    () => ({
      pageBg: isDark
        ? 'radial-gradient(circle at 10% 5%, #1e293b 0%, #0f172a 35%, #0b1220 100%)'
        : 'radial-gradient(circle at 5% 5%, #dbeafe 0%, #eef6ff 36%, #f8fbff 100%)',
      heroBg: isDark
        ? 'linear-gradient(135deg, #0b1220 0%, #0f2748 48%, #0a4d86 100%)'
        : 'linear-gradient(135deg, #0b1e3b 0%, #0f3d77 48%, #0ea5e9 100%)',
      cardBg: isDark ? '#111a2c' : '#ffffff',
      cardBorder: isDark ? '#26334d' : '#dbe7ff',
      textMain: isDark ? '#e2e8f0' : '#0f172a',
      textMuted: isDark ? '#b8c2d9' : '#475569',
      softGlass: isDark ? 'rgba(17, 26, 44, 0.55)' : 'rgba(255, 255, 255, 0.62)',
      sectionShadow: isDark ? '0 14px 34px rgba(0,0,0,0.35)' : '0 14px 34px rgba(15, 23, 42, 0.08)',
    }),
    [isDark],
  );

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      message.success(`Спасибо, ${values.name}! Мы свяжемся с вами в ближайшее время.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: ui.pageBg, padding: '22px 16px 40px', fontFamily: '"Manrope", "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <style>
          {`
            .crm-sales-reveal {
              animation: crmSalesReveal .55s ease both;
            }
            @keyframes crmSalesReveal {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
        <Card
          bordered={false}
          className="crm-sales-reveal"
          style={{
            borderRadius: 20,
            background: ui.heroBg,
            color: '#fff',
            marginBottom: 18,
            boxShadow: isDark ? '0 16px 34px rgba(0,0,0,0.42)' : '0 14px 30px rgba(37, 99, 235, 0.25)',
          }}
          bodyStyle={{ padding: 28 }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space wrap>
              <Tag color="blue">Enterprise CRM</Tag>
              <Tag color="geekblue">B2B Sales OS</Tag>
              <Tag color="cyan">Implementation Included</Tag>
            </Space>
            <Title level={1} style={{ color: '#fff', margin: 0, lineHeight: 1.1 }}>
              Превратите хаос продаж
              <br />
              в управляемую систему роста
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 760, fontSize: 18, marginBottom: 0 }}>
              Enterprise CRM объединяет воронку, коммуникации и аналитику в одной платформе.
              Получайте больше сделок без увеличения штата и ручной рутины.
            </Paragraph>
            <Space wrap>
              <Button size="large" type="primary" style={{ background: '#0f172a', borderColor: '#0f172a' }} href="#crm-contact">
                Получить персональное демо
              </Button>
              <Button size="large" ghost href="#crm-pricing">
                Посмотреть тарифы
              </Button>
            </Space>
          </Space>
        </Card>

        <Row gutter={[14, 14]} style={{ marginBottom: 12 }}>
          <Col xs={12} md={6}><Card className="crm-sales-reveal" style={{ borderRadius: 14, background: ui.cardBg, borderColor: ui.cardBorder, boxShadow: ui.sectionShadow }}><Statistic title="Средний рост конверсии" value={27} suffix="%" /></Card></Col>
          <Col xs={12} md={6}><Card className="crm-sales-reveal" style={{ borderRadius: 14, background: ui.cardBg, borderColor: ui.cardBorder, boxShadow: ui.sectionShadow }}><Statistic title="Скорость сделки" value={34} suffix="%" /></Card></Col>
          <Col xs={12} md={6}><Card className="crm-sales-reveal" style={{ borderRadius: 14, background: ui.cardBg, borderColor: ui.cardBorder, boxShadow: ui.sectionShadow }}><Statistic title="Время запуска" value={3} suffix="дня" /></Card></Col>
          <Col xs={12} md={6}><Card className="crm-sales-reveal" style={{ borderRadius: 14, background: ui.cardBg, borderColor: ui.cardBorder, boxShadow: ui.sectionShadow }}><Statistic title="Поддержка" value="24/7" /></Card></Col>
        </Row>

        <Card className="crm-sales-reveal" title="Почему Enterprise CRM дает результат" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder, marginBottom: 16, boxShadow: ui.sectionShadow }}>
          <Row gutter={[14, 14]}>
            {VALUE_PILLARS.map((item) => (
              <Col xs={24} md={12} key={item.title}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    minHeight: 132,
                    borderColor: item.accent,
                    background: isDark ? 'rgba(15, 23, 42, 0.55)' : '#fbfdff',
                  }}
                >
                  <Title level={4} style={{ marginTop: 0, color: ui.textMain, fontFamily: '"Space Grotesk", "Manrope", sans-serif' }}>{item.title}</Title>
                  <Text style={{ color: ui.textMuted }}>{item.body}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card className="crm-sales-reveal" title="Ценность для каждой роли" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder, marginBottom: 16, boxShadow: ui.sectionShadow }}>
          <Row gutter={[14, 14]}>
            {ROLE_SCENARIOS.map((item) => (
              <Col xs={24} md={8} key={item.role}>
                <Card size="small" style={{ borderRadius: 12, minHeight: 178, background: ui.softGlass, backdropFilter: 'blur(6px)' }}>
                  <Tag color="blue">{item.role}</Tag>
                  <Title level={4} style={{ marginTop: 8, color: ui.textMain, minHeight: 60 }}>{item.result}</Title>
                  <Text style={{ color: ui.textMuted }}>{item.details}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card className="crm-sales-reveal" title="Как мы внедряем CRM" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder, marginBottom: 16, boxShadow: ui.sectionShadow }}>
          <Row gutter={[14, 14]}>
            {IMPLEMENTATION_STEPS.map((step, index) => (
              <Col xs={24} md={8} key={step.title}>
                <Card size="small" style={{ borderRadius: 12, minHeight: 152 }}>
                  <Tag color={index === 1 ? 'cyan' : 'blue'}>Шаг {index + 1}</Tag>
                  <Title level={4} style={{ marginTop: 8, color: ui.textMain }}>{step.title}</Title>
                  <Text style={{ color: ui.textMuted }}>{step.body}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card id="crm-pricing" className="crm-sales-reveal" title="Тарифы" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder, marginBottom: 16, boxShadow: ui.sectionShadow }}>
          <Row gutter={[14, 14]}>
            {PRICING.map((item) => (
              <Col xs={24} md={8} key={item.plan}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    minHeight: 286,
                    borderColor: item.recommended ? '#0ea5e9' : ui.cardBorder,
                    boxShadow: item.recommended ? '0 10px 26px rgba(14,165,233,0.22)' : 'none',
                  }}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space>
                      <Title level={4} style={{ margin: 0, color: ui.textMain }}>{item.plan}</Title>
                      {item.recommended ? <Tag color="cyan">Популярный</Tag> : null}
                    </Space>
                    <div>
                      <Title level={2} style={{ margin: 0, color: ui.textMain }}>{item.price}</Title>
                      <Text type="secondary">{item.period}</Text>
                    </div>
                    <Space direction="vertical" size={4}>
                      {item.features.map((feature) => (
                        <Text key={feature} style={{ color: ui.textMuted }}>• {feature}</Text>
                      ))}
                    </Space>
                    <Button type={item.recommended ? 'primary' : 'default'} href="#crm-contact">
                      Выбрать {item.plan}
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card className="crm-sales-reveal" title="FAQ" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder, marginBottom: 16, boxShadow: ui.sectionShadow }}>
          <Collapse items={FAQ_ITEMS} />
        </Card>

        <Card id="crm-contact" className="crm-sales-reveal" title="Запросите демо и персональный план внедрения" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder, boxShadow: ui.sectionShadow }}>
          <Form layout="vertical" onFinish={onSubmit}>
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item label="Имя" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
                  <Input placeholder="Иван" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Телефон" name="phone" rules={[{ required: true, message: 'Введите телефон' }]}>
                  <Input placeholder="+998 90 123 45 67" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Компания" name="company">
                  <Input placeholder="Название компании" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Рабочий email" name="email" rules={[{ type: 'email', message: 'Введите корректный email' }]}>
                  <Input placeholder="team@company.com" />
                </Form.Item>
              </Col>
            </Row>
            <Space wrap>
              <Button type="primary" htmlType="submit" loading={submitting}>Получить демо и расчёт ROI</Button>
              <Text type="secondary">Ответим в течение 15 минут в рабочее время.</Text>
            </Space>
          </Form>
        </Card>
      </div>
    </div>
  );
}
