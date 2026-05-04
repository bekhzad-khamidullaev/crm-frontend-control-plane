import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Form,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import type { CollapseProps, FormProps } from 'antd';
import { useMemo, useState } from 'react';
// @ts-ignore local JS hook has no d.ts in current codebase
import { useTheme } from '../../../lib/hooks/useTheme.js';
import type { EnterpriseCrmPromoLandingProps, EnterpriseCrmPromoLeadValues } from './interface';
import './index.css';

const { Title, Paragraph, Text } = Typography;

const VALUE_METRICS = [
  { title: 'Рост MQL -> SQL', value: 24, suffix: '%' },
  { title: 'Сокращение first response', value: 31, prefix: '-', suffix: '%' },
  { title: 'Доступность платформы', value: 99.95, suffix: '%' },
  { title: 'Сокращение handoff-потерь', value: 35, suffix: '%' },
];

const BENEFITS = [
  {
    title: 'Управляемый pipeline',
    body: 'Единая воронка со статусами, SLA и ответственными по каждому этапу сделки.',
  },
  {
    title: 'Омниканал в едином окне',
    body: 'Email, мессенджеры и звонки в клиентской карточке без переключения между системами.',
  },
  {
    title: 'Автоматизация рутины',
    body: 'Сценарии задач и эскалаций снижают ручную нагрузку и удерживают SLA.',
  },
  {
    title: 'Прозрачная аналитика',
    body: 'Онлайн-дашборды по конверсии, retention и производительности команд.',
  },
  {
    title: 'Быстрый онбординг',
    body: 'Новые менеджеры выходят в рабочий ритм через playbook и готовые шаблоны.',
  },
  {
    title: 'Enterprise-безопасность',
    body: 'Ролевой доступ, аудит действий и контроль хранения данных для крупных компаний.',
  },
];

const IMPLEMENTATION_STEPS = [
  {
    title: 'Диагностика узких мест',
    body: 'Фиксируем текущие ограничения воронки и целевые KPI на квартал.',
  },
  {
    title: 'Проектирование процессов',
    body: 'Собираем роли, SLA, маршруты согласований и правила автоматизаций.',
  },
  {
    title: 'Интеграции и запуск',
    body: 'Подключаем каналы, переносим данные и запускаем команды в едином контуре.',
  },
  {
    title: 'Оптимизация под ROI',
    body: 'Каждые 2 недели корректируем сценарии и отчеты на основе фактических метрик.',
  },
];

const FAQ_ITEMS: CollapseProps['items'] = [
  {
    key: '1',
    label: 'Сколько длится запуск Enterprise CRM в enterprise-сегменте?',
    children: 'Базовый контур запускается за 6-8 недель. Полное масштабирование по нескольким юнитам занимает 3-5 месяцев.',
  },
  {
    key: '2',
    label: 'Можно интегрировать Enterprise CRM с нашей телефонией и ERP?',
    children: 'Да. Используем API и коннекторы, порядок интеграций фиксируем в плане внедрения до старта работ.',
  },
  {
    key: '3',
    label: 'Как быстро команда адаптируется к новой системе?',
    children: 'Role-based обучение и шаблоны процессов позволяют команде начать работу уже в первую неделю после go-live.',
  },
  {
    key: '4',
    label: 'Какие гарантии по поддержке и надежности?',
    children: 'Для enterprise-пакетов доступны SLA 24/7, выделенный success-подход и регулярные ревью KPI.',
  },
];

const TEAM_SIZE_OPTIONS = [
  { value: '50-100', label: '50-100 сотрудников' },
  { value: '100-300', label: '100-300 сотрудников' },
  { value: '300-1000', label: '300-1000 сотрудников' },
  { value: '1000+', label: '1000+ сотрудников' },
];

function emitPromoEvent(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const dataLayerRef = ((window as any).dataLayer = (window as any).dataLayer || []);
  dataLayerRef.push({
    event,
    ts: new Date().toISOString(),
    ...payload,
  });
}

