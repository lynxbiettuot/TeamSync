// src/components/chat/Notification/NotificationBell.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { NotificationItem } from '../../../types/chat.types';
import { formatNotificationTime, getNotificationMeta } from './notificationHelpers';
import './Notification.css';

interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onNotificationClick: (notification: NotificationItem) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectItem = (item: NotificationItem) => {
    setIsOpen(false);
    onNotificationClick(item);
  };

  return (
    <div ref={containerRef} className="chat-notif-wrapper">
      {/* Nút Chuông */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Thông báo"
        title="Thông báo"
        className={`chat-notif-bell-btn ${isOpen ? 'chat-notif-bell-btn--open' : ''}`}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="chat-notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown danh sách thông báo */}
      {isOpen && (
        <div className="chat-notif-dropdown">
          {/* Header Dropdown */}
          <div className="chat-notif-header">
            <div className="chat-notif-title-group">
              <span className="chat-notif-title">Thông báo</span>
              {unreadCount > 0 && (
                <span className="chat-notif-count-pill">{unreadCount} mới</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="chat-notif-mark-all-btn"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Danh sách */}
          <div className="chat-notif-list">
            {notifications.length === 0 ? (
              <div className="chat-notif-empty">
                <div className="chat-notif-empty-icon">🔔</div>
                Chưa có thông báo nào
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getNotificationMeta(item.notificationType);
                const typeClass = `chat-notif--${(item.notificationType || 'MESSAGE').toLowerCase()}`;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`chat-notif-item ${typeClass} ${
                      !item.isRead ? 'chat-notif-item--unread' : ''
                    }`}
                  >
                    {/* Icon loại thông báo */}
                    <div className="chat-notif-icon">{meta.icon}</div>

                    {/* Nội dung */}
                    <div className="chat-notif-content-wrap">
                      <div className="chat-notif-text">{item.content}</div>
                      <div className="chat-notif-time">
                        {formatNotificationTime(item.createdAt)}
                      </div>
                    </div>

                    {/* Chấm xanh chưa đọc */}
                    {!item.isRead && <span className="chat-notif-unread-dot" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

