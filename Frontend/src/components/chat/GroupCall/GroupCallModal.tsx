// src/components/chat/GroupCall/GroupCallModal.tsx
// Modal hiển thị toàn màn hình phòng gọi nhóm WebRTC LiveKit SFU: lưới video, trạng thái và bảng điều khiển
import React, { useState } from 'react';
import { Participant } from 'livekit-client';
import { ParticipantVideoTile } from './ParticipantVideoTile';
import {
  MicrophoneIcon,
  MicrophoneOffIcon,
  VideoCameraIcon,
  VideoCameraOffIcon,
  ScreenShareIcon,
  ScreenShareOffIcon,
  PhoneHangupIcon,
} from '../VideoCall/CallIcons';
import './GroupCallModal.css';

interface GroupCallModalProps {
  isOpen: boolean;
  isConnecting: boolean;
  conversationName?: string;
  participants: Participant[];
  activeSpeakerIds: Set<string>;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  isHost?: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeaveCall: () => void;
  onEndCallForEveryone?: () => void;
}

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const GroupCallModal: React.FC<GroupCallModalProps> = ({
  isOpen,
  isConnecting,
  conversationName = 'Nhóm trò chuyện',
  participants,
  activeSpeakerIds,
  isMuted,
  isCameraOff,
  isScreenSharing,
  callDuration,
  isHost = false,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onLeaveCall,
  onEndCallForEveryone,
}) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  if (!isOpen) return null;

  const handleHangupClick = () => {
    // Nếu không phải là người tạo cuộc gọi (host): chỉ rời cuộc gọi cá nhân ngay lập tức
    if (!isHost) {
      onLeaveCall();
      return;
    }

    // Nếu là host:
    if (participants.length <= 1) {
      if (onEndCallForEveryone) {
        onEndCallForEveryone();
      } else {
        onLeaveCall();
      }
    } else {
      setShowLeaveConfirm(true);
    }
  };

  const getGridClass = (count: number) => {
    if (count <= 1) return 'group-call-grid--1';
    if (count === 2) return 'group-call-grid--2';
    if (count <= 4) return 'group-call-grid--4';
    if (count <= 6) return 'group-call-grid--6';
    return 'group-call-grid--many';
  };

  return (
    <div className="group-call-overlay">
      {/* 1. Header cuộc gọi */}
      <header className="group-call-header">
        <div className="group-call-header-info">
          <span className="group-call-title">{conversationName}</span>
          <span className="group-call-badge-count">{participants.length} người tham gia</span>
        </div>

        <div className="group-call-header-timer">{formatDuration(callDuration)}</div>
      </header>

      {/* 2. Body: Lưới video người tham gia hoặc trạng thái kết nối */}
      <main className="group-call-body">
        {isConnecting ? (
          <div className="group-call-connecting-state">
            <div className="group-call-spinner" />
            <p className="group-call-connecting-text">Đang kết nối vào phòng gọi LiveKit...</p>
          </div>
        ) : (
          <div className={`group-call-grid ${getGridClass(participants.length)}`}>
            {participants.map((p) => (
              <ParticipantVideoTile
                key={p.sid || p.identity}
                participant={p}
                isSpeaking={activeSpeakerIds.has(p.identity)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 3. Footer: Thanh điều khiển Micro, Camera, Chia sẻ màn hình & Thoát */}
      <footer className="group-call-footer">
        {/* Nút Mic */}
        <button
          type="button"
          className={`group-call-control-btn ${isMuted ? 'group-call-control-btn--active' : ''}`}
          onClick={onToggleMute}
          title={isMuted ? 'Bật Micro' : 'Tắt Micro'}
          aria-label={isMuted ? 'Bật Micro' : 'Tắt Micro'}
        >
          {isMuted ? <MicrophoneOffIcon size={22} /> : <MicrophoneIcon size={22} />}
        </button>

        {/* Nút Camera */}
        <button
          type="button"
          className={`group-call-control-btn ${isCameraOff ? 'group-call-control-btn--active' : ''}`}
          onClick={onToggleCamera}
          title={isCameraOff ? 'Bật Camera' : 'Tắt Camera'}
          aria-label={isCameraOff ? 'Bật Camera' : 'Tắt Camera'}
        >
          {isCameraOff ? <VideoCameraOffIcon size={22} /> : <VideoCameraIcon size={22} />}
        </button>

        {/* Nút Chia sẻ màn hình */}
        <button
          type="button"
          className={`group-call-control-btn ${isScreenSharing ? 'group-call-control-btn--screen-active' : ''}`}
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
          aria-label={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
        >
          {isScreenSharing ? <ScreenShareOffIcon size={22} /> : <ScreenShareIcon size={22} />}
        </button>

        {/* Nút Rời cuộc gọi */}
        <button
          type="button"
          className="group-call-control-btn group-call-control-btn--hangup"
          onClick={handleHangupClick}
          title="Rời hoặc kết thúc cuộc gọi"
          aria-label="Rời hoặc kết thúc cuộc gọi"
        >
          <PhoneHangupIcon size={24} />
        </button>
      </footer>

      {/* Dialog xác nhận khi còn nhiều người trong phòng */}
      {showLeaveConfirm && (
        <div className="group-call-confirm-backdrop">
          <div className="group-call-confirm-card">
            <h3 className="group-call-confirm-title">Rời khỏi cuộc gọi</h3>
            <p className="group-call-confirm-desc">
              {isHost
                ? 'Bạn muốn chỉ một mình bạn rời đi hay kết thúc hoàn toàn cuộc gọi cho tất cả mọi người?'
                : 'Bạn có chắc chắn muốn rời khỏi cuộc gọi này không?'}
            </p>
            <div className="group-call-confirm-actions">
              <button
                type="button"
                className="group-call-confirm-btn group-call-confirm-btn--leave"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onLeaveCall();
                }}
              >
                {isHost ? 'Chỉ rời cuộc gọi' : 'Rời cuộc gọi'}
              </button>

              {isHost && onEndCallForEveryone && (
                <button
                  type="button"
                  className="group-call-confirm-btn group-call-confirm-btn--end"
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    onEndCallForEveryone();
                  }}
                >
                  Kết thúc cuộc gọi cho tất cả
                </button>
              )}

              <button
                type="button"
                className="group-call-confirm-btn group-call-confirm-btn--cancel"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupCallModal;
