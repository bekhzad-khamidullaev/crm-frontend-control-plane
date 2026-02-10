import React, { useEffect, useMemo, useState } from 'react';
import { User, Calendar, Clock, Eye, Edit, Trash2 } from 'lucide-react';

import { navigate } from '../../router';
import { getTasks, deleteTask, updateTask, getUsers, getTaskStages } from '../../lib/api';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { toast } from '../../components/ui/use-toast.js';
import { Avatar, AvatarFallback } from '../../components/ui/avatar.jsx';
import { Button } from '../../components/ui/button.jsx';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog.jsx';

function TasksList() {
  const [tasks, setTasks] = useState([]);
  const [allTasksCache, setAllTasksCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchTasks(1, searchText);
    loadReferences();
  }, []);

  const loadReferences = async () => {
    const [stagesRes, usersRes] = await Promise.allSettled([
      getTaskStages({ page_size: 200 }),
      getUsers({ page_size: 200 }),
    ]);

    if (stagesRes.status === 'fulfilled') {
      const data = stagesRes.value;
      setStages(data?.results || data || []);
    } else {
      console.error('Error loading task stages:', stagesRes.reason);
      setStages([]);
      toast({
        title: 'Внимание',
        description: 'Не удалось загрузить стадии задач. Фильтры будут ограничены.',
      });
    }

    if (usersRes.status === 'fulfilled') {
      const data = usersRes.value;
      setUsers(data?.results || data || []);
    } else {
      console.error('Error loading users:', usersRes.reason);
      setUsers([]);
      toast({
        title: 'Внимание',
        description: 'Не удалось загрузить пользователей. Фильтры будут ограничены.',
      });
    }
  };

  const fetchTasks = async (page = 1, search = '', pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const response = await getTasks({
        page,
        page_size: pageSize,
        search: search || undefined,
      });
      const results = response.results || [];
      const totalCount = response.count || 0;
      
      if (results.length > pageSize && results.length === totalCount) {
        console.warn('⚠️ TasksList: Caching all data');
        setAllTasksCache(results);
        const startIndex = (page - 1) * pageSize;
        setTasks(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllTasksCache(null);
        setTasks(results);
      }
      
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: totalCount,
      }));
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки задач', variant: 'destructive' });
      setTasks([]);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchTasks(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      toast({ title: 'Задача удалена', description: 'Задача удалена' });
      fetchTasks(pagination.current, searchText);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления задачи', variant: 'destructive' });
    }
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;
    
    if (nextPageSize !== pagination.pageSize) {
      setPagination((p) => ({ ...p, pageSize: nextPageSize }));
      setAllTasksCache(null);
      fetchTasks(nextPage, searchText, nextPageSize);
      return;
    }
    
    if (allTasksCache && allTasksCache.length > 0) {
      const startIndex = (nextPage - 1) * nextPageSize;
      setTasks(allTasksCache.slice(startIndex, startIndex + nextPageSize));
      setPagination((p) => ({ ...p, current: nextPage }));
    } else {
      fetchTasks(nextPage, searchText, nextPageSize);
    }
  };

  const stagesById = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage;
      return acc;
    }, {});
  }, [stages]);

  const userNameById = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.username || user.email || `#${user.id}`;
      return acc;
    }, {});
  }, [users]);

  const doneStage = stages.find((stage) => stage.done);
  const inProgressStage = stages.find((stage) => stage.in_progress) || stages.find((stage) => stage.default);

  const handleToggleComplete = async (task) => {
    if (!doneStage || !inProgressStage) {
      toast({ title: 'Внимание', description: 'Этапы задач не настроены' });
      return;
    }
    const isDone = task.stage === doneStage.id;
    const newStage = isDone ? inProgressStage.id : doneStage.id;
    try {
      await updateTask(task.id, { stage: newStage });
      toast({ title: 'Статус задачи обновлен', description: 'Статус задачи обновлен' });
      fetchTasks(pagination.current, searchText);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка обновления статуса задачи', variant: 'destructive' });
    }
  };

  const priorityConfig = {
    1: { color: 'bg-emerald-100 text-emerald-700', text: 'Низкий' },
    2: { color: 'bg-amber-100 text-amber-700', text: 'Средний' },
    3: { color: 'bg-rose-100 text-rose-700', text: 'Высокий' },
  };

  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 50,
      render: (_, record) => (
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={doneStage ? record.stage === doneStage.id : false}
          onChange={() => handleToggleComplete(record)}
        />
      ),
    },
    {
      title: 'Задача',
      key: 'task',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          {record.description && (
            <div className="text-xs text-muted-foreground">{record.description}</div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Этап',
      dataIndex: 'stage',
      key: 'stage',
      render: (stageId) => {
        const stage = stagesById[stageId];
        return stage ? (
          <Badge variant="secondary" className={stage.done ? 'bg-emerald-100 text-emerald-700' : stage.in_progress ? 'bg-sky-100 text-sky-700' : ''}>
            {stage.name}
          </Badge>
        ) : (
          '-'
        );
      },
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const config = priorityConfig[priority] || { color: 'bg-muted text-muted-foreground', text: '-' };
        return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${config.color}`}>{config.text}</span>;
      },
    },
    {
      title: 'Ответственные',
      dataIndex: 'responsible',
      key: 'responsible',
      render: (responsible, record) => {
        const ids = Array.isArray(responsible) ? responsible : [];
        const names = ids.map((id) => userNameById[id]).filter(Boolean);
        const ownerLabel = record.owner ? userNameById[record.owner] || `#${record.owner}` : null;
        const display = names.length ? names.join(', ') : ownerLabel;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{display || '-'}</span>
          </div>
        );
      },
    },
    {
      title: 'Срок',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => {
        if (!date) return '-';
        const dueDate = new Date(date);
        const today = new Date();
        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {dueDate.toLocaleDateString('ru-RU')}
            </div>
            {daysLeft > 0 && daysLeft <= 3 && (
              <div className="text-xs text-amber-600">
                <Clock className="inline h-3 w-3" /> {daysLeft} дн.
              </div>
            )}
            {daysLeft < 0 && (
              <div className="text-xs text-rose-600">
                <Clock className="inline h-3 w-3" /> просрочено
              </div>
            )}
          </div>
        );
      },
      sorter: (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${record.id}`)}>
            <Eye className="mr-1 h-4 w-4" />
            Просмотр
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${record.id}/edit`)}>
            <Edit className="mr-1 h-4 w-4" />
            Редактировать
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(record)}>
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <TableToolbar
        title="Задачи"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по названию, описанию..."
        onSearch={handleSearch}
        onCreate={() => navigate('/tasks/new')}
        onRefresh={() => fetchTasks(pagination.current, searchText)}
        createButtonText="Создать задачу"
        showViewModeSwitch={false}
        showExportButton={false}
      />

      <EnhancedTable
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowClassName={(record) => (doneStage && record.stage === doneStage.id ? 'row-completed' : '')}
        showTotal={true}
        showSizeChanger={true}
        emptyText="Нет задач"
        emptyDescription="Создайте первую задачу"
      />

      <style>{`
        .row-completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
      `}</style>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить эту задачу?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">Это действие нельзя отменить</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Нет
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return;
                handleDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Да
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TasksList;
