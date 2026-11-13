import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import type { NotificationItem } from '../types/chat.types';

interface UseChatNotificationsProps {
  activeConversationId: number | null;
  onNavigateToConversation?: (conversationId: number) => void;
}

export function useChatNotifications({
  activeConversationId,
  onNavigateToConversation,
}: UseChatNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Lấy danh sách thông báo ban đầu từ MySQL qua GET /api/notifications
  useEffect(() => {
    notificationService.getMyNotifications().then((res) => {
      setNotifications(res.notifications || []);
    });
  }, []);

  // Xử lý khi nhận thông báo realtime từ RabbitMQ Consumer (/user/queue/notifications)
  const handleNotificationReceived = useCallback(
    (incoming: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });

      // Chỉ bật Toast popup nổi nếu người dùng chưa mở đúng cuộc trò chuyện đó
      if (
        incoming.notificationType !== 'MESSAGE' ||
        incoming.referenceId !== activeConversationId
      ) {
        setToastNotification(incoming);
      }
    },
    [activeConversationId]
  );

  // Click vào item thông báo
  const handleNotificationClick = useCallback(
    (notification: NotificationItem) => {
      setToastNotification(null);

      if (!notification.isRead) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        notificationService
          .markAsRead(notification.id)
          .catch((err) => console.error('Lỗi đánh dấu thông báo đã đọc:', err));
      }

      if (
        notification.referenceId &&
        (notification.notificationType === 'MESSAGE' || notification.notificationType === 'MENTION')
      ) {
        onNavigateToConversation?.(notification.referenceId);
      }
    },
    [onNavigateToConversation]
  );

  // Đánh dấu tất cả thông báo là đã đọc
  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notificationService
      .markAllAsRead()
      .catch((err) => console.error('Lỗi đánh dấu tất cả thông báo đã đọc:', err));
  }, []);

  // Đóng toast thông báo
  const handleDismissToast = useCallback(() => {
    setToastNotification(null);
  }, []);

  return {
    notifications,
    toastNotification,
    unreadCount,
    handleNotificationReceived,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleDismissToast,
  };
}

export default useChatNotifications;

