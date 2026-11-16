// Component hiển thị trạng thái chờ khi người dùng chưa chọn bất kỳ cuộc trò chuyện nào
import React from 'react';
import './ChatEmptyState.css';

export const ChatEmptyState: React.FC = () => {
  return (
    <div className="chat-empty-state">
      <div className="chat-empty-icon">💬</div>
      <div className="chat-empty-title">Chào mừng bạn đến với TeamSync Chat</div>
      <p className="chat-empty-subtitle">
        Hãy tìm kiếm người dùng ở ô bên trái hoặc chọn một cuộc hội thoại gần đây để bắt đầu
        nhắn tin.
      </p>
    </div>
  );
};

export default ChatEmptyState;
