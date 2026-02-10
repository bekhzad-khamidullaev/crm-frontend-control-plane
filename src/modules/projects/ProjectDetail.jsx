import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit, Trash2, Calendar, User, CheckCircle, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';

import { navigate } from '../../router';
import { getProject, deleteProject, getUsers, getUser, projectsApi } from '../../lib/api/client';
import { getProjectStages, getCrmTags } from '../../lib/api/reference';
import ActivityLog from '../../components/ActivityLog';
import EntitySelect from '../../components/EntitySelect.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';

function ProjectDetail({ id }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignState, setAssignState] = useState({
    owner: '',
    co_owner: '',
    responsible: [],
    subscribers: [],
  });

  useEffect(() => {
    loadProject();
    loadReferences();
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await getProject(id);
      setProject(data);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки данных проекта', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [stagesResponse, tagsResponse, usersResponse] = await Promise.all([
        getProjectStages({ page_size: 200 }),
        getCrmTags({ page_size: 200 }),
        getUsers({ page_size: 200 }),
      ]);
      setStages(stagesResponse.results || stagesResponse || []);
      setTags(tagsResponse.results || tagsResponse || []);
      setUsers(usersResponse.results || usersResponse || []);
    } catch (error) {
      console.error('Error loading project references:', error);
      setStages([]);
      setTags([]);
      setUsers([]);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(id);
      toast({ title: 'Проект удален', description: 'Проект удален' });
      navigate('/projects');
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления проекта', variant: 'destructive' });
    }
  };

  const handleComplete = async () => {
    try {
      await projectsApi.complete(id);
      toast({ title: 'Проект завершен', description: 'Проект завершен' });
      loadProject();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка завершения проекта', variant: 'destructive' });
    }
  };

  const handleReopen = async () => {
    try {
      await projectsApi.reopen(id);
      toast({ title: 'Проект возобновлен', description: 'Проект возобновлен' });
      loadProject();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка возобновления проекта', variant: 'destructive' });
    }
  };

  const openAssignModal = () => {
    setAssignState({
      owner: project?.owner || '',
      co_owner: project?.co_owner || '',
      responsible: project?.responsible || [],
      subscribers: project?.subscribers || [],
    });
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    try {
      setAssigning(true);
      await projectsApi.assign(id, assignState);
      toast({ title: 'Назначения обновлены', description: 'Назначения обновлены' });
      setAssignModalOpen(false);
      loadProject();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка назначения', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  const stageMap = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage;
      return acc;
    }, {});
  }, [stages]);

  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.username || user.email || `#${user.id}`;
      return acc;
    }, {});
  }, [users]);

  const tagMap = useMemo(() => {
    return tags.reduce((acc, tag) => {
      acc[tag.id] = tag.name;
      return acc;
    }, {});
  }, [tags]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (!project) {
    return <div>Проект не найден</div>;
  }

  const stage = stageMap[project.stage];
  const responsibleNames = Array.isArray(project.responsible)
    ? project.responsible.map((id) => userMap[id]).filter(Boolean)
    : [];
  const subscriberNames = Array.isArray(project.subscribers)
    ? project.subscribers.map((id) => userMap[id]).filter(Boolean)
    : [];
  const tagNames = Array.isArray(project.tags) ? project.tags.map((id) => tagMap[id]).filter(Boolean) : [];
  const isCompleted = stage?.done || project.active === false;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Button onClick={() => navigate(`/projects/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Редактировать
        </Button>
        <Button variant="outline" onClick={openAssignModal}>
          <User className="mr-2 h-4 w-4" />
          Назначить
        </Button>
        {isCompleted ? (
          <Button variant="outline" onClick={handleReopen}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Возобновить
          </Button>
        ) : (
          <Button variant="outline" onClick={handleComplete}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Завершить
          </Button>
        )}
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </Button>
      </div>

      <h2 className="text-2xl font-semibold">{project.name}</h2>

      <Card className="p-4">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="activity">История активности</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Название" value={<span className="text-base font-semibold">{project.name}</span>} span />
              <DetailRow
                label="Этап"
                value={stage ? (
                  <Badge variant="secondary">{stage.name}</Badge>
                ) : (
                  '-'
                )}
              />
              <DetailRow label="Приоритет" value={project.priority ? `Приоритет ${project.priority}` : '-'} />
              <DetailRow
                label="Дата начала"
                value={project.start_date ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {dayjs(project.start_date).format('DD.MM.YYYY')}
                  </div>
                ) : (
                  '-'
                )}
              />
              <DetailRow
                label="Срок завершения"
                value={project.due_date ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {dayjs(project.due_date).format('DD.MM.YYYY')}
                  </div>
                ) : (
                  '-'
                )}
              />
              <DetailRow label="Дата закрытия" value={project.closing_date ? dayjs(project.closing_date).format('DD.MM.YYYY') : '-'} />
              <DetailRow label="Следующий шаг" value={project.next_step || '-'} />
              <DetailRow label="Дата следующего шага" value={project.next_step_date ? dayjs(project.next_step_date).format('DD.MM.YYYY') : '-'} />
              <DetailRow label="Активен" value={<Badge variant={project.active ? 'default' : 'secondary'}>{project.active ? 'Да' : 'Нет'}</Badge>} />
              <DetailRow label="Напоминать" value={<Badge variant={project.remind_me ? 'secondary' : 'outline'}>{project.remind_me ? 'Да' : 'Нет'}</Badge>} />
              <DetailRow
                label="Владелец"
                value={
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {project.owner ? userMap[project.owner] || `#${project.owner}` : '-'}
                  </div>
                }
              />
              <DetailRow label="Со-владелец" value={project.co_owner ? userMap[project.co_owner] || `#${project.co_owner}` : '-'} />
              <DetailRow label="Ответственные" value={responsibleNames.length ? responsibleNames.join(', ') : '-'} span />
              <DetailRow label="Подписчики" value={subscriberNames.length ? subscriberNames.join(', ') : '-'} span />
              <DetailRow
                label="Теги"
                value={tagNames.length ? tagNames.map((tag) => (
                  <Badge key={tag} variant="secondary" className="mr-2">{tag}</Badge>
                )) : '-'}
                span
              />
              <DetailRow label="Дата создания" value={project.creation_date ? dayjs(project.creation_date).format('DD.MM.YYYY HH:mm') : '-'} />
              <DetailRow label="Последнее обновление" value={project.update_date ? dayjs(project.update_date).format('DD.MM.YYYY HH:mm') : '-'} />
              {project.description && <DetailRow label="Описание" value={project.description} span />}
              {project.note && <DetailRow label="Заметка" value={project.note} span />}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog entityType="project" entityId={project.id} />
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначения проекта</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Владелец</label>
              <EntitySelect
                fetchOptions={getUsers}
                fetchById={getUser}
                placeholder="Выберите владельца"
                value={assignState.owner || ''}
                onChange={(val) => setAssignState((prev) => ({ ...prev, owner: val }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Со-владелец</label>
              <EntitySelect
                fetchOptions={getUsers}
                fetchById={getUser}
                placeholder="Выберите со-владельца"
                value={assignState.co_owner || ''}
                onChange={(val) => setAssignState((prev) => ({ ...prev, co_owner: val }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ответственные</label>
              <EntitySelect
                fetchOptions={getUsers}
                fetchById={getUser}
                mode="multiple"
                placeholder="Выберите ответственных"
                value={assignState.responsible}
                onChange={(val) => setAssignState((prev) => ({ ...prev, responsible: val }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Подписчики</label>
              <EntitySelect
                fetchOptions={getUsers}
                fetchById={getUser}
                mode="multiple"
                placeholder="Выберите подписчиков"
                value={assignState.subscribers}
                onChange={(val) => setAssignState((prev) => ({ ...prev, subscribers: val }))}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAssign} loading={assigning}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value, span = false }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

export default ProjectDetail;
