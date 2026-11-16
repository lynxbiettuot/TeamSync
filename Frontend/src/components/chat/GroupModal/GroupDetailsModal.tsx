// src/components/chat/GroupModal/GroupDetailsModal.tsx
// Modal xem và quản lý thông tin nhóm: đổi tên, thêm/xóa thành viên, rời nhóm và giải tán nhóm
import React, { useState, useEffect } from 'react';
import type { Conversation, ChatUser } from '../../../types/chat.types';
import { chatService } from '../../../services/chatService';
import './GroupDetailsModal.css';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId?: number;
  onUpdateGroupName: (conversationId: number, newName: string) => Promise<void>;
  onAddMembers: (conversationId: number, memberIds: number[]) => Promise<void>;
  onRemoveMember: (conversationId: number, targetUserId: number) => Promise<void>;
  onLeaveGroup: (conversationId: number) => Promise<void>;
  onDisbandGroup: (conversationId: number) => Promise<void>;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onUpdateGroupName,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDisbandGroup,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = conversation.currentUserRole === 'GROUP_ADMIN';
  const members = conversation.members || [];

  useEffect(() => {
    if (isOpen) {
      setEditedName(conversation.name || '');
      setIsEditingName(false);
      setIsAddingMembers(false);
      setSelectedToAdd([]);
      setSearchQuery('');
      setSearchResults([]);
      setErrorMsg(null);
    }
  }, [isOpen, conversation]);

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
        const filtered = users.filter(
          (u) =>
            !members.some((m) => m.userId === u.id) &&
            !selectedToAdd.some((s) => s.id === u.id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('Lỗi tìm kiếm:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, members, selectedToAdd]);

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === conversation.name) {
      setIsEditingName(false);
      return;
    }
    try {
      setIsSubmitting(true);
      await onUpdateGroupName(conversation.id, editedName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Không thể đổi tên nhóm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectToAdd = (user: ChatUser) => {
    setSelectedToAdd((prev) => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveFromSelected = (userId: number) => {
    setSelectedToAdd((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmitAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    try {
      setIsSubmitting(true);
      await onAddMembers(conversation.id, selectedToAdd.map((u) => u.id));
      setSelectedToAdd([]);
      setIsAddingMembers(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi khi thêm thành viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKickMember = async (targetUserId: number, targetName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${targetName}" khỏi nhóm?`)) {
      try {
        await onRemoveMember(conversation.id, targetUserId);
      } catch (err) {
        console.error(err);
        setErrorMsg('Không thể xóa thành viên');
      }
    }
  };

  const handleLeave = async () => {
    if (window.confirm('Bạn có chắc chắn muốn rời khỏi nhóm trò chuyện này?')) {
      try {
        await onLeaveGroup(conversation.id);
        onClose();
      } catch (err) {
        console.error(err);
        setErrorMsg('Không thể rời nhóm');
      }
    }
  };

  const handleDisband = async () => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn giải tán toàn bộ nhóm này?')) {
      try {
        await onDisbandGroup(conversation.id);
        onClose();
      } catch (err) {
        console.error(err);
        setErrorMsg('Không thể giải tán nhóm');
      }
    }
  };

  return (
    <div className="group-details-backdrop" onClick={onClose}>
      <div className="group-details-card" onClick={(e) => e.stopPropagation()}>
        <div className="group-details-header">
          <h3 className="group-details-title">Thông tin nhóm</h3>
          <button type="button" className="group-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="group-details-body">
          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}

          {/* Top header: Avatar & Tên nhóm */}
          <div className="group-info-top">
            <div className="group-avatar-large">
              {conversation.avatarUrl ? (
                <img src={conversation.avatarUrl} alt={conversation.name || 'Group'} />
              ) : (
                (conversation.name || 'G').charAt(0).toUpperCase()
              )}
            </div>

            <div className="group-info-meta">
              {isEditingName && isAdmin ? (
                <div className="group-edit-form">
                  <input
                    type="text"
                    className="group-edit-input"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="group-edit-save-btn"
                    onClick={handleSaveName}
                    disabled={isSubmitting}
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    className="group-edit-cancel-btn"
                    onClick={() => setIsEditingName(false)}
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="group-name-row">
                  <span className="group-name-text">{conversation.name || 'Nhóm trò chuyện'}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      className="group-edit-btn"
                      onClick={() => setIsEditingName(true)}
                    >
                      ✏️ Đổi tên
                    </button>
                  )}
                </div>
              )}
              <span className="group-members-count">{members.length} thành viên</span>
            </div>
          </div>

          {/* Thêm thành viên (chỉ Admin) */}
          {isAdmin && (
            <div>
              <div className="group-section-title-row">
                <span className="group-section-title">Quản lý thành viên</span>
                <button
                  type="button"
                  className="group-add-member-toggle-btn"
                  onClick={() => setIsAddingMembers(!isAddingMembers)}
                >
                  {isAddingMembers ? 'Thu gọn' : '+ Thêm người vào nhóm'}
                </button>
              </div>

              {isAddingMembers && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="group-modal-input"
                    placeholder="Tìm theo tên hoặc email để thêm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {searchQuery.trim() && (
                    <div className="group-modal-search-results">
                      {isSearching ? (
                        <div style={{ padding: '8px 12px', fontSize: '0.85rem', color: '#64748b' }}>
                          Đang tìm...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div style={{ padding: '8px 12px', fontSize: '0.85rem', color: '#64748b' }}>
                          Không có kết quả
                        </div>
                      ) : (
                        searchResults.map((u) => (
                          <div
                            key={u.id}
                            className="group-modal-search-item"
                            onClick={() => handleSelectToAdd(u)}
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

                  {selectedToAdd.length > 0 && (
                    <div className="group-modal-selected-wrap">
                      {selectedToAdd.map((u) => (
                        <div key={u.id} className="group-modal-chip">
                          <span>{u.displayName}</span>
                          <button
                            type="button"
                            className="group-modal-chip-remove"
                            onClick={() => handleRemoveFromSelected(u.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="group-modal-submit-btn"
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        onClick={handleSubmitAddMembers}
                        disabled={isSubmitting}
                      >
                        Xác nhận thêm
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Danh sách thành viên */}
          <div className="group-members-list">
            {members.map((m) => {
              const isCurrentUser = m.userId === currentUserId;
              const isMemberAdmin = m.role === 'GROUP_ADMIN';

              return (
                <div key={m.userId} className="group-member-item">
                  <div className="group-member-left">
                    <div className="group-member-avatar">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={m.displayName} />
                      ) : (
                        m.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="group-member-info">
                      <span className="group-member-name">
                        {m.displayName} {isCurrentUser && '(Bạn)'}
                      </span>
                      <span className="group-member-email">{m.email}</span>
                    </div>
                  </div>

                  <div className="group-member-right">
                    <span
                      className={`group-role-badge ${
                        isMemberAdmin ? 'group-role-badge--admin' : 'group-role-badge--member'
                      }`}
                    >
                      {isMemberAdmin ? 'Trưởng nhóm' : 'Thành viên'}
                    </span>

                    {/* Nút xóa thành viên (chỉ Admin mới thấy và không xóa chính mình) */}
                    {isAdmin && !isCurrentUser && (
                      <button
                        type="button"
                        className="group-kick-btn"
                        onClick={() => handleKickMember(m.userId, m.displayName)}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="group-details-footer">
          {isAdmin ? (
            <button
              type="button"
              className="group-danger-btn"
              onClick={handleDisband}
            >
              Giải tán nhóm
            </button>
          ) : (
            <button
              type="button"
              className="group-danger-btn"
              onClick={handleLeave}
            >
              Rời nhóm
            </button>
          )}

          <button
            type="button"
            className="group-modal-cancel-btn"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;
