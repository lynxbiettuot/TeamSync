// src/components/chat/MessageInput.tsx
import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSendMessage(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '16px 24px',
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      <input
        type="text"
        placeholder="Nhập tin nhắn..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          flex: 1,
          height: '44px',
          padding: '0 16px',
          borderRadius: '8px',
          border: '1.5px solid #E2E8F0',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          color: '#1E293B',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
        }}
      />
      <button
        type="submit"
        disabled={disabled || !content.trim()}
        style={{
          height: '44px',
          padding: '0 20px',
          borderRadius: '8px',
          background: disabled || !content.trim() ? '#93C5FD' : '#2563EB',
          color: '#FFFFFF',
          border: 'none',
          fontWeight: 600,
          fontSize: '14px',
          cursor: disabled || !content.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>Gửi</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
};

export default MessageInput;
