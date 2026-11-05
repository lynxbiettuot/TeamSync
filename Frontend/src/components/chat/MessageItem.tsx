// src/components/chat/MessageItem.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { Message, ReactType } from '../../types/chat.types';

export const REACT_EMOJI_MAP: Record<ReactType, string> = {
  LIKE: '👍',
  HAHA: '😂',
  SAD: '😢',
  ANGRY: '😡',
};

export const AVAILABLE_REACTIONS: { type: ReactType; emoji: string; label: string }[] = [
  { type: 'LIKE', emoji: '👍', label: 'Thích' },
  { type: 'HAHA', emoji: '😂', label: 'Haha' },
  { type: 'SAD', emoji: '😢', label: 'Buồn' },
  { type: 'ANGRY', emoji: '😡', label: 'Phẫn nộ' },
];

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  currentUserId?: number;
  onReply?: (message: Message) => void;
  onReact?: (messageId: number, reactType: ReactType) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMe,
  currentUserId,
  onReply,
  onReact,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const timeRaw = message.createdAt || message.created_at || '';
  const timeFormatted = timeRaw
    ? new Date(timeRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const replyData = message.replyTo || message.reply_to;

  // Đóng picker khi click ra ngoài
  useEffect(() => {
    if (!showPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleScrollToParent = () => {
    if (replyData?.id) {
      const el = document.getElementById(`message-${replyData.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'background-color 0.4s ease';
        el.style.backgroundColor = 'rgba(37, 99, 235, 0.15)';
        setTimeout(() => {
          el.style.backgroundColor = 'transparent';
        }, 1200);
      }
    }
  };

  const handleSelectReaction = (reactType: ReactType) => {
    if (onReact) {
      onReact(message.id, reactType);
    }
    setShowPicker(false);
  };

  // Gom nhóm reactions theo reactType
  const reactionGroups = (message.reactions || []).reduce<Record<ReactType, typeof message.reactions>>(
    (acc, r) => {
      if (r && r.reactType) {
        if (!acc[r.reactType]) {
          acc[r.reactType] = [];
        }
        acc[r.reactType]!.push(r);
      }
      return acc;
    },
    {} as Record<ReactType, typeof message.reactions>
  );

  const hasReactions = Object.keys(reactionGroups).length > 0;

  return (
    <div
      id={`message-${message.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!showPicker) setShowPicker(false);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        width: '100%',
        borderRadius: '8px',
        padding: '2px 4px',
        position: 'relative',
      }}
    >
      {/* Tên người gửi (khi là tin nhắn của đối phương) */}
      {!isMe && message.senderName && (
        <span style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '3px', marginLeft: '4px' }}>
          {message.senderName}
        </span>
      )}

      {/* Dòng chứa Bubble tin nhắn và Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '72%',
          flexDirection: isMe ? 'row-reverse' : 'row',
          position: 'relative',
        }}
      >
        {/* Main Bubble */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
            background: isMe ? '#2563EB' : '#FFFFFF',
            color: isMe ? '#FFFFFF' : '#1E293B',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
            fontSize: '14px',
            lineHeight: '1.45',
            wordBreak: 'break-word',
            border: isMe ? 'none' : '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: replyData ? '160px' : 'unset',
            position: 'relative',
          }}
        >
          {/* Quoted Reply Preview */}
          {replyData && (
            <div
              onClick={handleScrollToParent}
              title="Nhấn để xem tin nhắn gốc"
              style={{
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
                background: isMe ? 'rgba(255, 255, 255, 0.18)' : '#F1F5F9',
                borderLeft: isMe ? '3.5px solid #FFFFFF' : '3.5px solid #2563EB',
                marginBottom: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isMe ? '#DBEAFE' : '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>↩</span>
                <span>{replyData.senderName || replyData.sender_name || 'Người dùng'}</span>
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: isMe ? '#F1F5F9' : '#475569',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '240px',
                }}
              >
                {replyData.content}
              </div>
            </div>
          )}

          {/* Nội dung tin nhắn */}
          <div>{message.content}</div>
        </div>

        {/* Hover Action Bar: Nút React 😄 & Nút Reply ↩ */}
        <div
          ref={pickerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: isHovered || showPicker ? 1 : 0,
            pointerEvents: isHovered || showPicker ? 'auto' : 'none',
            transition: 'opacity 0.15s ease',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Emoji Picker Popup (Khi bấm vào nút mặt cười) */}
          {showPicker && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                [isMe ? 'right' : 'left']: 0,
                marginBottom: '6px',
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '4px 8px',
                display: 'flex',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                border: '1px solid #E2E8F0',
                zIndex: 40,
                animation: 'popIn 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              {AVAILABLE_REACTIONS.map(({ type, emoji, label }) => {
                const isCurrentReact =
                  currentUserId !== undefined &&
                  message.reactions?.some(
                    (r) => r.userId === currentUserId && r.reactType === type
                  );

                return (
                  <button
                    key={type}
                    onClick={() => handleSelectReaction(type)}
                    title={label}
                    style={{
                      background: isCurrentReact ? '#EFF6FF' : 'transparent',
                      border: isCurrentReact ? '1px solid #3B82F6' : 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '18px',
                      transition: 'transform 0.15s ease, background-color 0.15s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.28)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}

          {/* Nút mở Emoji Picker */}
          {onReact && (
            <button
              onClick={() => setShowPicker((prev) => !prev)}
              title="Thả cảm xúc"
              style={{
                background: showPicker ? '#EFF6FF' : '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: showPicker ? '#2563EB' : '#64748B',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: 0,
                fontSize: '13px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#2563EB';
                e.currentTarget.style.background = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                if (!showPicker) {
                  e.currentTarget.style.color = '#64748B';
                  e.currentTarget.style.background = '#FFFFFF';
                }
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
          )}

          {/* Nút Reply */}
          {onReply && (
            <button
              onClick={() => onReply(message)}
              title="Trả lời tin nhắn này"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#2563EB';
                e.currentTarget.style.background = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.background = '#FFFFFF';
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Hiển thị các Reaction Badges dưới bubble tin nhắn */}
      {hasReactions && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '3px',
            marginRight: isMe ? '4px' : '0',
            marginLeft: isMe ? '0' : '4px',
            justifyContent: isMe ? 'flex-end' : 'flex-start',
          }}
        >
          {Object.entries(reactionGroups).map(([type, list]) => {
            const reactType = type as ReactType;
            const count = list ? list.length : 0;
            if (count === 0) return null;

            const isReactedByMe =
              currentUserId !== undefined &&
              list?.some((r) => r.userId === currentUserId);

            // Danh sách tên người đã react (để hiện tooltip)
            const names = (list || [])
              .map((r) =>
                currentUserId !== undefined && r.userId === currentUserId
                  ? 'Bạn'
                  : r.userName || `User ${r.userId}`
              )
              .join(', ');

            return (
              <button
                key={type}
                onClick={() => onReact && onReact(message.id, reactType)}
                title={`${names} đã thả cảm xúc`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: isReactedByMe ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                  background: isReactedByMe ? '#EFF6FF' : '#FFFFFF',
                  color: isReactedByMe ? '#1D4ED8' : '#475569',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isReactedByMe ? '#93C5FD' : '#E2E8F0';
                }}
              >
                <span>{REACT_EMOJI_MAP[reactType]}</span>
                <span style={{ fontWeight: 600, fontSize: '11px' }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Timestamp */}
      {timeFormatted && (
        <span
          style={{
            fontSize: '11px',
            color: '#94A3B8',
            marginTop: '3px',
            marginRight: isMe ? '4px' : '0',
            marginLeft: isMe ? '0' : '4px',
          }}
        >
          {timeFormatted}
        </span>
      )}
    </div>
  );
};

export default MessageItem;
