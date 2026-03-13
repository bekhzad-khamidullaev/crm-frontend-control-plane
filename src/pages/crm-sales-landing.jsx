import { App, Button, Card, Col, Form, Input, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useTheme } from '../lib/hooks/useTheme.js';

const { Title, Text, Paragraph } = Typography;

const BENEFITS = [
  {
    title: 'Единая воронка продаж',
    body: 'Лиды, сделки, задачи и коммуникации в одном окне без переключений между системами.',
  },
  {
    title: 'Автоматизация рутины',
    body: 'Автонастройка задач, напоминаний и статусов по вашим бизнес-правилам.',
  },
  {
    title: 'Прозрачная аналитика',
    body: 'Метрики команды и каналов в реальном времени, чтобы управлять ростом на основе данных.',
  },
  {
    title: 'Быстрый запуск',
    body: 'Настройка под ваш процесс и старт работы команды в течение 1-3 дней.',
  },
];

const STEPS = [
  { title: 'Демо 30 минут', body: 'Покажем платформу на вашем сценарии продаж.' },
  { title: 'Настройка процесса', body: 'Соберём воронку, роли, статусы и интеграции.' },
  { title: 'Запуск и рост', body: 'Обучим команду и подключим аналитику конверсий.' },
];

export default function CrmSalesLandingPage() {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [submitting, setSubmitting] = useState(false);

  const ui = useMemo(
    () => ({
      pageBg: isDark
        ? 'linear-gradient(180deg, #0a0f1b 0%, #0f172a 50%, #111827 100%)'
        : 'linear-gradient(180deg, #eef4ff 0%, #f8fbff 40%, #ffffff 100%)',
      heroBg: isDark
        ? 'linear-gradient(130deg, #0b1220 0%, #14325a 55%, #1d4ed8 100%)'
        : 'linear-gradient(130deg, #111827 0%, #1d4ed8 65%, #2563eb 100%)',
      cardBg: isDark ? '#111a2c' : '#ffffff',
      cardBorder: isDark ? '#26334d' : '#dbe7ff',
      textMain: isDark ? '#e2e8f0' : '#0f172a',
      textMuted: isDark ? '#b8c2d9' : '#475569',
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
    <div style={{ minHeight: '100vh', background: ui.pageBg, padding: '22px 16px 40px' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <Card
          bordered={false}
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
              <Tag color="gold">SaaS</Tag>
              <Tag color="cyan">B2B Sales</Tag>
            </Space>
            <Title level={1} style={{ color: '#fff', margin: 0, lineHeight: 1.1 }}>
              CRM, которая увеличивает продажи,
              <br />
              а не сложность процессов
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 760, fontSize: 18, marginBottom: 0 }}>
              Объедините лиды, сделки, коммуникации и аналитику в единой системе.
              Получите прогнозируемый рост конверсии и контроль над воронкой в реальном времени.
            </Paragraph>
            <Space wrap>
              <Button size="large" type="primary" style={{ background: '#0f172a' }} href="#crm-contact">
                Запросить демо
              </Button>
              <Button size="large" ghost>
                Скачать презентацию
              </Button>
            </Space>
          </Space>
        </Card>

        <Row gutter={[14, 14]} style={{ marginBottom: 6 }}>
          <Col xs={12} md={6}><Card style={{ borderRadius: 14, background: ui.cardBg, borderColor: ui.cardBorder }}><Statistic title="Рост конверсии" value={27} suffix="%" /></Card></Col>
          <Col xs={12} md={6}><Card style={{ borderRadius: 14, background: ui.cardBg, borderColor: ui.cardBorder }}><Statistic title="Быстрее сделки" value={34} suffix="%" /></Card></Col>
          <Col xs={12} md={6}><Card style={{ borderRadius: 14, background: ui.cardBg, borderColor: ui.cardBorder }}><Statistic title="Запуск" value={3} suffix="дня" /></Card></Col>
          <Col xs={12} md={6}><Card style={{ borderRadius: 14, background: ui.cardBg, borderColor: ui.cardBorder }}><Statistic title="Поддержка" value="24/7" /></Card></Col>
        </Row>

        <Card title="Почему это работает" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder, marginBottom: 16 }}>
          <Row gutter={[14, 14]}>
            {BENEFITS.map((item) => (
              <Col xs={24} md={12} key={item.title}>
                <Card size="small" style={{ borderRadius: 12, minHeight: 126 }}>
                  <Title level={4} style={{ marginTop: 0, color: ui.textMain }}>{item.title}</Title>
                  <Text style={{ color: ui.textMuted }}>{item.body}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card title="Как мы внедряем CRM" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder, marginBottom: 16 }}>
          <Row gutter={[14, 14]}>
            {STEPS.map((step, index) => (
              <Col xs={24} md={8} key={step.title}>
                <Card size="small" style={{ borderRadius: 12, minHeight: 140 }}>
                  <Tag color="blue">Шаг {index + 1}</Tag>
                  <Title level={4} style={{ marginTop: 8, color: ui.textMain }}>{step.title}</Title>
                  <Text style={{ color: ui.textMuted }}>{step.body}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card id="crm-contact" title="Оставьте заявку на демо" style={{ borderRadius: 16, background: ui.cardBg, borderColor: ui.cardBorder }}>
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
            </Row>
            <Button type="primary" htmlType="submit" loading={submitting}>Получить демо и расчёт ROI</Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}
