// src/services/notificationService.ts
import { apiClient } from './apiClient';
import type { NotificationItem, NotificationListResponse } from '../types/chat.types';

function extractPayload(response: unknown): Record<string, unknown> {
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if ('data' in obj && obj.data && typeof obj.data === 'object') {
      return obj.data as Record<string, unknown>;
    }
    return obj;
  }
  return {};
}

export const notificationService = {
  /**
   * Lấy danh sách thông báo của user hiện tại và số lượng chưa đọc
   * GET /api/notifications
   */
  async getMyNotifications(): Promise<NotificationListResponse> {
    try {
      const res = await apiClient.get<unknown>('/api/notifications');
      const payload = extractPayload(res);
      const rawList = Array.isArray(payload.notifications) ? payload.notifications : [];
      const notifications: NotificationItem[] = rawList.map((item) => {
        const n = item as Record<string, unknown>;
        return {
          id: Number(n.id),
          notificationType: (n.notificationType as NotificationItem['notificationType']) || 'MESSAGE',
          content: String(n.content ?? ''),
          referenceId: n.referenceId !== undefined && n.referenceId !== null ? Number(n.referenceId) : null,
          isRead: Boolean(n.isRead ?? n.read),
          createdAt: String(n.createdAt ?? ''),
        };
      });

      const unreadCount =
        typeof payload.unreadCount === 'number'
          ? payload.unreadCount
          : notifications.filter((n) => !n.isRead).length;

      return { notifications, unreadCount };
    } catch (err) {
      console.error('Lỗi khi lấy danh sách thông báo:', err);
      return { notifications: [], unreadCount: 0 };
    }
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   * PUT /api/notifications/{id}/read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.put(`/api/notifications/${notificationId}/read`);
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.put('/api/notifications/read-all');
  },
};

export default notificationService;

