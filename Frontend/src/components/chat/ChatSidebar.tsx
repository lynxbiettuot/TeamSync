// src/components/chat/ChatSidebar.tsx
import React, { useState, useEffect } from 'react';
import type { Conversation, ChatUser } from '../../types/chat.types';
import { ConversationItem } from './ConversationItem';
import { chatService } from '../../services/chatService';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (conversationId: number, user?: ChatUser) => void;
  isLoadingConversations?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoadingConversations = false,
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
    <aside
      style={{
        width: '320px',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* Ô tìm kiếm người dùng */}
      <div style={{ padding: '16px 16px 12px 16px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px 0 36px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '13.5px',
              outline: 'none',
              boxSizing: 'border-box',
              color: '#1E293B',
            }}
          />
          {/* Search Icon */}
          <svg
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              pointerEvents: 'none',
            }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown danh sách kết quả tìm kiếm */}
        {searchQuery.trim().length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: '16px',
              right: '16px',
              background: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E2E8F0',
              maxHeight: '260px',
              overflowY: 'auto',
              zIndex: 50,
              padding: '6px',
            }}
          >
            {isSearching ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
                Đang tìm kiếm...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
                Không tìm thấy người dùng phù hợp
              </div>
            ) : (
              searchResults.map((u) => (
                <div
                  key={u.id}
                  onClick={() => !isCreatingDirect && handleSelectUserFromSearch(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: isCreatingDirect ? 'wait' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#DBEAFE',
                      color: '#1D4ED8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '13px',
                      flexShrink: 0,
                    }}
                  >
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                      />
                    ) : (
                      u.displayName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: '#1E293B',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.displayName}
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: '#64748B',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.email}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tiêu đề danh sách */}
      <div
        style={{
          padding: '4px 16px 8px 16px',
          fontSize: '11.5px',
          fontWeight: 700,
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Đoạn chat gần đây
      </div>

      {/* Danh sách hội thoại gần đây */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px 8px' }}>
        {isLoadingConversations ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
            Đang tải danh sách...
          </div>
        ) : sortedConversations.length === 0 ? (
          /* Trường hợp chưa nhắn với ai */
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            No conversation available
          </div>
        ) : (
          sortedConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id, conv.otherUser)}
            />
          ))
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
