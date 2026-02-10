import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from '../../src/lib/api/client';
import * as tasksAPI from '../../src/lib/api/tasks';

vi.mock('../../src/lib/api/client', () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('Tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasks', () => {
    it('calls the correct endpoint with parameters', async () => {
      const mockResponse = {
        results: [
          { id: 1, title: 'Task 1', status: 'open' },
          { id: 2, title: 'Task 2', status: 'in_progress' },
        ],
        count: 2,
      };
      client.api.get.mockResolvedValue(mockResponse);

      const params = { page: 1, page_size: 10, search: 'test' };
      await tasksAPI.getTasks(params);

      expect(client.api.get).toHaveBeenCalledWith('/api/tasks/', { params });
    });

    it('calls without parameters', async () => {
      client.api.get.mockResolvedValue({ results: [], count: 0 });
      
      await tasksAPI.getTasks();
      
      expect(client.api.get).toHaveBeenCalledWith('/api/tasks/', { params: {} });
    });

    it('handles filtering by project', async () => {
      client.api.get.mockResolvedValue({ results: [], count: 0 });
      
      await tasksAPI.getTasks({ project: 5 });
      
      expect(client.api.get).toHaveBeenCalledWith('/api/tasks/', { 
        params: { project: 5 } 
      });
    });

    it('handles filtering by assigned user', async () => {
      client.api.get.mockResolvedValue({ results: [], count: 0 });
      
      await tasksAPI.getTasks({ owner: 2, active: true });
      
      expect(client.api.get).toHaveBeenCalledWith('/api/tasks/', { 
        params: { owner: 2, active: true } 
      });
    });
  });

  describe('getTask', () => {
    it('retrieves a single task by ID', async () => {
      const mockTask = { id: 1, title: 'Test Task', status: 'open' };
      client.api.get.mockResolvedValue(mockTask);

      await tasksAPI.getTask(1);

      expect(client.api.get).toHaveBeenCalledWith('/api/tasks/1/');
    });
  });

  describe('createTask', () => {
    it('creates a new task with required fields', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Task description',
        priority: 'normal',
        status: 'open',
      };
      const mockResponse = { id: 1, ...newTask };
      client.api.post.mockResolvedValue(mockResponse);

      await tasksAPI.createTask(newTask);

      expect(client.api.post).toHaveBeenCalledWith('/api/tasks/', { body: newTask });
    });

    it('creates a task with all optional fields', async () => {
      const newTask = {
        title: 'Complex Task',
        description: 'Detailed description',
        priority: 'high',
        status: 'open',
        assigned_to: 2,
        stage: 3,
        due_date: '2024-12-31',
        project: 5,
        contact: 10,
        company: 15,
      };
      client.api.post.mockResolvedValue({ id: 1, ...newTask });

      await tasksAPI.createTask(newTask);

      expect(client.api.post).toHaveBeenCalledWith('/api/tasks/', { body: newTask });
    });
  });

  describe('updateTask', () => {
    it('updates an existing task', async () => {
      const updatedTask = {
        title: 'Updated Task',
        status: 'in_progress',
      };
      client.api.put.mockResolvedValue({ id: 1, ...updatedTask });

      await tasksAPI.updateTask(1, updatedTask);

      expect(client.api.put).toHaveBeenCalledWith('/api/tasks/1/', { body: updatedTask });
    });
  });

  describe('patchTask', () => {
    it('partially updates a task', async () => {
      const partialUpdate = { status: 'completed' };
      client.api.patch.mockResolvedValue({ id: 1, ...partialUpdate });

      await tasksAPI.patchTask(1, partialUpdate);

      expect(client.api.patch).toHaveBeenCalledWith('/api/tasks/1/', { body: partialUpdate });
    });
  });

  describe('deleteTask', () => {
    it('deletes a task by ID', async () => {
      client.api.delete.mockResolvedValue({});

      await tasksAPI.deleteTask(1);

      expect(client.api.delete).toHaveBeenCalledWith('/api/tasks/1/');
    });
  });

  describe('getTaskStages', () => {
    it('retrieves task stages', async () => {
      const mockStages = {
        results: [
          { id: 1, name: 'В работе' },
          { id: 2, name: 'Завершено' },
        ],
      };
      client.api.get.mockResolvedValue(mockStages);

      await tasksAPI.getTaskStages();

      expect(client.api.get).toHaveBeenCalledWith('/api/task-stages/', { params: {} });
    });

    it('retrieves task stages with parameters', async () => {
      client.api.get.mockResolvedValue({ results: [] });

      await tasksAPI.getTaskStages({ page_size: 100 });

      expect(client.api.get).toHaveBeenCalledWith('/api/task-stages/', { 
        params: { page_size: 100 } 
      });
    });
  });

  describe('getTaskTags', () => {
    it('retrieves task tags', async () => {
      const mockTags = {
        results: [
          { id: 1, name: 'Важно' },
          { id: 2, name: 'Срочно' },
        ],
      };
      client.api.get.mockResolvedValue(mockTags);

      await tasksAPI.getTaskTags();

      expect(client.api.get).toHaveBeenCalledWith('/api/task-tags/', { params: {} });
    });
  });

  describe('completeTask', () => {
    it('marks a task as completed', async () => {
      client.api.patch.mockResolvedValue({ id: 1, status: 'completed' });

      await tasksAPI.completeTask(1);

      expect(client.api.patch).toHaveBeenCalledWith('/api/tasks/1/', {
        body: { status: 'completed' },
      });
    });

    it('marks a task as completed with custom date', async () => {
      client.api.patch.mockResolvedValue({
        id: 1,
        status: 'completed',
        completed_date: '2024-01-15',
      });

      await tasksAPI.completeTask(1, '2024-01-15');

      expect(client.api.patch).toHaveBeenCalledWith('/api/tasks/1/', {
        body: {
          status: 'completed',
          completed_date: '2024-01-15',
        },
      });
    });
  });

  describe('reassignTask', () => {
    it('reassigns a task to another user', async () => {
      client.api.patch.mockResolvedValue({ id: 1, assigned_to: 5 });

      await tasksAPI.reassignTask(1, 5);

      expect(client.api.patch).toHaveBeenCalledWith('/api/tasks/1/', {
        body: { assigned_to: 5 },
      });
    });
  });

  describe('changeTaskPriority', () => {
    it('changes task priority to high', async () => {
      client.api.patch.mockResolvedValue({ id: 1, priority: 'high' });

      await tasksAPI.changeTaskPriority(1, 'high');

      expect(client.api.patch).toHaveBeenCalledWith('/api/tasks/1/', {
        body: { priority: 'high' },
      });
    });

    it('changes task priority to urgent', async () => {
      client.api.patch.mockResolvedValue({ id: 1, priority: 'urgent' });

      await tasksAPI.changeTaskPriority(1, 'urgent');

      expect(client.api.patch).toHaveBeenCalledWith('/api/tasks/1/', {
        body: { priority: 'urgent' },
      });
    });

    it('changes task priority to low', async () => {
      client.api.patch.mockResolvedValue({ id: 1, priority: 'low' });

      await tasksAPI.changeTaskPriority(1, 'low');

      expect(client.api.patch).toHaveBeenCalledWith('/api/tasks/1/', {
        body: { priority: 'low' },
      });
    });
  });

  describe('moveTaskToStage', () => {
    it('moves task to another stage', async () => {
      client.api.patch.mockResolvedValue({ id: 1, stage: 3 });

      await tasksAPI.moveTaskToStage(1, 3);

      expect(client.api.patch).toHaveBeenCalledWith('/api/tasks/1/', {
        body: { stage: 3 },
      });
    });
  });

  describe('bulkTagTasks', () => {
    it('adds tags to multiple tasks', async () => {
      const bulkData = {
        ids: [1, 2, 3],
        tags: [5, 6],
        action: 'add',
      };
      client.api.post.mockResolvedValue({ success: true });

      await tasksAPI.bulkTagTasks(bulkData);

      expect(client.api.post).toHaveBeenCalledWith('/api/tasks/bulk_tag/', {
        body: bulkData,
      });
    });

    it('removes tags from multiple tasks', async () => {
      const bulkData = {
        ids: [1, 2],
        tags: [5],
        action: 'remove',
      };
      client.api.post.mockResolvedValue({ success: true });

      await tasksAPI.bulkTagTasks(bulkData);

      expect(client.api.post).toHaveBeenCalledWith('/api/tasks/bulk_tag/', {
        body: bulkData,
      });
    });

    it('sets tags for multiple tasks', async () => {
      const bulkData = {
        ids: [1, 2, 3],
        tags: [5, 6, 7],
        action: 'set',
      };
      client.api.post.mockResolvedValue({ success: true });

      await tasksAPI.bulkTagTasks(bulkData);

      expect(client.api.post).toHaveBeenCalledWith('/api/tasks/bulk_tag/', {
        body: bulkData,
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors on getTasks', async () => {
      client.api.get.mockRejectedValue(new Error('Network error'));

      await expect(tasksAPI.getTasks()).rejects.toThrow('Network error');
    });

    it('handles 404 errors on getTask', async () => {
      client.api.get.mockRejectedValue(new Error('Task not found'));

      await expect(tasksAPI.getTask(999)).rejects.toThrow('Task not found');
    });

    it('handles validation errors on createTask', async () => {
      client.api.post.mockRejectedValue(new Error('Validation error'));

      await expect(
        tasksAPI.createTask({ title: '' })
      ).rejects.toThrow('Validation error');
    });

    it('handles permission errors on deleteTask', async () => {
      client.api.delete.mockRejectedValue(new Error('Permission denied'));

      await expect(tasksAPI.deleteTask(1)).rejects.toThrow('Permission denied');
    });
  });
});
