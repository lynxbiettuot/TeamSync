// Thanh công cụ điều khiển cuộc gọi: Bật/Tắt Mic, Bật/Tắt Camera, Cúp máy
import React from 'react';
import {
  MicrophoneIcon,
  MicrophoneOffIcon,
  VideoCameraIcon,
  VideoCameraOffIcon,
  PhoneHangupIcon,
} from './CallIcons';
import './CallControls.css';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isVideoCall: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onHangup: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isCameraOff,
  isVideoCall,
  onToggleMute,
  onToggleCamera,
  onHangup,
}) => {
  return (
    <div className="call-controls">
      {/* Nút Bật/Tắt Micro */}
      <button
        onClick={onToggleMute}
        title={isMuted ? 'Bật micro' : 'Tắt micro'}
        className={`call-control-btn ${
          isMuted ? 'call-control-btn--muted' : 'call-control-btn--active'
        }`}
      >
        {isMuted ? <MicrophoneOffIcon size={22} /> : <MicrophoneIcon size={22} />}
      </button>

      {/* Nút Bật/Tắt Camera (Chỉ hiện khi là cuộc gọi Video) */}
      {isVideoCall && (
        <button
          onClick={onToggleCamera}
          title={isCameraOff ? 'Bật camera' : 'Tắt camera'}
          className={`call-control-btn ${
            isCameraOff ? 'call-control-btn--muted' : 'call-control-btn--active'
          }`}
        >
          {isCameraOff ? <VideoCameraOffIcon size={22} /> : <VideoCameraIcon size={22} />}
        </button>
      )}

      {/* Nút Cúp máy đỏ */}
      <button
        onClick={onHangup}
        title="Kết thúc cuộc gọi"
        className="call-control-btn call-control-btn--hangup"
      >
        <PhoneHangupIcon size={24} />
      </button>
    </div>
  );
};
