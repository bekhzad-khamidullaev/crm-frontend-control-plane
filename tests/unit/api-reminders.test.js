import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../src/lib/api/client.js';
import * as remindersAPI from '../../src/lib/api/reminders.js';

vi.mock('../../src/lib/api/client.js');

describe('Reminders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReminders', () => {
    it('calls the correct endpoint without params', async () => {
      api.get.mockResolvedValue({ results: [], count: 0 });
      await remindersAPI.getReminders();
      expect(api.get).toHaveBeenCalledWith('/api/reminders/', { params: {} });
    });

    it('calls the correct endpoint with params', async () => {
      const params = {
        active: true,
        owner: 1,
        content_type: 12,
        search: 'test',
        ordering: '-reminder_date',
        page: 2,
        page_size: 20,
      };
      api.get.mockResolvedValue({ results: [], count: 0 });
      await remindersAPI.getReminders(params);
      expect(api.get).toHaveBeenCalledWith('/api/reminders/', { params });
    });

    it('handles active filter correctly', async () => {
      api.get.mockResolvedValue({ results: [], count: 0 });
      await remindersAPI.getReminders({ active: false });
      expect(api.get).toHaveBeenCalledWith('/api/reminders/', {
        params: { active: false },
      });
    });
  });

  describe('getReminder', () => {
    it('calls the correct endpoint with ID', async () => {
      const mockReminder = {
        id: 1,
        subject: 'Test reminder',
        reminder_date: '2024-02-15T10:00:00Z',
      };
      api.get.mockResolvedValue(mockReminder);
      
      const result = await remindersAPI.getReminder(1);
      
      expect(api.get).toHaveBeenCalledWith('/api/reminders/1/');
      expect(result).toEqual(mockReminder);
    });

    it('handles API error', async () => {
      api.get.mockRejectedValue(new Error('Not found'));
      
      await expect(remindersAPI.getReminder(999)).rejects.toThrow('Not found');
    });
  });

  describe('createReminder', () => {
    it('calls the correct endpoint with data', async () => {
      const newReminder = {
        subject: 'New reminder',
        description: 'Test description',
        reminder_date: '2024-02-15T10:00:00Z',
        active: true,
        send_notification_email: true,
        content_type: 12,
        object_id: 5,
        owner: 1,
      };
      api.post.mockResolvedValue({ id: 1, ...newReminder });
      
      const result = await remindersAPI.createReminder(newReminder);
      
      expect(api.post).toHaveBeenCalledWith('/api/reminders/', { body: newReminder });
      expect(result.id).toBe(1);
    });

    it('handles required fields only', async () => {
      const minimalReminder = {
        subject: 'Minimal reminder',
        reminder_date: '2024-02-15T10:00:00Z',
        content_type: 12,
        object_id: 5,
      };
      api.post.mockResolvedValue({ id: 2, ...minimalReminder });
      
      await remindersAPI.createReminder(minimalReminder);
      
      expect(api.post).toHaveBeenCalledWith('/api/reminders/', { body: minimalReminder });
    });
  });

  describe('updateReminder', () => {
    it('calls the correct endpoint with full update', async () => {
      const updatedData = {
        subject: 'Updated reminder',
        description: 'Updated description',
        reminder_date: '2024-03-15T10:00:00Z',
        active: false,
        content_type: 12,
        object_id: 5,
      };
      api.put.mockResolvedValue({ id: 1, ...updatedData });
      
      const result = await remindersAPI.updateReminder(1, updatedData);
      
      expect(api.put).toHaveBeenCalledWith('/api/reminders/1/', { body: updatedData });
      expect(result.subject).toBe('Updated reminder');
    });
  });

  describe('patchReminder', () => {
    it('calls the correct endpoint with partial update', async () => {
      const patchData = { active: false };
      api.patch.mockResolvedValue({ id: 1, active: false });
      
      await remindersAPI.patchReminder(1, patchData);
      
      expect(api.patch).toHaveBeenCalledWith('/api/reminders/1/', { body: patchData });
    });

    it('handles single field update', async () => {
      api.patch.mockResolvedValue({ id: 1 });
      
      await remindersAPI.patchReminder(1, { subject: 'New subject' });
      
      expect(api.patch).toHaveBeenCalledWith('/api/reminders/1/', {
        body: { subject: 'New subject' },
      });
    });
  });

  describe('deleteReminder', () => {
    it('calls the correct endpoint', async () => {
      api.delete.mockResolvedValue(undefined);
      
      await remindersAPI.deleteReminder(1);
      
      expect(api.delete).toHaveBeenCalledWith('/api/reminders/1/');
    });

    it('handles deletion error', async () => {
      api.delete.mockRejectedValue(new Error('Delete failed'));
      
      await expect(remindersAPI.deleteReminder(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('getUpcomingReminders', () => {
    it('calls the correct endpoint', async () => {
      api.get.mockResolvedValue({ results: [], count: 0 });
      
      await remindersAPI.getUpcomingReminders();
      
      expect(api.get).toHaveBeenCalledWith('/api/reminders/upcoming/', { params: {} });
    });

    it('accepts query parameters', async () => {
      const params = { page: 1, page_size: 5 };
      api.get.mockResolvedValue({ results: [], count: 0 });
      
      await remindersAPI.getUpcomingReminders(params);
      
      expect(api.get).toHaveBeenCalledWith('/api/reminders/upcoming/', { params });
    });
  });

  describe('Helper Functions', () => {
    describe('setReminderActive', () => {
      it('patches active status to true', async () => {
        api.patch.mockResolvedValue({ id: 1, active: true });
        
        await remindersAPI.setReminderActive(1, true);
        
        expect(api.patch).toHaveBeenCalledWith('/api/reminders/1/', {
          body: { active: true },
        });
      });

      it('patches active status to false', async () => {
        api.patch.mockResolvedValue({ id: 1, active: false });
        
        await remindersAPI.setReminderActive(1, false);
        
        expect(api.patch).toHaveBeenCalledWith('/api/reminders/1/', {
          body: { active: false },
        });
      });
    });

    describe('markReminderCompleted', () => {
      it('sets active to false', async () => {
        api.patch.mockResolvedValue({ id: 1, active: false });
        
        await remindersAPI.markReminderCompleted(1);
        
        expect(api.patch).toHaveBeenCalledWith('/api/reminders/1/', {
          body: { active: false },
        });
      });
    });

    describe('snoozeReminder', () => {
      it('postpones reminder by default 30 minutes', async () => {
        const now = new Date('2024-02-15T10:00:00Z');
        const mockReminder = {
          id: 1,
          reminder_date: now.toISOString(),
        };
        api.get.mockResolvedValue(mockReminder);
        api.patch.mockResolvedValue({ id: 1 });
        
        await remindersAPI.snoozeReminder(1);
        
        expect(api.get).toHaveBeenCalledWith('/api/reminders/1/');
        expect(api.patch).toHaveBeenCalledWith('/api/reminders/1/', {
          body: {
            reminder_date: new Date(now.getTime() + 30 * 60000).toISOString(),
          },
        });
      });

      it('postpones reminder by custom minutes', async () => {
        const now = new Date('2024-02-15T10:00:00Z');
        const mockReminder = {
          id: 1,
          reminder_date: now.toISOString(),
        };
        api.get.mockResolvedValue(mockReminder);
        api.patch.mockResolvedValue({ id: 1 });
        
        await remindersAPI.snoozeReminder(1, 60);
        
        expect(api.patch).toHaveBeenCalledWith('/api/reminders/1/', {
          body: {
            reminder_date: new Date(now.getTime() + 60 * 60000).toISOString(),
          },
        });
      });

      it('handles reminder without date', async () => {
        const mockReminder = { id: 1, reminder_date: null };
        api.get.mockResolvedValue(mockReminder);
        api.patch.mockResolvedValue({ id: 1 });
        
        const beforeCall = Date.now();
        await remindersAPI.snoozeReminder(1, 30);
        const afterCall = Date.now();
        
        expect(api.patch).toHaveBeenCalled();
        const patchCall = api.patch.mock.calls[0][1].body;
        const patchedDate = new Date(patchCall.reminder_date);
        
        // Should be roughly current time + 30 minutes
        expect(patchedDate.getTime()).toBeGreaterThanOrEqual(beforeCall + 30 * 60000 - 1000);
        expect(patchedDate.getTime()).toBeLessThanOrEqual(afterCall + 30 * 60000 + 1000);
      });
    });

    describe('getRemindersByOwner', () => {
      it('filters reminders by owner ID', async () => {
        api.get.mockResolvedValue({ results: [], count: 0 });
        
        await remindersAPI.getRemindersByOwner(5);
        
        expect(api.get).toHaveBeenCalledWith('/api/reminders/', {
          params: { owner: 5 },
        });
      });

      it('combines owner filter with other params', async () => {
        api.get.mockResolvedValue({ results: [], count: 0 });
        
        await remindersAPI.getRemindersByOwner(5, { active: true, page: 2 });
        
        expect(api.get).toHaveBeenCalledWith('/api/reminders/', {
          params: { owner: 5, active: true, page: 2 },
        });
      });
    });

    describe('getRemindersByContent', () => {
      it('filters reminders by content type and object ID', async () => {
        api.get.mockResolvedValue({ results: [], count: 0 });
        
        await remindersAPI.getRemindersByContent(12, 5);
        
        expect(api.get).toHaveBeenCalledWith('/api/reminders/', {
          params: { content_type: 12, object_id: 5 },
        });
      });

      it('combines content filters with other params', async () => {
        api.get.mockResolvedValue({ results: [], count: 0 });
        
        await remindersAPI.getRemindersByContent(12, 5, { search: 'test', page_size: 50 });
        
        expect(api.get).toHaveBeenCalledWith('/api/reminders/', {
          params: { content_type: 12, object_id: 5, search: 'test', page_size: 50 },
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors on get', async () => {
      api.get.mockRejectedValue(new Error('Network error'));
      
      await expect(remindersAPI.getReminders()).rejects.toThrow('Network error');
    });

    it('handles 404 errors', async () => {
      api.get.mockRejectedValue({ status: 404, message: 'Not found' });
      
      await expect(remindersAPI.getReminder(999)).rejects.toEqual({
        status: 404,
        message: 'Not found',
      });
    });

    it('handles validation errors on create', async () => {
      const validationError = {
        status: 400,
        errors: { subject: ['This field is required'] },
      };
      api.post.mockRejectedValue(validationError);
      
      await expect(remindersAPI.createReminder({})).rejects.toEqual(validationError);
    });

    it('handles unauthorized errors', async () => {
      api.get.mockRejectedValue({ status: 401, message: 'Unauthorized' });
      
      await expect(remindersAPI.getReminders()).rejects.toEqual({
        status: 401,
        message: 'Unauthorized',
      });
    });
  });

  describe('Data Types', () => {
    it('handles ISO date strings correctly', async () => {
      const isoDate = '2024-02-15T10:30:00.000Z';
      const reminderData = {
        subject: 'Test',
        reminder_date: isoDate,
        content_type: 12,
        object_id: 5,
      };
      api.post.mockResolvedValue({ id: 1, ...reminderData });
      
      await remindersAPI.createReminder(reminderData);
      
      expect(api.post).toHaveBeenCalledWith('/api/reminders/', {
        body: expect.objectContaining({ reminder_date: isoDate }),
      });
    });

    it('handles boolean flags correctly', async () => {
      const data = {
        subject: 'Test',
        active: true,
        send_notification_email: false,
        reminder_date: '2024-02-15T10:00:00Z',
        content_type: 12,
        object_id: 5,
      };
      api.post.mockResolvedValue({ id: 1, ...data });
      
      await remindersAPI.createReminder(data);
      
      expect(api.post).toHaveBeenCalledWith('/api/reminders/', {
        body: expect.objectContaining({
          active: true,
          send_notification_email: false,
        }),
      });
    });

    it('handles null values appropriately', async () => {
      const data = {
        subject: 'Test',
        description: null,
        owner: null,
        reminder_date: '2024-02-15T10:00:00Z',
        content_type: 12,
        object_id: 5,
      };
      api.post.mockResolvedValue({ id: 1, ...data });
      
      await remindersAPI.createReminder(data);
      
      expect(api.post).toHaveBeenCalledWith('/api/reminders/', { body: data });
    });
  });
});
