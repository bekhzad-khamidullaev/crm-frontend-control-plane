import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { App, Button, Card, Col, DatePicker, Input, Result, Row, Select, Skeleton, Space, Switch, Typography } from 'antd';
import EntitySelect from '../../components/EntitySelect';
import FormPermissionGuard from '../../components/permissions/FormPermissionGuard';
import ReferenceSelect from '../../components/ReferenceSelect';
import { createProject, getProject, getUser, getUsers, updateProject } from '../../lib/api';
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
  { value: 1, label: t('projectFormPage.priority.low') },
  { value: 2, label: t('projectFormPage.priority.medium') },
  { value: 3, label: t('projectFormPage.priority.high') },
];

const isPastDate = (value) => Boolean(value) && dayjs(value).isBefore(dayjs().startOf('day'), 'day');

const schema = z.object({
  name: z.string().trim().min(1, t('projectFormPage.validation.nameRequired')),
  description: z.string().optional(),
  note: z.string().optional(),
  stage: z.any().optional(),
  start_date: z.any().optional(),
  due_date: z.any().optional(),
  closing_date: z.any().optional(),
  next_step: z.string().trim().min(1, t('projectFormPage.validation.nextStepRequired')),
  next_step_date: z
    .any()
    .refine((val) => val, { message: t('projectFormPage.validation.nextStepDateRequired') })
    .refine((val) => !isPastDate(val), { message: 'Дата следующего шага не может быть в прошлом' }),
  priority: z.any().optional(),
  owner: z.any().optional(),
  co_owner: z.any().optional(),
  responsible: z.any().optional(),
  subscribers: z.any().optional(),
  tags: z.any().optional(),
  active: z.boolean().optional(),
  remind_me: z.boolean().optional(),
});

