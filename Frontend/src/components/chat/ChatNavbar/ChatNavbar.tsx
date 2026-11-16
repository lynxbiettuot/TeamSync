// Component thanh điều hướng chính của trang Chat: hiển thị logo, trạng thái socket, chuông thông báo và thông tin user
import React from 'react';
import type { NotificationItem } from '../../../types/chat.types';
import { NotificationBell } from '../Notification/NotificationBell';
import './ChatNavbar.css';

interface ChatNavbarProps {
  isConnected: boolean;
  user: { displayName?: string; email?: string } | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onNotificationClick: (notification: NotificationItem) => void;
  onMarkAllAsRead: () => void;
  onLogout: () => void;
}

export const ChatNavbar: React.FC<ChatNavbarProps> = ({
  isConnected,
  user,
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
  onLogout,
}) => {
  return (
    <header className="chat-navbar">
      <div className="chat-brand">
        <div className="chat-brand-badge">T</div>
        <span className="chat-brand-name">TeamSync</span>
      </div>

      <div className="chat-navbar-actions">
        {/* Trạng thái kết nối WebSocket của chính mình */}
        <div
          className={`chat-ws-status ${
            isConnected ? 'chat-ws-status--online' : 'chat-ws-status--offline'
          }`}
        >
          <span className="chat-ws-dot" />
          {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
        </div>

        {/* Chuông thông báo */}
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onNotificationClick={onNotificationClick}
          onMarkAllAsRead={onMarkAllAsRead}
        />

        {/* User Profile & Đăng xuất */}
        <div className="chat-user-menu">
          <span className="chat-user-name">{user?.displayName || user?.email}</span>
          <button onClick={onLogout} className="chat-logout-btn">
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};

export default ChatNavbar;
