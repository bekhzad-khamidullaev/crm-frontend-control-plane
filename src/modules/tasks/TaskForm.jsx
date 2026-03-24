import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { App, Button, Card, Col, DatePicker, Input, Result, Row, Select, Skeleton, Space, Switch, Typography } from 'antd';
import EntitySelect from '../../components/EntitySelect';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';
import ReferenceSelect from '../../components/ReferenceSelect';
import {
  createTask,
  getProject,
  getProjects,
  getTask,
  getTasks,
  getUser,
  getUsers,
  updateTask,
} from '../../lib/api';
import { t } from '../../lib/i18n';
import { canWrite } from '../../lib/rbac';
import { normalizePayload } from '../../lib/utils/payload';
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

const priorityOptions = [
  { value: 1, label: t('taskFormPage.priority.low') },
  { value: 2, label: t('taskFormPage.priority.medium') },
  { value: 3, label: t('taskFormPage.priority.high') },
];

const schema = z.object({
  name: z.string().min(1, t('taskFormPage.validation.nameRequired')),
  description: z.string().optional(),
  note: z.string().optional(),
  stage: z.any().refine((val) => val !== undefined && val !== null && val !== '', { message: t('taskFormPage.validation.stageRequired') }),
  start_date: z.any().optional(),
  due_date: z.any().optional(),
  closing_date: z.any().optional(),
  lead_time: z.string().optional(),
  next_step: z.string().min(1, t('taskFormPage.validation.nextStepRequired')),
  next_step_date: z.any().refine((val) => val, { message: t('taskFormPage.validation.nextStepDateRequired') }),
  project: z.any().optional(),
  task: z.any().optional(),
  owner: z.any().optional(),
  co_owner: z.any().optional(),
  responsible: z.any().optional(),
  subscribers: z.any().optional(),
  tags: z.any().optional(),
  priority: z.any().optional(),
  active: z.boolean().optional(),
  remind_me: z.boolean().optional(),
});

