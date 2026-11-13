// src/components/chat/Notification/NotificationToast.tsx
import React, { useEffect } from 'react';
import type { NotificationItem } from '../../../types/chat.types';
import { getNotificationMeta } from './notificationHelpers';
import './Notification.css';

interface NotificationToastProps {
  notification: NotificationItem | null;
  onClick: (notification: NotificationItem) => void;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClick,
  onDismiss,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const meta = getNotificationMeta(notification.notificationType);
  const typeClass = `chat-notif--${(notification.notificationType || 'MESSAGE').toLowerCase()}`;

  return (
    <div className={`chat-toast ${typeClass}`} onClick={() => onClick(notification)}>
      <div className="chat-notif-icon">{meta.icon}</div>

      <div className="chat-toast-body">
        <div className="chat-toast-label">{meta.label}</div>
        <div className="chat-toast-text">{notification.content}</div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Đóng thông báo"
        className="chat-toast-close"
      >
        ×
      </button>
    </div>
  );
};

export default NotificationToast;

