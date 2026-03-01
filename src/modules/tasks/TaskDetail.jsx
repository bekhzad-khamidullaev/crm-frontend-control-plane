import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit, Trash2, Calendar, User } from 'lucide-react';
import dayjs from 'dayjs';

import { navigate } from '../../router';
import { getTask, deleteTask, getUsers } from '../../lib/api/client';
import { getTaskStages, getTaskTags } from '../../lib/api/reference';
import ActivityLog from '../../components/ActivityLog';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { toast } from '../../components/ui/use-toast.js';

function TaskDetail({ id }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadTask();
    loadReferences();
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await getTask(id);
      setTask(data);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки данных задачи', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [stagesResponse, tagsResponse, usersResponse] = await Promise.all([
        getTaskStages({ page_size: 200 }),
        getTaskTags({ page_size: 200 }),
        getUsers({ page_size: 200 }),
      ]);
      setStages(stagesResponse.results || stagesResponse || []);
      setTags(tagsResponse.results || tagsResponse || []);
      setUsers(usersResponse.results || usersResponse || []);
    } catch (error) {
      console.error('Error loading task references:', error);
      setStages([]);
      setTags([]);
      setUsers([]);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(id);
      toast({ title: 'Задача удалена', description: 'Задача удалена' });
      navigate('/tasks');
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления задачи', variant: 'destructive' });
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
      acc[user.id] = user.username || user.email || '-';
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

  if (!task) {
    return <div>Задача не найдена</div>;
  }

  const stage = stageMap[task.stage];
  const priorityLabel = task.priority ? `Приоритет ${task.priority}` : '-';
  const responsibleNames = Array.isArray(task.responsible)
    ? task.responsible.map((id) => userMap[id]).filter(Boolean)
    : [];
  const subscriberNames = Array.isArray(task.subscribers)
    ? task.subscribers.map((id) => userMap[id]).filter(Boolean)
    : [];
  const tagNames = Array.isArray(task.tags) ? task.tags.map((id) => tagMap[id]).filter(Boolean) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/tasks')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Button onClick={() => navigate(`/tasks/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Редактировать
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </Button>
      </div>

      <h2 className="text-2xl font-semibold">{task.name}</h2>

      <Card className="p-4">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="activity">История активности</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Название" value={<span className="text-base font-semibold">{task.name}</span>} span />
              <DetailRow
                label="Этап"
                value={stage ? (
                  <Badge variant="secondary">{stage.name}</Badge>
                ) : (
                  '-'
                )}
              />
              <DetailRow label="Приоритет" value={priorityLabel} />
              <DetailRow
                label="Дата начала"
                value={task.start_date ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {dayjs(task.start_date).format('DD.MM.YYYY')}
                  </div>
                ) : (
                  '-'
                )}
              />
              <DetailRow
                label="Срок выполнения"
                value={task.due_date ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {dayjs(task.due_date).format('DD.MM.YYYY')}
                  </div>
                ) : (
                  '-'
                )}
              />
              <DetailRow label="Дата закрытия" value={task.closing_date ? dayjs(task.closing_date).format('DD.MM.YYYY') : '-'} />
              <DetailRow label="Следующий шаг" value={task.next_step || '-'} />
              <DetailRow label="Дата следующего шага" value={task.next_step_date ? dayjs(task.next_step_date).format('DD.MM.YYYY') : '-'} />
              <DetailRow label="Lead time" value={task.lead_time || '-'} />
              <DetailRow label="Активна" value={<Badge variant={task.active ? 'default' : 'secondary'}>{task.active ? 'Да' : 'Нет'}</Badge>} />
              <DetailRow label="Напоминать" value={<Badge variant={task.remind_me ? 'secondary' : 'outline'}>{task.remind_me ? 'Да' : 'Нет'}</Badge>} />
              <DetailRow
                label="Владелец"
                value={
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {task.owner ? userMap[task.owner] || '-' : '-'}
                  </div>
                }
              />
              <DetailRow label="Со-владелец" value={task.co_owner ? userMap[task.co_owner] || '-' : '-'} />
              <DetailRow label="Ответственные" value={responsibleNames.length ? responsibleNames.join(', ') : '-'} span />
              <DetailRow label="Подписчики" value={subscriberNames.length ? subscriberNames.join(', ') : '-'} span />
              <DetailRow
                label="Теги"
                value={tagNames.length ? tagNames.map((tag) => (
                  <Badge key={tag} variant="secondary" className="mr-2">{tag}</Badge>
                )) : '-'}
                span
              />
              <DetailRow label="Дата создания" value={task.creation_date ? dayjs(task.creation_date).format('DD.MM.YYYY HH:mm') : '-'} />
              <DetailRow label="Последнее обновление" value={task.update_date ? dayjs(task.update_date).format('DD.MM.YYYY HH:mm') : '-'} />
              {task.description && <DetailRow label="Описание" value={task.description} span />}
              {task.note && <DetailRow label="Заметка" value={task.note} span />}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog entityType="task" entityId={task.id} />
          </TabsContent>
        </Tabs>
      </Card>
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

export default TaskDetail;
