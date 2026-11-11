// src/components/chat/NotificationBell.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { NotificationItem } from '../../types/chat.types';
import { formatNotificationTime, getNotificationMeta } from './notificationHelpers';

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
  const [hoveredId, setHoveredId] = useState<number | null>(null);
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
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Nút Chuông */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Thông báo"
        title="Thông báo"
        style={{
          position: 'relative',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          background: isOpen ? '#EFF6FF' : '#F8FAFC',
          color: isOpen ? '#2563EB' : '#475569',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
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
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '9999px',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FFFFFF',
              boxSizing: 'border-box',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown danh sách thông báo */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '360px',
            maxHeight: '440px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {/* Header Dropdown */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#2563EB',
                    background: '#EFF6FF',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '6px',
                }}
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Danh sách */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: '#94A3B8',
                  fontSize: '13.5px',
                }}
              >
                <div style={{ fontSize: '26px', marginBottom: '8px' }}>🔔</div>
                Chưa có thông báo nào
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getNotificationMeta(item.notificationType);
                const isHovered = hoveredId === item.id;
                const bg = isHovered ? '#F1F5F9' : !item.isRead ? '#EFF6FF' : '#FFFFFF';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderBottom: '1px solid #F1F5F9',
                      background: bg,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    {/* Icon loại thông báo */}
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

                    {/* Nội dung */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: !item.isRead ? 600 : 400,
                          color: '#1E293B',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.content}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: !item.isRead ? '#2563EB' : '#94A3B8',
                          marginTop: '4px',
                          fontWeight: !item.isRead ? 500 : 400,
                        }}
                      >
                        {formatNotificationTime(item.createdAt)}
                      </div>
                    </div>

                    {/* Chấm xanh chưa đọc */}
                    {!item.isRead && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#2563EB',
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />
                    )}
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

