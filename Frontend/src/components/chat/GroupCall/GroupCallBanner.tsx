// src/components/chat/GroupCall/GroupCallBanner.tsx
// Banner hiển thị thông báo cuộc gọi nhóm đang diễn ra kèm nút Tham gia ngay
import React from 'react';
import type { GroupCallStartEvent } from '../../../types/call.types';
import { VideoCameraIcon } from '../VideoCall/CallIcons';
import './GroupCallBanner.css';

interface GroupCallBannerProps {
  callEvent: GroupCallStartEvent;
  onJoin: () => void;
  onDismiss: () => void;
}

export const GroupCallBanner: React.FC<GroupCallBannerProps> = ({
  callEvent,
  onJoin,
  onDismiss,
}) => {
  return (
    <div className="group-call-banner">
      <div className="group-call-banner-left">
        <div className="group-call-banner-icon-wrap">
          <span className="group-call-banner-icon-pulse" />
          <VideoCameraIcon size={18} />
        </div>
        <div className="group-call-banner-info">
          <span className="group-call-banner-title">Cuộc gọi nhóm đang diễn ra</span>
          <span className="group-call-banner-subtitle">
            Bắt đầu bởi <strong>{callEvent.callerName}</strong>
          </span>
        </div>
      </div>

      <div className="group-call-banner-right">
        <button
          type="button"
          className="group-call-banner-join-btn"
          onClick={onJoin}
        >
          <VideoCameraIcon size={16} />
          <span>Tham gia</span>
        </button>
        <button
          type="button"
          className="group-call-banner-dismiss-btn"
          onClick={onDismiss}
          title="Bỏ qua thông báo"
          aria-label="Đóng banner"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GroupCallBanner;
