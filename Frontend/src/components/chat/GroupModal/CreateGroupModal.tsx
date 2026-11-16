// src/components/chat/GroupModal/CreateGroupModal.tsx
// Modal tạo nhóm trò chuyện mới: đặt tên nhóm và tìm kiếm chọn thành viên
import React, { useState, useEffect } from 'react';
import type { ChatUser } from '../../../types/chat.types';
import { chatService } from '../../../services/chatService';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, memberIds: number[]) => Promise<void>;
  currentUserId?: number;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  currentUserId,
}) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedMembers([]);
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
        // Loại bỏ user hiện tại và các user đã chọn
        const filtered = users.filter(
          (u) => u.id !== currentUserId && !selectedMembers.some((m) => m.id === u.id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('Lỗi tìm kiếm thành viên:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId, selectedMembers]);

  if (!isOpen) return null;

  const handleSelectUser = (user: ChatUser) => {
    setSelectedMembers((prev) => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: number) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setErrorMsg('Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedMembers.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const memberIds = selectedMembers.map((m) => m.id);
      await onCreateGroup(groupName.trim(), memberIds);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(error?.response?.data?.error || error?.message || 'Có lỗi xảy ra khi tạo nhóm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group-modal-backdrop" onClick={onClose}>
      <div className="group-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="group-modal-header">
          <h3 className="group-modal-title">Tạo nhóm trò chuyện mới</h3>
          <button type="button" className="group-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="group-modal-body">
            {errorMsg && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            <div className="group-modal-field">
              <label className="group-modal-label">Tên nhóm *</label>
              <input
                type="text"
                className="group-modal-input"
                placeholder="Ví dụ: Team Dự Án, Hội Bạn Thân..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="group-modal-field">
              <label className="group-modal-label">Thêm thành viên *</label>
              <input
                type="text"
                className="group-modal-input"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Danh sách kết quả tìm kiếm */}
              {searchQuery.trim() && (
                <div className="group-modal-search-results">
                  {isSearching ? (
                    <div style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#64748b' }}>
                      Đang tìm kiếm...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#64748b' }}>
                      Không tìm thấy người dùng
                    </div>
                  ) : (
                    searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="group-modal-search-item"
                        onClick={() => handleSelectUser(u)}
                      >
                        <div className="group-modal-user-avatar">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.displayName} />
                          ) : (
                            u.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="group-modal-user-info">
                          <span className="group-modal-user-name">{u.displayName}</span>
                          <span className="group-modal-user-email">{u.email}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Danh sách thành viên đã chọn */}
              {selectedMembers.length > 0 && (
                <div className="group-modal-selected-wrap">
                  {selectedMembers.map((m) => (
                    <div key={m.id} className="group-modal-chip">
                      <span>{m.displayName}</span>
                      <button
                        type="button"
                        className="group-modal-chip-remove"
                        onClick={() => handleRemoveMember(m.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="group-modal-footer">
            <button
              type="button"
              className="group-modal-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="group-modal-submit-btn"
              disabled={isSubmitting || !groupName.trim() || selectedMembers.length === 0}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
