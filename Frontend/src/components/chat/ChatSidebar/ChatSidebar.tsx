// src/components/chat/ChatSidebar/ChatSidebar.tsx
import React, { useState, useEffect } from 'react';
import type { Conversation, ChatUser } from '../../../types/chat.types';
import { ConversationItem } from '../ConversationItem/ConversationItem';
import { chatService } from '../../../services/chatService';
import './ChatSidebar.css';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (conversationId: number, user?: ChatUser) => void;
  isLoadingConversations?: boolean;
  onlineUserIds?: Set<number>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoadingConversations = false,
  onlineUserIds = new Set(),
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingDirect, setIsCreatingDirect] = useState(false);

  // Debounce tìm kiếm người dùng qua GET /api/users/search?q={keyword}
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const users = await chatService.searchUsers(searchQuery);
        setSearchResults(users);
      } catch (err) {
        console.error('Lỗi khi tìm kiếm người dùng:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Khi chọn một người dùng từ kết quả tìm kiếm
  const handleSelectUserFromSearch = async (user: ChatUser) => {
    try {
      setIsCreatingDirect(true);
      const res = await chatService.getOrCreateDirectConversation(user.id);
      if (res && res.conversation_id) {
        setSearchQuery('');
        setSearchResults([]);
        onSelectConversation(res.conversation_id, user);
      }
    } catch (err) {
      console.error('Lỗi khi tạo/lấy hội thoại 1-1:', err);
    } finally {
      setIsCreatingDirect(false);
    }
  };

  // Sắp xếp danh sách hội thoại theo updated_at mới nhất
  const sortedConversations = [...conversations].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0).getTime();
    const timeB = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return (
    <aside className="chat-sidebar">
      {/* Ô tìm kiếm người dùng */}
      <div className="chat-search-box">
        <div className="chat-search-input-wrap">
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input"
          />
          {/* Icon kính lúp */}
          <span className="chat-search-icon">🔍</span>
        </div>

        {/* Dropdown danh sách kết quả tìm kiếm */}
        {searchQuery.trim() && (
          <div className="chat-search-dropdown">
            {isSearching ? (
              <div className="chat-search-state">Đang tìm kiếm...</div>
            ) : searchResults.length === 0 ? (
              <div className="chat-search-state">Không tìm thấy người dùng</div>
            ) : (
              searchResults.map((u) => {
                const isUserOnline = onlineUserIds.has(u.id);

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUserFromSearch(u)}
                    className={`chat-search-item ${isCreatingDirect ? 'chat-search-item--busy' : ''}`}
                  >
                    <div className="chat-search-avatar">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="chat-search-avatar-img"
                        />
                      ) : (
                        u.displayName?.charAt(0).toUpperCase() || 'U'
                      )}

                      {/* Chấm tròn xanh nếu đang Online */}
                      {isUserOnline && <span className="chat-search-online-dot" />}
                    </div>
                    <div className="chat-search-meta">
                      <div className="chat-search-name">{u.displayName}</div>
                      <div className="chat-search-email">{u.email}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Tiêu đề danh sách */}
      <div className="chat-sidebar-heading">Đoạn chat gần đây</div>

      {/* Danh sách hội thoại gần đây */}
      <div className="chat-sidebar-list">
        {isLoadingConversations ? (
          <div className="chat-sidebar-loading">Đang tải danh sách...</div>
        ) : sortedConversations.length === 0 ? (
          /* Trường hợp chưa nhắn với ai */
          <div className="chat-sidebar-empty">No conversation available</div>
        ) : (
          sortedConversations.map((conv) => {
            const otherUserId = conv.otherUser?.id;
            const isOnline = otherUserId !== undefined && onlineUserIds.has(otherUserId);

            return (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                isOnline={isOnline}
                onClick={() => onSelectConversation(conv.id, conv.otherUser)}
              />
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
