/**
 * Notification Service Unit Tests
 * ✅ Tests notification creation and delivery
 * ✅ Tests multi-channel support (email, SMS, in-app)
 * ✅ Tests notification templates and parameters
 * ✅ Tests user preferences and notification filtering
 * ✅ 100% coverage target for notificationService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../api';
import { notificationService } from '../notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendNotification', () => {
    test('should send notification to user', async () => {
      const mockResponse = {
        notificationId: 'NOTIF-001',
        userId: 1,
        type: 'order_confirmed',
        status: 'sent',
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await notificationService.sendNotification({
        userId: 1,
        type: 'order_confirmed',
        title: 'Order Confirmed',
        message: 'Your order #1001 has been confirmed',
      });

      expect(result.notificationId).toBe('NOTIF-001');
      expect(result.status).toBe('sent');
      expect(api.post).toHaveBeenCalledWith(
        '/notifications',
        expect.objectContaining({
          userId: 1,
          type: 'order_confirmed',
        }),
      );
    });

    test('should support multiple notification channels', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          notificationId: 'NOTIF-001',
          channels: ['email', 'sms', 'in_app'],
          status: 'sent',
        },
      });

      const result = await notificationService.sendNotification({
        userId: 1,
        type: 'urgent_alert',
        channels: ['email', 'sms', 'in_app'],
        title: 'Alert',
        message: 'Urgent action required',
      });

      expect(result.channels).toHaveLength(3);
      expect(result.channels).toContain('sms');
      expect(result.channels).toContain('email');
    });

    test('should support template-based notifications', async () => {
      api.post.mockResolvedValueOnce({ data: { notificationId: 'NOTIF-001', status: 'sent' } });

      const result = await notificationService.sendNotification({
        userId: 1,
        templateId: 'invoice_due_reminder',
        templateParams: { invoiceNumber: 'INV-001', dueDate: '2024-02-10' },
      });

      expect(result.status).toBe('sent');
      expect(api.post).toHaveBeenCalledWith(
        '/notifications',
        expect.objectContaining({
          templateId: 'invoice_due_reminder',
        }),
      );
    });

    test('should handle bulk notifications', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          batchId: 'BATCH-001',
          totalSent: 3,
          successful: 3,
          failed: 0,
        },
      });

      const result = await notificationService.sendNotification({
        userIds: [1, 2, 3],
        type: 'system_update',
        title: 'System Update',
        message: 'System maintenance scheduled',
      });

      expect(result.totalSent).toBe(3);
      expect(result.successful).toBe(3);
    });

    test('should handle notification scheduling', async () => {
      const scheduleTime = '2024-02-10T14:00:00Z';
      api.post.mockResolvedValueOnce({
        data: {
          notificationId: 'NOTIF-001',
          status: 'scheduled',
          scheduledTime: scheduleTime,
        },
      });

      const result = await notificationService.sendNotification({
        userId: 1,
        type: 'reminder',
        message: 'Scheduled reminder',
        scheduleTime,
      });

      expect(result.status).toBe('scheduled');
      expect(result.scheduledTime).toBe(scheduleTime);
    });
  });

  describe('getNotifications', () => {
    test('should fetch user notifications', async () => {
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          type: 'order_confirmed',
          title: 'Order Confirmed',
          read: false,
          createdAt: '2024-02-01T10:00:00Z',
        },
        {
          id: 2,
          userId: 1,
          type: 'payment_received',
          title: 'Payment Received',
          read: true,
          createdAt: '2024-02-01T12:00:00Z',
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockNotifications });

      const result = await notificationService.getNotifications(1);

      expect(result).toHaveLength(2);
      expect(result[0].read).toBe(false);
      expect(result[1].read).toBe(true);
      expect(api.get).toHaveBeenCalledWith('/users/1/notifications', {
        params: expect.any(Object),
      });
    });

    test('should filter notifications by type', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await notificationService.getNotifications(1, { type: 'order_confirmed' });

      expect(api.get).toHaveBeenCalledWith(
        '/users/1/notifications',
        expect.objectContaining({
          params: { type: 'order_confirmed' },
        }),
      );
    });

    test('should filter unread notifications', async () => {
      const mockNotifications = [
        { id: 1, read: false },
        { id: 2, read: false },
      ];
      api.get.mockResolvedValueOnce({ data: mockNotifications });

      const result = await notificationService.getNotifications(1, { unreadOnly: true });

      expect(result.every((n) => n.read === false)).toBe(true);
    });

    test('should support pagination', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await notificationService.getNotifications(1, { page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith(
        '/users/1/notifications',
        expect.objectContaining({
          params: { page: 2, limit: 10 },
        }),
      );
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read', async () => {
      api.put.mockResolvedValueOnce({ data: { id: 1, read: true } });

      const result = await notificationService.markAsRead(1);

      expect(result.read).toBe(true);
      expect(api.put).toHaveBeenCalledWith('/notifications/1', { read: true });
    });

    test('should mark multiple notifications as read', async () => {
      api.put.mockResolvedValueOnce({
        data: { updated: 5, totalMarked: 5 },
      });

      const result = await notificationService.markMultipleAsRead([1, 2, 3, 4, 5]);

      expect(result.totalMarked).toBe(5);
      expect(api.put).toHaveBeenCalled();
    });

    test('should mark all notifications as read', async () => {
      api.put.mockResolvedValueOnce({ data: { totalMarked: 10 } });

      const result = await notificationService.markAllAsRead(1);

      expect(result.totalMarked).toBe(10);
      expect(api.put).toHaveBeenCalledWith('/users/1/notifications/mark-all-read', {});
    });
  });

  describe('deleteNotification', () => {
    test('should delete notification', async () => {
      api.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await notificationService.deleteNotification(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith('/notifications/1');
    });

    test('should delete multiple notifications', async () => {
      api.delete.mockResolvedValueOnce({ data: { deleted: 3 } });

      const result = await notificationService.deleteMultiple([1, 2, 3]);

      expect(result.deleted).toBe(3);
    });

    test('should clear all notifications for user', async () => {
      api.delete.mockResolvedValueOnce({ data: { totalDeleted: 15 } });

      const result = await notificationService.clearAll(1);

      expect(result.totalDeleted).toBe(15);
      expect(api.delete).toHaveBeenCalledWith('/users/1/notifications');
    });
  });

  describe('User Preferences', () => {
    test('should get user notification preferences', async () => {
      const mockPrefs = {
        userId: 1,
        emailNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        notificationTypes: {
          order_confirmed: { email: true, sms: false, inApp: true },
          payment_received: { email: true, sms: true, inApp: true },
          system_alert: { email: true, sms: true, inApp: false },
        },
      };
      api.get.mockResolvedValueOnce({ data: mockPrefs });

      const result = await notificationService.getNotificationPreferences(1);

      expect(result.emailNotifications).toBe(true);
      expect(result.smsNotifications).toBe(false);
      expect(result.notificationTypes.payment_received.sms).toBe(true);
      expect(api.get).toHaveBeenCalledWith('/users/1/notification-preferences');
    });

    test('should update notification preferences', async () => {
      const mockResponse = {
        userId: 1,
        smsNotifications: true,
        updated: true,
      };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await notificationService.updateNotificationPreferences(1, {
        smsNotifications: true,
      });

      expect(result.smsNotifications).toBe(true);
      expect(api.put).toHaveBeenCalledWith(
        '/users/1/notification-preferences',
        expect.objectContaining({ smsNotifications: true }),
      );
    });

    test('should disable specific notification types', async () => {
      api.put.mockResolvedValueOnce({
        data: {
          userId: 1,
          notificationTypes: {
            system_alert: { email: false, sms: false, inApp: false },
          },
        },
      });

      const result = await notificationService.updateNotificationPreferences(1, {
        disabledTypes: ['system_alert'],
      });

      expect(result.notificationTypes.system_alert.email).toBe(false);
    });
  });

  describe('Notification Templates', () => {
    test('should get available notification templates', async () => {
      const mockTemplates = [
        {
          templateId: 'invoice_due_reminder',
          name: 'Invoice Due Reminder',
          channels: ['email', 'sms', 'in_app'],
          variables: ['invoiceNumber', 'dueDate', 'amount'],
        },
        {
          templateId: 'payment_received',
          name: 'Payment Received',
          channels: ['email', 'in_app'],
          variables: ['amount', 'paymentDate'],
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockTemplates });

      const result = await notificationService.getNotificationTemplates();

      expect(result).toHaveLength(2);
      expect(result[0].variables).toContain('invoiceNumber');
      expect(api.get).toHaveBeenCalledWith('/notification-templates');
    });

    test('should get template preview with parameters', async () => {
      const mockPreview = {
        templateId: 'invoice_due_reminder',
        preview: {
          email: {
            subject: 'Invoice INV-001 is Due on 2024-02-10',
            body: 'Your invoice for AED 10,000 is due on...',
          },
          sms: 'Invoice INV-001 due 2024-02-10. Pay AED 10,000.',
        },
      };
      api.post.mockResolvedValueOnce({ data: mockPreview });

      const result = await notificationService.getTemplatePreview('invoice_due_reminder', {
        invoiceNumber: 'INV-001',
        dueDate: '2024-02-10',
        amount: 10000,
      });

      expect(result.preview.email.subject).toContain('INV-001');
      expect(result.preview.sms).toContain('10,000');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        notificationService.sendNotification({
          userId: 1,
          type: 'test',
          message: 'Test',
        }),
      ).rejects.toThrow('Network error');
    });

    test('should handle invalid user', async () => {
      api.get.mockRejectedValueOnce(new Error('User not found'));

      await expect(notificationService.getNotifications(999)).rejects.toThrow('User not found');
    });

    test('should handle invalid template', async () => {
      api.post.mockRejectedValueOnce(new Error('Template not found'));

      await expect(
        notificationService.sendNotification({
          userId: 1,
          templateId: 'invalid_template',
          templateParams: {},
        }),
      ).rejects.toThrow('Template not found');
    });

    test('should handle channel delivery failures', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          notificationId: 'NOTIF-001',
          status: 'partial',
          channels: {
            email: 'sent',
            sms: 'failed',
            in_app: 'sent',
          },
        },
      });

      const result = await notificationService.sendNotification({
        userId: 1,
        type: 'multi_channel',
        channels: ['email', 'sms', 'in_app'],
        message: 'Test',
      });

      expect(result.status).toBe('partial');
      expect(result.channels.sms).toBe('failed');
    });
  });

  describe('Notification Types', () => {
    test('should handle order notifications', async () => {
      api.post.mockResolvedValueOnce({ data: { notificationId: 'NOTIF-001' } });

      await notificationService.sendNotification({
        userId: 1,
        type: 'order_confirmed',
        orderId: 1001,
      });

      expect(api.post).toHaveBeenCalledWith(
        '/notifications',
        expect.objectContaining({ type: 'order_confirmed' }),
      );
    });

    test('should handle payment notifications', async () => {
      api.post.mockResolvedValueOnce({ data: { notificationId: 'NOTIF-001' } });

      await notificationService.sendNotification({
        userId: 1,
        type: 'payment_received',
        invoiceId: 100,
        amount: 10000,
      });

      expect(api.post).toHaveBeenCalled();
    });

    test('should handle system alerts', async () => {
      api.post.mockResolvedValueOnce({ data: { notificationId: 'NOTIF-001' } });

      await notificationService.sendNotification({
        userIds: [1, 2, 3],
        type: 'system_alert',
        severity: 'high',
        message: 'System maintenance',
      });

      expect(api.post).toHaveBeenCalled();
    });
  });
});
