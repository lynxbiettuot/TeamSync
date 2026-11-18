// Component ô nhập tin nhắn: gửi tin nhắn văn bản, đính kèm tệp tin/hình ảnh và phản hồi trích dẫn
import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../../../types/chat.types';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendAttachment?: (file: File, content: string) => Promise<void>;
  disabled?: boolean;
  replyingMessage?: Message | null;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendAttachment,
  disabled = false,
  replyingMessage,
  onCancelReply,
}) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (replyingMessage && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingMessage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Kích thước tệp đính kèm tối đa là 25MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isUploading) return;

    if (selectedFile) {
      if (!onSendAttachment) return;
      try {
        setIsUploading(true);
        await onSendAttachment(selectedFile, content.trim());
        setSelectedFile(null);
        setContent('');
      } catch (err) {
        console.error('Lỗi khi gửi tệp đính kèm:', err);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (!content.trim()) return;
    onSendMessage(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      if (selectedFile) {
        e.preventDefault();
        handleCancelFile();
      } else if (replyingMessage && onCancelReply) {
        e.preventDefault();
        onCancelReply();
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageFile = selectedFile?.type.startsWith('image/');

  return (
    <div className="chat-input-wrapper">
      {/* File đính kèm đã chọn */}
      {selectedFile && (
        <div className="chat-file-preview-banner">
          <div className="chat-file-preview-content">
            <span className="chat-file-preview-icon">{isImageFile ? '🖼️' : '📄'}</span>
            <div className="chat-file-preview-details">
              <span className="chat-file-preview-name" title={selectedFile.name}>{selectedFile.name}</span>
              <span className="chat-file-preview-size">{formatFileSize(selectedFile.size)}</span>
            </div>
          </div>
          <button
            type="button"
            className="chat-file-preview-remove"
            onClick={handleCancelFile}
            title="Hủy tệp đã chọn (Esc)"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner hiển thị tin nhắn đang được phản hồi */}
      {replyingMessage && (
        <div className="chat-reply-banner">
          <div className="chat-reply-banner-body">
            <div className="chat-reply-banner-meta">
              <span className="chat-reply-banner-title">
                <span>↩ Đang trả lời</span>
                <span className="chat-reply-banner-author">
                  {replyingMessage.senderName || 'Tin nhắn'}
                </span>
              </span>
              <span className="chat-reply-banner-preview">{replyingMessage.content}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancelReply}
            title="Hủy phản hồi (Esc)"
            className="chat-reply-cancel-btn"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form nhập nội dung và nút gửi */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="chat-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          title="Đính kèm tệp tin hoặc ảnh"
        >
          📎
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder={
            selectedFile
              ? 'Thêm chú thích cho tệp...'
              : replyingMessage
              ? 'Nhập tin nhắn trả lời...'
              : 'Nhập tin nhắn...'
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isUploading}
          className={`chat-input-field ${replyingMessage ? 'chat-input-field--replying' : ''}`}
        />
        <button
          type="submit"
          disabled={disabled || isUploading || (!content.trim() && !selectedFile)}
          className="chat-send-btn"
        >
          {isUploading ? (
            <span>Đang gửi...</span>
          ) : (
            <>
              <span>Gửi</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
