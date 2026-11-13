// src/components/chat/MessageItem/MessageItem.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { Message, ReactType } from '../../../types/chat.types';
import './MessageItem.css';

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
        el.classList.add('chat-msg-row--highlighted');
        setTimeout(() => {
          el.classList.remove('chat-msg-row--highlighted');
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
      className={`chat-msg-row ${isMe ? 'chat-msg-row--me' : 'chat-msg-row--other'}`}
    >
      {/* Tên người gửi (khi là tin nhắn của đối phương) */}
      {!isMe && message.senderName && (
        <span className="chat-msg-sender">{message.senderName}</span>
      )}

      {/* Dòng chứa Bubble tin nhắn và Action Buttons */}
      <div className="chat-msg-line">
        {/* Main Bubble */}
        <div className={`chat-msg-bubble ${replyData ? 'chat-msg-bubble--with-reply' : ''}`}>
          {/* Quoted Reply Preview */}
          {replyData && (
            <div
              onClick={handleScrollToParent}
              title="Nhấn để xem tin nhắn gốc"
              className="chat-msg-reply-quote"
            >
              <div className="chat-msg-reply-author">
                <span>↩</span>
                <span>{replyData.senderName || replyData.sender_name || 'Người dùng'}</span>
              </div>
              <div className="chat-msg-reply-text">{replyData.content}</div>
            </div>
          )}

          {/* Nội dung tin nhắn */}
          <div>{message.content}</div>
        </div>

        {/* Hover Action Bar: Nút React 😄 & Nút Reply ↩ */}
        <div
          ref={pickerRef}
          className={`chat-msg-actions ${showPicker ? 'chat-msg-actions--open' : ''}`}
        >
          {/* Emoji Picker Popup (Khi bấm vào nút mặt cười) */}
          {showPicker && (
            <div
              className={`chat-emoji-picker ${
                isMe ? 'chat-emoji-picker--me' : 'chat-emoji-picker--other'
              }`}
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
                    className={`chat-emoji-btn ${isCurrentReact ? 'chat-emoji-btn--active' : ''}`}
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
              className={`chat-action-btn ${showPicker ? 'chat-action-btn--active' : ''}`}
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
              className="chat-action-btn"
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
        <div className="chat-reactions-row">
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
                className={`chat-reaction-badge ${
                  isReactedByMe ? 'chat-reaction-badge--active' : ''
                }`}
              >
                <span>{REACT_EMOJI_MAP[reactType]}</span>
                <span className="chat-reaction-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Timestamp */}
      {timeFormatted && <span className="chat-msg-time">{timeFormatted}</span>}
    </div>
  );
};

export default MessageItem;
