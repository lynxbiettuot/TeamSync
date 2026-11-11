// src/components/chat/NotificationToast.tsx
import React, { useEffect } from 'react';
import type { NotificationItem } from '../../types/chat.types';
import { getNotificationMeta } from './notificationHelpers';

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

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '340px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${meta.accentColor}`,
        borderRadius: '12px',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        zIndex: 1100,
        cursor: 'pointer',
      }}
      onClick={() => onClick(notification)}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: meta.accentBg,
          color: meta.accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {meta.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: meta.accentColor, marginBottom: '2px' }}>
          {meta.label}
        </div>
        <div
          style={{
            fontSize: '13.5px',
            color: '#1E293B',
            lineHeight: 1.35,
            wordBreak: 'break-word',
          }}
        >
          {notification.content}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Đóng thông báo"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94A3B8',
          fontSize: '16px',
          lineHeight: 1,
          cursor: 'pointer',
          padding: '2px 4px',
        }}
      >
        ×
      </button>
    </div>
  );
};

export default NotificationToast;

