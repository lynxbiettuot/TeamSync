// src/components/chat/Notification/notificationHelpers.ts
import type { NotificationType } from '../../../types/chat.types';

export interface NotificationMeta {
  icon: string;
  label: string;
  accentBg: string;
  accentColor: string;
}

export function getNotificationMeta(type: NotificationType): NotificationMeta {
  switch (type) {
    case 'CALL':
      return {
        icon: '📞',
        label: 'Cuộc gọi',
        accentBg: '#FEF2F2',
        accentColor: '#DC2626',
      };
    case 'MENTION':
      return {
        icon: '@',
        label: 'Nhắc đến bạn',
        accentBg: '#FEF3C7',
        accentColor: '#D97706',
      };
    case 'MESSAGE':
    default:
      return {
        icon: '💬',
        label: 'Tin nhắn mới',
        accentBg: '#EFF6FF',
        accentColor: '#2563EB',
      };
  }
}

export function formatNotificationTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Vừa xong';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