function ProjectForm({ id }) {
  const { message } = App.useApp();
  const notify = ({ title, description, variant }) => {
    const text = description || title || t('projectFormPage.messages.notification');
    if (variant === 'destructive') message.error(text);
    else message.success(text);
  };

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;
  const canManage = canWrite('tasks.change_project');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    control,
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
      next_step: '',
      next_step_date: null,
      priority: '',
      owner: '',
      co_owner: '',
      responsible: [],
      subscribers: [],
      tags: [],
      active: true,
      remind_me: false,
    },
  });

  const stageValue = watch('stage');
  const startDate = watch('start_date');
  const dueDate = watch('due_date');
  const closingDate = watch('closing_date');
  const nextStepDate = watch('next_step_date');
  const priorityValue = watch('priority');
  const ownerValue = watch('owner');
  const coOwnerValue = watch('co_owner');
  const responsibleValue = watch('responsible');
  const subscribersValue = watch('subscribers');
  const tagsValue = watch('tags');
  const activeValue = watch('active');
  const remindMeValue = watch('remind_me');

  useEffect(() => {
    if (isEdit) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const project = await getProject(id);
      reset({
        ...project,
        start_date: project.start_date ? dayjs(project.start_date) : null,
        due_date: project.due_date ? dayjs(project.due_date) : null,
        closing_date: project.closing_date ? dayjs(project.closing_date) : null,
        next_step_date: project.next_step_date ? dayjs(project.next_step_date) : null,
      });
    } catch (error) {
      setLoadError(true);
      notify({ title: t('projectFormPage.messages.error'), description: t('projectFormPage.messages.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values) => {
    if (!canManage) {
      notify({ title: t('projectFormPage.messages.noPermissionTitle'), description: t('projectFormPage.messages.noPermissionDescription'), variant: 'destructive' });
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
        await updateProject(id, payload);
        notify({ title: t('projectFormPage.messages.updated'), description: t('projectFormPage.messages.updated') });
      } else {
        await createProject(payload);
        notify({ title: t('projectFormPage.messages.created'), description: t('projectFormPage.messages.created') });
      }
      navigate('/projects');
    } catch (error) {
      notify({ title: t('projectFormPage.messages.error'), description: isEdit ? t('projectFormPage.messages.updateError') : t('projectFormPage.messages.createError'), variant: 'destructive' });
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
        title={t('projectFormPage.loadError.title')}
        subTitle={t('projectFormPage.loadError.subtitle')}
        extra={[
          <Button key="retry" onClick={loadProject}>{t('projectFormPage.loadError.retry')}</Button>,
          <Button key="list" type="primary" onClick={() => navigate('/projects')}>{t('projectFormPage.permission.backToList')}</Button>,
        ]}
      />
    );
  }

  return (
    <FormPermissionGuard
      allowed={canManage}
      listPath="/projects"
      listButtonText={t('projectFormPage.permission.backToList')}
      description={t('projectFormPage.permission.description')}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button onClick={() => navigate('/projects')} icon={<ArrowLeftOutlined size={16} />}>
          {t('projectFormPage.actions.back')}
        </Button>

        <Card title={<Title level={4} style={{ margin: 0 }}>{isEdit ? t('projectFormPage.titleEdit') : t('projectFormPage.titleCreate')}</Title>}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <section>
                <Title level={5}>{t('projectFormPage.sections.main')}</Title>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={16}>
                      <FieldLabel htmlFor="name">{t('projectFormPage.fields.name')} *</FieldLabel>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="name"
                            placeholder={t('projectFormPage.placeholders.name')}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                      <FieldError message={errors.name?.message} />
                    </Col>
                    <Col xs={24} md={8}>
                      <FieldLabel htmlFor="priority">{t('projectFormPage.fields.priority')}</FieldLabel>
                      <Select
                        id="priority"
                        placeholder={t('projectFormPage.placeholders.priority')}
                        options={priorityOptions}
                        allowClear
                        value={priorityValue || undefined}
                        onChange={(val) => setValue('priority', val ?? '')}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>

                  <div>
                    <FieldLabel htmlFor="description">{t('projectFormPage.fields.description')}</FieldLabel>
                    <TextArea id="description" rows={4} placeholder={t('projectFormPage.placeholders.description')} {...register('description')} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="note">{t('projectFormPage.fields.note')}</FieldLabel>
                    <TextArea id="note" rows={3} placeholder={t('projectFormPage.placeholders.note')} {...register('note')} />
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <FieldLabel>{t('projectFormPage.fields.stage')}</FieldLabel>
                      <ReferenceSelect
                        type="project-stages"
                        placeholder={t('projectFormPage.placeholders.stage')}
                        allowClear
                        value={stageValue || ''}
                        onChange={(val) => setValue('stage', val)}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <FieldLabel>{t('projectFormPage.fields.startDate')}</FieldLabel>
                      <DatePicker value={startDate || null} onChange={(val) => setValue('start_date', val)} format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Col>
                    <Col xs={24} md={8}>
                      <FieldLabel>{t('projectFormPage.fields.dueDate')}</FieldLabel>
                      <DatePicker value={dueDate || null} onChange={(val) => setValue('due_date', val)} format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('projectFormPage.fields.closingDate')}</FieldLabel>
                      <DatePicker value={closingDate || null} onChange={(val) => setValue('closing_date', val)} format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Col>
                    <Col xs={24} md={12}>
                      <FieldLabel htmlFor="next_step">{t('projectFormPage.fields.nextStep')} *</FieldLabel>
                      <Controller
                        name="next_step"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="next_step"
                            placeholder={t('projectFormPage.placeholders.nextStep')}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                      <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                        Что нужно сделать после текущего этапа (например: «Согласовать бюджет с клиентом»).
                      </Text>
                      <FieldError message={errors.next_step?.message} />
                    </Col>
                  </Row>

                  <div>
                    <FieldLabel>{t('projectFormPage.fields.nextStepDate')} *</FieldLabel>
                    <DatePicker
                      value={nextStepDate || null}
                      onChange={(val) => setValue('next_step_date', val)}
                      disabledDate={(current) => isPastDate(current)}
                      format="DD.MM.YYYY"
                      style={{ width: '100%' }}
                    />
                    <FieldError message={errors.next_step_date?.message} />
                  </div>
                </Space>
              </section>

              <section>
                <Title level={5}>{t('projectFormPage.sections.assignees')}</Title>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('projectFormPage.fields.owner')}</FieldLabel>
                      <EntitySelect
                        value={ownerValue || ''}
                        placeholder={t('projectFormPage.placeholders.user')}
                        fetchOptions={getUsers}
                        fetchById={getUser}
                        onChange={(val) => setValue('owner', val)}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('projectFormPage.fields.coOwner')}</FieldLabel>
                      <EntitySelect
                        value={coOwnerValue || ''}
                        placeholder={t('projectFormPage.placeholders.user')}
                        fetchOptions={getUsers}
                        fetchById={getUser}
                        onChange={(val) => setValue('co_owner', val)}
                      />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('projectFormPage.fields.responsible')}</FieldLabel>
                      <EntitySelect
                        mode="multiple"
                        value={responsibleValue || []}
                        placeholder={t('projectFormPage.placeholders.users')}
                        fetchOptions={getUsers}
                        fetchById={getUser}
                        onChange={(val) => setValue('responsible', val)}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <FieldLabel>{t('projectFormPage.fields.subscribers')}</FieldLabel>
                      <EntitySelect
                        mode="multiple"
                        value={subscribersValue || []}
                        placeholder={t('projectFormPage.placeholders.users')}
                        fetchOptions={getUsers}
                        fetchById={getUser}
                        onChange={(val) => setValue('subscribers', val)}
                      />
                    </Col>
                  </Row>

                  <div>
                    <FieldLabel>{t('projectFormPage.fields.tags')}</FieldLabel>
                    <ReferenceSelect
                      type="crm-tags"
                      placeholder={t('projectFormPage.placeholders.tags')}
                      mode="multiple"
                      allowClear
                      value={tagsValue || []}
                      onChange={(val) => setValue('tags', val)}
                    />
                  </div>
                </Space>
              </section>

              <section>
                <Title level={5}>{t('projectFormPage.sections.status')}</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Space align="center">
                      <Switch checked={!!activeValue} onChange={(val) => setValue('active', val)} />
                      <Text>{t('projectFormPage.fields.active')}</Text>
                    </Space>
                  </Col>
                  <Col xs={24} md={12}>
                    <Space align="center">
                      <Switch checked={!!remindMeValue} onChange={(val) => setValue('remind_me', val)} />
                      <Text>{t('projectFormPage.fields.remindMe')}</Text>
                    </Space>
                  </Col>
                </Row>
              </section>

              <Space size={12}>
                {canManage && (
                  <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined size={16} />}>
                    {isEdit ? t('projectFormPage.actions.update') : t('projectFormPage.actions.create')}
                  </Button>
                )}
                <Button htmlType="button" onClick={() => navigate('/projects')}>
                  {t('projectFormPage.actions.cancel')}
                </Button>
              </Space>
            </Space>
          </form>
        </Card>
      </Space>
    </FormPermissionGuard>
  );
}

export default ProjectForm;
