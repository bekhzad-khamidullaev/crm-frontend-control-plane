import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeftOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { App, Button, Card, Col, DatePicker, Input, Result, Row, Select, Skeleton, Space, Switch, Typography } from 'antd';
import EntitySelect from '../../components/EntitySelect.jsx';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';
import ReferenceSelect from '../../components/ReferenceSelect';
import { getDeal, getDeals, getProject, getProjects, getTask, getTasks, getUser, getUsers } from '../../lib/api';
import { canWrite } from '../../lib/rbac';
import { getMemo, createMemo, updateMemo } from '../../lib/api/memos';
import { navigate } from '../../router';

const { Text, Title } = Typography;
const { TextArea } = Input;

const FieldLabel = ({ children, ...props }) => (
  <Text strong style={{ display: 'block', marginBottom: 6 }} {...props}>
    {children}
  </Text>
);

const FieldError = ({ message }) => (
  message ? (
    <Text type="danger" style={{ display: 'block', marginTop: 6 }}>
      {message}
    </Text>
  ) : null
);

const stageOptions = [
  { value: 'pen', label: 'В ожидании' },
  { value: 'pos', label: 'Отложено' },
  { value: 'rev', label: 'Рассмотрено' },
];

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  description: z.string().optional(),
  note: z.string().optional(),
  draft: z.boolean().optional(),
  notified: z.boolean().optional(),
  stage: z.string().optional(),
  review_date: z.any().optional(),
  to: z.any().refine((val) => val !== undefined && val !== null && val !== '', { message: 'Выберите получателя' }),
  deal: z.any().optional(),
  project: z.any().optional(),
  task: z.any().optional(),
  resolution: z.any().optional(),
  tags: z.any().optional(),
});

