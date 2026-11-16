// Nút bấm Gọi Thoại và Gọi Video hiển thị trên thanh ChatHeader
import React from 'react';
import type { ChatUser } from '../../../types/chat.types';
import type { CallType } from '../../../types/call.types';
import { PhoneCallIcon, VideoCameraIcon } from './CallIcons';
import './CallHeaderActions.css';

interface CallHeaderActionsProps {
  partner?: ChatUser | null;
  isOnline?: boolean;
  isInCall?: boolean;
  onStartCall: (partner: ChatUser, type: CallType) => void;
}

export const CallHeaderActions: React.FC<CallHeaderActionsProps> = ({
  partner,
  isInCall = false,
  onStartCall,
}) => {
  if (!partner) return null;

  // Cho phép bấm gọi bất cứ lúc nào (kể cả ngoại tuyến), chỉ vô hiệu hóa khi chính mình đang trong cuộc gọi
  const isDisabled = isInCall;

  const getTooltip = (type: string) => {
    if (isInCall) return 'Đang trong một cuộc gọi khác';
    return `Bắt đầu cuộc gọi ${type}`;
  };

  return (
    <div className="call-header-actions">
      {/* Nút Gọi Thoại */}
      <button
        type="button"
        disabled={isDisabled}
        title={getTooltip('thoại')}
        onClick={() => onStartCall(partner, 'audio')}
        className="call-header-btn"
      >
        <PhoneCallIcon size={18} />
      </button>

      {/* Nút Gọi Video */}
      <button
        type="button"
        disabled={isDisabled}
        title={getTooltip('video')}
        onClick={() => onStartCall(partner, 'video')}
        className="call-header-btn"
      >
        <VideoCameraIcon size={18} />
      </button>
    </div>
  );
};
