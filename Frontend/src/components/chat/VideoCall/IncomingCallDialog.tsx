// Hộp thoại popup chuông reo khi có người khác gọi đến
import React from 'react';
import type { ChatUser } from '../../../types/chat.types';
import type { CallType } from '../../../types/call.types';
import { PhoneCallIcon, PhoneHangupIcon, VideoCameraIcon } from './CallIcons';
import './IncomingCallDialog.css';

interface IncomingCallDialogProps {
  caller: ChatUser;
  callType: CallType;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  caller,
  callType,
  onAccept,
  onReject,
}) => {
  const displayName = caller.displayName || caller.email || 'Người dùng ẩn danh';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card">
        {/* Avatar với hiệu ứng gợn sóng nhịp đập */}
        <div className="incoming-avatar-wrap">
          <div className="incoming-avatar-pulse" />
          {caller.avatarUrl ? (
            <img src={caller.avatarUrl} alt={displayName} className="incoming-avatar-img" />
          ) : (
            <div className="incoming-avatar-fallback">{initial}</div>
          )}
        </div>

        {/* Tên người gọi & Loại cuộc gọi */}
        <div className="incoming-caller-name">{displayName}</div>
        <div className="incoming-call-subtitle">
          {callType === 'video' ? 'Cuộc gọi Video đến...' : 'Cuộc gọi Thoại đến...'}
        </div>

        {/* 2 Nút: Từ chối (Đỏ) và Nghe máy (Xanh) */}
        <div className="incoming-call-actions">
          {/* Nút Từ chối */}
          <div className="incoming-action-group">
            <button
              onClick={onReject}
              title="Từ chối cuộc gọi"
              className="incoming-action-btn incoming-action-btn--reject"
            >
              <PhoneHangupIcon size={24} />
            </button>
            <span className="incoming-action-label">Từ chối</span>
          </div>

          {/* Nút Chấp nhận */}
          <div className="incoming-action-group">
            <button
              onClick={onAccept}
              title="Trả lời cuộc gọi"
              className="incoming-action-btn incoming-action-btn--accept"
            >
              {callType === 'video' ? <VideoCameraIcon size={24} /> : <PhoneCallIcon size={24} />}
            </button>
            <span className="incoming-action-label">Trả lời</span>
          </div>
        </div>
      </div>
    </div>
  );
};