export default function MemoForm({ id }) {
  const { message } = App.useApp();
  const notify = ({ title, description, variant }) => {
    const text = description || title || 'Уведомление';
    if (variant === 'destructive') message.error(text);
    else message.success(text);
  };

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const canManage = canWrite('tasks.change_memo');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      note: '',
      draft: false,
      notified: false,
      stage: 'pen',
      review_date: null,
      to: '',
      deal: '',
      project: '',
      task: '',
      resolution: '',
      tags: [],
    },
  });

  const reviewDate = watch('review_date');
  const draftValue = watch('draft');
  const notifiedValue = watch('notified');
  const stageValue = watch('stage');
  const toValue = watch('to');
  const dealValue = watch('deal');
  const projectValue = watch('project');
  const taskValue = watch('task');
  const resolutionValue = watch('resolution');
  const tagsValue = watch('tags');

  useEffect(() => {
    if (isEdit) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getMemo(id);
      reset({
        ...res,
        review_date: res.review_date ? dayjs(res.review_date) : null,
      });
    } catch (error) {
      setLoadError(true);
      notify({ title: 'Ошибка', description: 'Не удалось загрузить мемо', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    if (!canManage) {
      notify({ title: 'Недостаточно прав', description: 'У вас нет прав для изменения мемо', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...values,
        review_date: values.review_date ? values.review_date.format('YYYY-MM-DD') : null,
      };

      if (isEdit) {
        await updateMemo(id, payload);
        notify({ title: 'Мемо обновлено', description: 'Мемо обновлено' });
      } else {
        await createMemo(payload);
        notify({ title: 'Мемо создано', description: 'Мемо создано' });
      }
      navigate('/memos');
    } catch (error) {
      notify({ title: 'Ошибка', description: `Не удалось ${isEdit ? 'обновить' : 'создать'} мемо`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (isEdit && loadError) {
    return (
      <Result
        status="error"
        title="Не удалось загрузить мемо для редактирования"
        subTitle="Попробуйте повторить загрузку или вернитесь к списку мемо."
        extra={[
          <Button key="retry" onClick={fetchData}>Повторить</Button>,
          <Button key="list" type="primary" onClick={() => navigate('/memos')}>К списку мемо</Button>,
        ]}
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/memos"
      listButtonText="К списку мемо"
      description="У вас нет прав для создания или редактирования мемо."
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button onClick={() => navigate('/memos')} icon={<ArrowLeftOutlined size={16} />}>
          Назад
        </Button>

        <Card
          title={(
            <Space>
              <FileTextOutlined size={18} />
              <Title level={4} style={{ margin: 0 }}>
                {isEdit ? 'Редактирование мемо' : 'Новое мемо'}
              </Title>
            </Space>
          )}
        >
          <form onSubmit={handleSubmit(onFinish)}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <FieldLabel htmlFor="name">Название *</FieldLabel>
                <Input id="name" placeholder="Например: Итоги встречи" {...register('name')} />
                <FieldError message={errors.name?.message} />
              </div>

              <div>
                <FieldLabel htmlFor="description">Описание</FieldLabel>
                <TextArea id="description" rows={3} placeholder="Краткое описание" {...register('description')} />
              </div>

              <div>
                <FieldLabel htmlFor="note">Заключение</FieldLabel>
                <TextArea id="note" rows={4} placeholder="Ключевые выводы и договоренности" {...register('note')} />
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Space align="center">
                    <Switch checked={!!draftValue} onChange={(val) => setValue('draft', val)} />
                    <Text>Черновик</Text>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space align="center">
                    <Switch checked={!!notifiedValue} onChange={(val) => setValue('notified', val)} />
                    <Text>Уведомить получателей</Text>
                  </Space>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FieldLabel>Стадия</FieldLabel>
                  <Select
                    value={stageValue || undefined}
                    onChange={(value) => setValue('stage', value ?? '')}
                    placeholder="Выберите стадию"
                    allowClear
                    options={stageOptions}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FieldLabel>Дата обзора</FieldLabel>
                  <DatePicker
                    value={reviewDate || null}
                    onChange={(val) => setValue('review_date', val)}
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              <div>
                <FieldLabel>Получатель *</FieldLabel>
                <EntitySelect
                  placeholder="Выберите пользователя"
                  fetchList={getUsers}
                  fetchById={getUser}
                  allowClear
                  value={toValue}
                  onChange={(val) => setValue('to', val)}
                />
                <FieldError message={errors.to?.message} />
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FieldLabel>Сделка</FieldLabel>
                  <EntitySelect
                    placeholder="Выберите сделку"
                    fetchList={getDeals}
                    fetchById={getDeal}
                    allowClear
                    value={dealValue}
                    onChange={(val) => setValue('deal', val)}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FieldLabel>Проект</FieldLabel>
                  <EntitySelect
                    placeholder="Выберите проект"
                    fetchList={getProjects}
                    fetchById={getProject}
                    allowClear
                    value={projectValue}
                    onChange={(val) => setValue('project', val)}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FieldLabel>Задача</FieldLabel>
                  <EntitySelect
                    placeholder="Выберите задачу"
                    fetchList={getTasks}
                    fetchById={getTask}
                    allowClear
                    value={taskValue}
                    onChange={(val) => setValue('task', val)}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FieldLabel>Резолюция</FieldLabel>
                  <ReferenceSelect
                    type="resolutions"
                    placeholder="Выберите резолюцию"
                    allowClear
                    value={resolutionValue || undefined}
                    onChange={(val) => setValue('resolution', val ?? '')}
                  />
                </Col>
              </Row>

              <div>
                <FieldLabel>Теги</FieldLabel>
                <ReferenceSelect
                  type="crm-tags"
                  mode="multiple"
                  allowClear
                  placeholder="Выберите теги"
                  value={tagsValue || []}
                  onChange={(val) => setValue('tags', val)}
                />
              </div>

              <Space size={12}>
                {canManage && (
                  <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined size={16} />}>
                    {isEdit ? 'Сохранить' : 'Создать'}
                  </Button>
                )}
                <Button htmlType="button" onClick={() => navigate('/memos')}>
                  Отмена
                </Button>
              </Space>
            </Space>
          </form>
        </Card>
      </Space>
    </FormPermissionGuard>
  );
}