function TaskForm({ id }) {
  const { message } = App.useApp();
  const notify = ({ title, description, variant }) => {
    const text = description || title || t('taskFormPage.messages.notification');
    if (variant === 'destructive') message.error(text);
    else message.success(text);
  };

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const canManage = canWrite('tasks.change_task');

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
      stage: '',
      start_date: null,
      due_date: null,
      closing_date: null,
      lead_time: '',
      next_step: '',
      next_step_date: null,
      project: '',
      task: '',
      owner: '',
      co_owner: '',
      responsible: [],
      subscribers: [],
      tags: [],
      priority: '',
      active: true,
      remind_me: false,
    },
  });

  const startDate = watch('start_date');
  const dueDate = watch('due_date');
  const closingDate = watch('closing_date');
  const nextStepDate = watch('next_step_date');
  const stageValue = watch('stage');
  const projectValue = watch('project');
  const taskValue = watch('task');
  const ownerValue = watch('owner');
  const coOwnerValue = watch('co_owner');
  const responsibleValue = watch('responsible');
  const subscribersValue = watch('subscribers');
  const tagsValue = watch('tags');
  const priorityValue = watch('priority');
  const activeValue = watch('active');
  const remindMeValue = watch('remind_me');

  useEffect(() => {
    if (isEdit) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const task = await getTask(id);
      reset({
        ...task,
        start_date: task.start_date ? dayjs(task.start_date) : null,
        due_date: task.due_date ? dayjs(task.due_date) : null,
        closing_date: task.closing_date ? dayjs(task.closing_date) : null,
        next_step_date: task.next_step_date ? dayjs(task.next_step_date) : null,
      });
    } catch (error) {
      setLoadError(true);
      notify({ title: t('taskFormPage.messages.error'), description: t('taskFormPage.messages.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    if (!canManage) {
      notify({ title: t('taskFormPage.messages.noPermissionTitle'), description: t('taskFormPage.messages.noPermissionDescription'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = normalizePayload(
        {
          ...values,
          start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
          closing_date: values.closing_date ? values.closing_date.format('YYYY-MM-DD') : null,
          next_step_date: values.next_step_date ? values.next_step_date.format('YYYY-MM-DD') : null,
        },
        { preserveEmptyArrays: ['responsible', 'subscribers', 'tags'] },
      );

      if (isEdit) {
        await updateTask(id, payload);
        notify({ title: t('taskFormPage.messages.updated'), description: t('taskFormPage.messages.updated') });
      } else {
        await createTask(payload);
        notify({ title: t('taskFormPage.messages.created'), description: t('taskFormPage.messages.created') });
      }
      navigate('/tasks');
    } catch (error) {
      notify({ title: t('taskFormPage.messages.error'), description: isEdit ? t('taskFormPage.messages.updateError') : t('taskFormPage.messages.createError'), variant: 'destructive' });
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
        title={t('taskFormPage.messages.error')}
        subTitle={t('taskFormPage.messages.loadError')}
        extra={[
          <Button key="retry" onClick={loadTask}>Повторить</Button>,
          <Button key="list" type="primary" onClick={() => navigate('/tasks')}>{t('taskFormPage.permission.backToList')}</Button>,
        ]}
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/tasks"
      listButtonText={t('taskFormPage.permission.backToList')}
      description={t('taskFormPage.permission.description')}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button onClick={() => navigate('/tasks')} icon={<ArrowLeftOutlined size={16} />}>
          {t('taskFormPage.actions.back')}
        </Button>

        <Card title={<Title level={4} style={{ margin: 0 }}>{isEdit ? t('taskFormPage.titleEdit') : t('taskFormPage.titleCreate')}</Title>}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <section>
                <Title level={5}>{t('taskFormPage.sections.main')}</Title>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={16}>
                      <FieldLabel htmlFor="name">{t('taskFormPage.fields.name')} *</FieldLabel>
                      <Input id="name" placeholder={t('taskFormPage.placeholders.name')} {...register('name')} />
                      <FieldError message={errors.name?.message} />
                    </Col>
                    <Col xs={24} md={8}>
                      <FieldLabel htmlFor="priority">{t('taskFormPage.fields.priority')}</FieldLabel>
                      <Select
                        id="priority"
                        placeholder={t('taskFormPage.placeholders.priority')}
                        options={priorityOptions}
                        allowClear
                        value={priorityValue || undefined}
                        onChange={(val) => setValue('priority', val ?? '')}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>

                  <div>
                    <FieldLabel htmlFor="description">{t('taskFormPage.fields.description')}</FieldLabel>
                    <TextArea id="description" rows={4} placeholder={t('taskFormPage.placeholders.description')} {...register('description')} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="note">{t('taskFormPage.fields.note')}</FieldLabel>
                    <TextArea id="note" rows={3} placeholder={t('taskFormPage.placeholders.note')} {...register('note')} />
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <FieldLabel htmlFor="stage">{t('taskFormPage.fields.stage')} *</FieldLabel>
                      <ReferenceSelect
                        id="stage"
                        type="task-stages"
                        placeholder={t('taskFormPage.placeholders.stage')}
                        allowClear
                        value={stageValue || ''}
                        onChange={(val) => setValue('stage', val)}
                      />
                      <FieldError message={errors.stage?.message} />
                    </Col>
                    <Col xs={24} md={8}>
                      <FieldLabel htmlFor="start_date">{t('taskFormPage.fields.startDate')}</FieldLabel>
                      <DatePicker id="start_date" value={startDate || null} onChange={(val) => setValue('start_date', val)} format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Col>
                    <Col xs={24} md={8}>
                      <FieldLabel htmlFor="due_date">{t('taskFormPage.fields.dueDate')}</FieldLabel>
                      <DatePicker id="due_date" value={dueDate || null} onChange={(val) => setValue('due_date', val)} format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <FieldLabel htmlFor="closing_date">{t('taskFormPage.fields.closingDate')}</FieldLabel>
                      <DatePicker id="closing_date" value={closingDate || null} onChange={(val) => setValue('closing_date', val)} format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Col>
                    <Col xs={24} md={12}>
                      <FieldLabel htmlFor="lead_time">{t('taskFormPage.fields.leadTime')}</FieldLabel>
                      <Input id="lead_time" placeholder={t('taskFormPage.placeholders.leadTime')} {...register('lead_time')} />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <FieldLabel htmlFor="next_step">{t('taskFormPage.fields.nextStep')} *</FieldLabel>
                      <Input id="next_step" placeholder={t('taskFormPage.placeholders.nextStep')} {...register('next_step')} />
                      <FieldError message={errors.next_step?.message} />
                    </Col>
                    <Col xs={24} md={12}>
                      <FieldLabel htmlFor="next_step_date">{t('taskFormPage.fields.nextStepDate')} *</FieldLabel>
                      <DatePicker id="next_step_date" value={nextStepDate || null} onChange={(val) => setValue('next_step_date', val)} format="DD.MM.YYYY" style={{ width: '100%' }} />
                      <FieldError message={errors.next_step_date?.message} />
                    </Col>
                  </Row>
                </Space>
              </section>

              <section>
                <Title level={5}>{t('taskFormPage.sections.related')}</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <FieldLabel>{t('taskFormPage.fields.project')}</FieldLabel>
                    <EntitySelect
                      value={projectValue || ''}
                      placeholder={t('taskFormPage.placeholders.project')}
                      fetchOptions={getProjects}
                      fetchById={getProject}
                      onChange={(val) => setValue('project', val)}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <FieldLabel>{t('taskFormPage.fields.parentTask')}</FieldLabel>
                    <EntitySelect
                      value={taskValue || ''}
                      placeholder={t('taskFormPage.placeholders.parentTask')}
                      fetchOptions={getTasks}
                      fetchById={getTask}
                      onChange={(val) => setValue('task', val)}
                    />
                  </Col>
                </Row>
              </section>

              <section>
                <Title level={5}>{t('taskFormPage.sections.assignees')}</Title>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('taskFormPage.fields.owner')}</FieldLabel>
                      <EntitySelect
                        value={ownerValue || ''}
                        placeholder={t('taskFormPage.placeholders.user')}
                        fetchOptions={getUsers}
                        fetchById={getUser}
                        onChange={(val) => setValue('owner', val)}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('taskFormPage.fields.coOwner')}</FieldLabel>
                      <EntitySelect
                        value={coOwnerValue || ''}
                        placeholder={t('taskFormPage.placeholders.user')}
                        fetchOptions={getUsers}
                        fetchById={getUser}
                        onChange={(val) => setValue('co_owner', val)}
                      />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('taskFormPage.fields.responsible')}</FieldLabel>
                      <EntitySelect
                        mode="multiple"
                        value={responsibleValue || []}
                        placeholder={t('taskFormPage.placeholders.users')}
                        fetchOptions={getUsers}
                        fetchById={getUser}
                        onChange={(val) => setValue('responsible', val)}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('taskFormPage.fields.subscribers')}</FieldLabel>
                      <EntitySelect
                        mode="multiple"
                        value={subscribersValue || []}
                        placeholder={t('taskFormPage.placeholders.users')}
                        fetchOptions={getUsers}
                        fetchById={getUser}
                        onChange={(val) => setValue('subscribers', val)}
                      />
                    </Col>
                  </Row>

                  <div>
                    <FieldLabel>{t('taskFormPage.fields.tags')}</FieldLabel>
                    <ReferenceSelect
                      type="task-tags"
                      placeholder={t('taskFormPage.placeholders.tags')}
                      mode="multiple"
                      allowClear
                      value={tagsValue || []}
                      onChange={(val) => setValue('tags', val)}
                    />
                  </div>
                </Space>
              </section>

              <section>
                <Title level={5}>{t('taskFormPage.sections.status')}</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Space align="center">
                      <Switch id="active" checked={!!activeValue} onChange={(val) => setValue('active', val)} />
                      <Text>{t('taskFormPage.fields.active')}</Text>
                    </Space>
                  </Col>
                  <Col xs={24} md={12}>
                    <Space align="center">
                      <Switch id="remind_me" checked={!!remindMeValue} onChange={(val) => setValue('remind_me', val)} />
                      <Text>{t('taskFormPage.fields.remindMe')}</Text>
                    </Space>
                  </Col>
                </Row>
              </section>

              <Space size={12}>
                {canManage && (
                  <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined size={16} />}>
                    {isEdit ? t('taskFormPage.actions.update') : t('taskFormPage.actions.create')}
                  </Button>
                )}
                <Button htmlType="button" onClick={() => navigate('/tasks')}>
                  {t('taskFormPage.actions.cancel')}
                </Button>
              </Space>
            </Space>
          </form>
        </Card>
      </Space>
    </FormPermissionGuard>
  );
}

export default TaskForm;
