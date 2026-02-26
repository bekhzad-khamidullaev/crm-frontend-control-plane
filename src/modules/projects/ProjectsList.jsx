import React, { useEffect, useMemo, useState } from 'react';
import { Folder, Calendar, Clock, Eye, Edit, Trash2 } from 'lucide-react';

import { navigate } from '../../router';
import {
  getProjects,
  deleteProject,
  getUsers,
  getProjectStages,
  bulkTagProjects,
  reopenProject,
  completeProject,
} from '../../lib/api';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import BulkActions from '../../components/ui-BulkActions.jsx';
import ReferenceSelect from '../../components/ui-ReferenceSelect.jsx';
import { exportAndDownload } from '../../lib/api/export.js';
import { toast } from '../../components/ui/use-toast.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';
import { Button } from '../../components/ui/button.jsx';

function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [allProjectsCache, setAllProjectsCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkTagModalVisible, setBulkTagModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetchProjects(1, searchText);
    loadReferences();
  }, []);

  const loadReferences = async () => {
    const [stagesRes, usersRes] = await Promise.allSettled([
      getProjectStages({ page_size: 200 }),
      getUsers({ page_size: 200 }),
    ]);

    if (stagesRes.status === 'fulfilled') {
      const data = stagesRes.value;
      setStages(data?.results || data || []);
    } else {
      console.error('Error loading project stages:', stagesRes.reason);
      setStages([]);
    }

    if (usersRes.status === 'fulfilled') {
      const data = usersRes.value;
      setUsers(data?.results || data || []);
    } else {
      console.error('Error loading users:', usersRes.reason);
      setUsers([]);
      toast({
        title: 'Внимание',
        description:
          'Не удалось загрузить пользователей (справочник). Страница работает, но выбор владельца/со-владельца может быть ограничен.',
      });
    }
  };

  const fetchProjects = async (page = 1, search = '', pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const response = await getProjects({
        page,
        page_size: pageSize,
        search: search || undefined,
      });
      const results = response.results || [];
      const totalCount = response.count || 0;
      
      if (results.length > pageSize && results.length === totalCount) {
        console.warn('⚠️ ProjectsList: Caching all data');
        setAllProjectsCache(results);
        const startIndex = (page - 1) * pageSize;
        setProjects(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllProjectsCache(null);
        setProjects(results);
      }
      
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: totalCount,
      }));
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка загрузки проектов', variant: 'destructive' });
      setProjects([]);
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
    fetchProjects(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      toast({ title: 'Проект удален', description: 'Проект удален' });
      fetchProjects(pagination.current, searchText);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления проекта', variant: 'destructive' });
    }
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;
    
    if (nextPageSize !== pagination.pageSize) {
      setPagination((p) => ({ ...p, pageSize: nextPageSize }));
      setAllProjectsCache(null);
      fetchProjects(nextPage, searchText, nextPageSize);
      return;
    }
    
    if (allProjectsCache && allProjectsCache.length > 0) {
      const startIndex = (nextPage - 1) * nextPageSize;
      setProjects(allProjectsCache.slice(startIndex, startIndex + nextPageSize));
      setPagination((p) => ({ ...p, current: nextPage }));
    } else {
      fetchProjects(nextPage, searchText, nextPageSize);
    }
  };

  const handleExport = async (format) => {
    try {
      await exportAndDownload('projects', {
        format: format === 'excel' ? 'xlsx' : 'csv',
      });
      toast({ title: 'Экспорт', description: 'Проекты экспортированы' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка экспорта проектов', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => deleteProject(id)));
      toast({ title: 'Удалено', description: `Удалено ${ids.length} проектов` });
      setSelectedRowKeys([]);
      fetchProjects(pagination.current, searchText);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка массового удаления', variant: 'destructive' });
    }
  };

  const handleBulkTag = () => {
    setBulkTagModalVisible(true);
  };

  const handleBulkTagConfirm = async () => {
    if (!selectedTags.length) {
      toast({ title: 'Ошибка', description: 'Выберите хотя бы один тег', variant: 'destructive' });
      return;
    }

    try {
      await bulkTagProjects({
        project_ids: selectedRowKeys,
        tag_ids: selectedTags,
      });
      toast({ title: 'Теги применены', description: `Теги применены к ${selectedRowKeys.length} проектам` });
      setSelectedRowKeys([]);
      setBulkTagModalVisible(false);
      setSelectedTags([]);
      fetchProjects(pagination.current, searchText);
    } catch (error) {
      const errorMessage = error?.details?.detail || error?.message || 'Ошибка применения тегов';
      toast({ title: 'Ошибка', description: errorMessage, variant: 'destructive' });
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

  const handleToggleComplete = async (project) => {
    const isDone = doneStage ? project.stage === doneStage.id : project.active === false;
    try {
      if (isDone) {
        await reopenProject(project.id);
        toast({ title: 'Проект возобновлен', description: 'Проект возобновлен' });
      } else {
        await completeProject(project.id);
        toast({ title: 'Проект завершен', description: 'Проект завершен' });
      }
      fetchProjects(pagination.current, searchText);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка обновления статуса проекта', variant: 'destructive' });
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
      title: 'Проект',
      key: 'project',
      render: (_, record) => (
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Folder className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">{record.name}</div>
            {record.description && (
              <div className="text-xs text-muted-foreground">{record.description}</div>
            )}
          </div>
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
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
              stage.done
                ? 'bg-emerald-100 text-emerald-700'
                : stage.in_progress
                ? 'bg-sky-100 text-sky-700'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {stage.name}
          </span>
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
        return <span className="text-sm">{names.length ? names.join(', ') : ownerLabel || '-'}</span>;
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
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${record.id}`)}>
            <Eye className="mr-1 h-4 w-4" />
            Просмотр
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${record.id}/edit`)}>
            <Edit className="mr-1 h-4 w-4" />
            Редактировать
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(record.id)}>
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <TableToolbar
        title="Проекты"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по названию, описанию..."
        onSearch={handleSearch}
        onCreate={() => navigate('/projects/new')}
        onRefresh={() => fetchProjects(pagination.current, searchText)}
        onExport={handleExport}
        createButtonText="Создать проект"
        showViewModeSwitch={false}
        showExportButton={true}
      />

      <EnhancedTable
        columns={columns}
        dataSource={projects}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        rowClassName={(record) =>
          doneStage && record.stage === doneStage.id ? 'row-completed' : ''
        }
        showTotal={true}
        showSizeChanger={true}
        emptyText="Нет проектов"
        emptyDescription="Создайте первый проект"
      />

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        onClearSelection={() => setSelectedRowKeys([])}
        onDelete={handleBulkDelete}
        onBulkTag={handleBulkTag}
        entityName="проектов"
      />

      <Dialog open={bulkTagModalVisible} onOpenChange={setBulkTagModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить теги к проектам</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Добавить теги к {selectedRowKeys.length} выбранным проектам
          </p>
          <div className="mt-3">
            <label className="text-sm font-medium">Теги</label>
            <ReferenceSelect
              type="crm-tags"
              mode="multiple"
              placeholder="Выберите теги"
              value={selectedTags}
              onChange={setSelectedTags}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setBulkTagModalVisible(false);
              setSelectedTags([]);
            }}>
              Отмена
            </Button>
            <Button onClick={handleBulkTagConfirm}>Применить</Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .row-completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}

export default ProjectsList;
