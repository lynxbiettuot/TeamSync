// Component thanh điều hướng chính của trang Chat: hiển thị logo, trạng thái socket, nút E2EE PIN, chuông thông báo và avatar người dùng
import React, { useRef, useState } from 'react';
import type { NotificationItem } from '../../../types/chat.types';
import { NotificationBell } from '../Notification/NotificationBell';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/userService';
import './ChatNavbar.css';

interface ChatNavbarProps {
  isConnected: boolean;
  user: { displayName?: string; email?: string; avatarUrl?: string | null } | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onNotificationClick: (notification: NotificationItem) => void;
  onMarkAllAsRead: () => void;
  onLogout: () => void;
  onOpenE2EEModal?: () => void;
}

export const ChatNavbar: React.FC<ChatNavbarProps> = ({
  isConnected,
  user,
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
  onLogout,
  onOpenE2EEModal,
}) => {
  const { updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await userService.uploadAvatar(file);
      if (res?.data?.avatarUrl) {
        updateUser({ avatarUrl: res.data.avatarUrl });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Tải ảnh đại diện lên Cloudinary thất bại');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initial = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <header className="chat-navbar">
      <div className="chat-brand">
        <div className="chat-brand-badge">T</div>
        <span className="chat-brand-name">TeamSync</span>
      </div>

      <div className="chat-navbar-actions">
        {/* Nút quản lý mã hóa E2EE & PIN */}
        {onOpenE2EEModal && (
          <button
            type="button"
            className="chat-e2ee-btn"
            onClick={onOpenE2EEModal}
            title="Quản lý mã hóa E2EE và mã PIN"
          >
            🛡️ Mã hóa E2EE
          </button>
        )}

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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif"
            style={{ display: 'none' }}
          />
          <div
            className={`chat-navbar-avatar-wrap ${isUploading ? 'chat-navbar-avatar--loading' : ''}`}
            onClick={handleAvatarClick}
            title="Nhấp để thay đổi ảnh đại diện (Cloudinary)"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="chat-navbar-avatar-img" />
            ) : (
              <div className="chat-navbar-avatar-fallback">{initial}</div>
            )}
            <div className="chat-navbar-avatar-overlay">
              {isUploading ? '...' : '📷'}
            </div>
          </div>
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