export default function EnterpriseCrmPromoLanding({ onRequestDemo }: EnterpriseCrmPromoLandingProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EnterpriseCrmPromoLeadValues>();
  const [submitting, setSubmitting] = useState(false);
  const { theme } = useTheme();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const rootClassName = useMemo(
    () =>
      theme === 'dark'
        ? 'component_EnterpriseCrmPromoLanding component_EnterpriseCrmPromoLanding_dark'
        : 'component_EnterpriseCrmPromoLanding',
    [theme],
  );

  const onFinish: FormProps<EnterpriseCrmPromoLeadValues>['onFinish'] = async (values) => {
    setSubmitting(true);
    emitPromoEvent('ecrm_promo_submit_attempt');
    try {
      if (onRequestDemo) {
        await onRequestDemo(values);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      message.success('Заявка принята. Команда Enterprise CRM свяжется с вами в течение рабочего дня.');
      emitPromoEvent('ecrm_promo_submit_success', { teamSize: values.teamSize });
      form.resetFields();
    } catch {
      message.error('Не удалось отправить заявку. Попробуйте повторить через несколько минут.');
      emitPromoEvent('ecrm_promo_submit_error');
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed: FormProps<EnterpriseCrmPromoLeadValues>['onFinishFailed'] = () => {
    message.warning('Заполните обязательные поля формы.');
    emitPromoEvent('ecrm_promo_validation_failed');
  };

  return (
    <div className={rootClassName}>
      <div className="component_EnterpriseCrmPromoLanding_container">
        <Card className="component_EnterpriseCrmPromoLanding_hero" variant="borderless">
          <Space orientation="vertical" size={14} style={{ width: '100%' }}>
            <img
              className="component_EnterpriseCrmPromoLanding_logo"
              src="/src/assets/brand/logo.svg"
              alt="Enterprise CRM logo"
              loading="eager"
            />
            <Space wrap>
              <Tag color="blue">Enterprise CRM</Tag>
              <Tag color="cyan">Enterprise CRM</Tag>
              <Tag color="geekblue">Sales + Service + Omnichannel</Tag>
            </Space>
            <Title level={1} className="component_EnterpriseCrmPromoLanding_title">
              Управляйте полным клиентским циклом в Enterprise CRM и ускорьте цикл сделки до 27% за первые 90 дней
            </Title>
            <Paragraph className="component_EnterpriseCrmPromoLanding_subtitle">
              Платформа объединяет продажи, сервис, коммуникации и аналитику в одном контуре.
              Команды работают по единому стандарту процессов, а руководители видят bottleneck в реальном времени.
            </Paragraph>
            <Space wrap size="middle">
              <Button
                type="primary"
                size="large"
                href="#ecrm-lead-form"
                onClick={() => emitPromoEvent('ecrm_promo_click_request_demo')}
                block={isMobile}
              >
                Запросить демо
              </Button>
              <Button
                size="large"
                href="#ecrm-offer"
                onClick={() => emitPromoEvent('ecrm_promo_click_pricing')}
                block={isMobile}
              >
                Получить расчет ROI
              </Button>
            </Space>
          </Space>
        </Card>

        <Row gutter={[16, 16]} className="component_EnterpriseCrmPromoLanding_metrics">
          {VALUE_METRICS.map((metric) => (
            <Col xs={12} md={6} key={metric.title}>
              <Card size="small" className="component_EnterpriseCrmPromoLanding_metricCard">
                <Statistic title={metric.title} value={metric.value} suffix={metric.suffix} prefix={metric.prefix} />
              </Card>
            </Col>
          ))}
        </Row>

        <Card title="Что тормозит рост без единой CRM" className="component_EnterpriseCrmPromoLanding_sectionCard">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card size="small" className="component_EnterpriseCrmPromoLanding_splitCard">
                <Title level={4}>Проблема</Title>
                <ul>
                  <li>Лиды теряются при передаче между отделами.</li>
                  <li>Команда работает в разных интерфейсах и таблицах.</li>
                  <li>Отчеты опаздывают, решения принимаются “вслепую”.</li>
                </ul>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" className="component_EnterpriseCrmPromoLanding_splitCard">
                <Title level={4}>Решение Enterprise CRM</Title>
                <ul>
                  <li>Единая карточка клиента с историей всех касаний.</li>
                  <li>Автосценарии задач, эскалаций и контроль SLA.</li>
                  <li>Дашборды по ролям для быстрых управленческих решений.</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title="Ключевые выгоды для enterprise-команд" className="component_EnterpriseCrmPromoLanding_sectionCard">
          <Row gutter={[14, 14]}>
            {BENEFITS.map((item) => (
              <Col xs={24} md={12} key={item.title}>
                <Card size="small" className="component_EnterpriseCrmPromoLanding_benefitCard">
                  <Title level={5}>{item.title}</Title>
                  <Text type="secondary">{item.body}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card title="Как проходит внедрение Enterprise CRM" className="component_EnterpriseCrmPromoLanding_sectionCard">
          <Row gutter={[14, 14]}>
            {IMPLEMENTATION_STEPS.map((step, index) => (
              <Col xs={24} md={12} key={step.title}>
                <Card size="small" className="component_EnterpriseCrmPromoLanding_stepCard">
                  <Tag color={index === 1 ? 'cyan' : 'blue'}>Шаг {index + 1}</Tag>
                  <Title level={5}>{step.title}</Title>
                  <Text type="secondary">{step.body}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card id="ecrm-offer" title="Формат запуска" className="component_EnterpriseCrmPromoLanding_sectionCard">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card size="small" className="component_EnterpriseCrmPromoLanding_offerCard">
                <Title level={4}>Implementation Sprint</Title>
                <Text type="secondary">6 недель</Text>
                <ul>
                  <li>1 ключевая воронка + SLA</li>
                  <li>Подключение 2 каналов</li>
                  <li>Обучение core-команды</li>
                </ul>
                <Button href="#ecrm-lead-form" onClick={() => emitPromoEvent('ecrm_promo_click_offer_sprint')}>
                  Запросить план
                </Button>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" className="component_EnterpriseCrmPromoLanding_offerCard component_EnterpriseCrmPromoLanding_offerCardFeatured">
                <Tag color="green">Выбор enterprise-команд</Tag>
                <Title level={4}>Enterprise Annual</Title>
                <Text type="secondary">Индивидуально</Text>
                <ul>
                  <li>Sales + Service + Retention контур</li>
                  <li>Омниканал и API-интеграции</li>
                  <li>Quarterly ROI review</li>
                </ul>
                <Button type="primary" href="#ecrm-lead-form" onClick={() => emitPromoEvent('ecrm_promo_click_offer_annual')}>
                  Получить КП
                </Button>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" className="component_EnterpriseCrmPromoLanding_offerCard">
                <Title level={4}>Enterprise Plus</Title>
                <Text type="secondary">SLA 24/7</Text>
                <ul>
                  <li>Выделенный контур безопасности</li>
                  <li>Кастомные роли и бизнес-процессы</li>
                  <li>Приоритетная поддержка</li>
                </ul>
                <Button href="#ecrm-lead-form" onClick={() => emitPromoEvent('ecrm_promo_click_offer_plus')}>
                  Обсудить архитектуру
                </Button>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title="FAQ" className="component_EnterpriseCrmPromoLanding_sectionCard">
          <Collapse items={FAQ_ITEMS} />
        </Card>

        <Card
          id="ecrm-lead-form"
          title="Запросить демо и персональный план внедрения"
          className="component_EnterpriseCrmPromoLanding_sectionCard"
        >
          <Form<EnterpriseCrmPromoLeadValues>
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item name="name" label="Имя и фамилия" rules={[{ required: true, message: 'Введите имя' }]}>
                  <Input placeholder="Иван Иванов" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="workEmail"
                  label="Рабочий email"
                  rules={[
                    { required: true, message: 'Введите email' },
                    { type: 'email', message: 'Введите корректный email' },
                  ]}
                >
                  <Input placeholder="team@company.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="company" label="Компания" rules={[{ required: true, message: 'Введите компанию' }]}>
                  <Input placeholder="ООО Ромашка" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="role" label="Роль">
                  <Input placeholder="CRO / Head of Sales" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="teamSize"
                  label="Размер команды"
                  rules={[{ required: true, message: 'Выберите размер команды' }]}
                >
                  <Select options={TEAM_SIZE_OPTIONS} placeholder="Выберите диапазон" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="notes" label="Ключевая задача">
                  <Input placeholder="Какая метрика сейчас критична" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="consent"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(new Error('Нужно согласие на обработку данных')),
                    },
                  ]}
                >
                  <Checkbox>Согласен на обработку персональных данных.</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Space orientation={isMobile ? 'vertical' : 'horizontal'} size="middle">
              <Button type="primary" htmlType="submit" loading={submitting} block={isMobile}>
                Получить демо-сессию
              </Button>
              <Text type="secondary">Ответим в рабочее время в течение 1 дня.</Text>
            </Space>
          </Form>
        </Card>
      </div>
    </div>
  );
}
