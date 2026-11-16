// Khung màn hình hiển thị cuộc gọi Video/Thoại thời gian thực WebRTC P2P
import React, { useRef, useEffect } from 'react';
import type { CallState, ActiveCallSession } from '../../../types/call.types';
import { CallControls } from './CallControls';
import './VideoCallModal.css';

interface VideoCallModalProps {
  callState: CallState;
  callSession: ActiveCallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onHangup: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  callState,
  callSession,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  callDuration,
  onToggleMute,
  onToggleCamera,
  onHangup,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Gắn luồng Camera của mình vào thẻ <video> góc nhỏ
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Gắn luồng Video của đối phương vào thẻ <video> lớn
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'IDLE' || !callSession) {
    return null;
  }

  const partner = callSession.partner;
  const isVideoCall = callSession.callType === 'video';
  const displayName = partner.displayName || partner.email || 'Người dùng';
  const initial = displayName.charAt(0).toUpperCase();

  // Định dạng thời gian đàm thoại MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trạng thái hiển thị trên thanh tiêu đề
  const getStatusText = () => {
    switch (callState) {
      case 'CALLING':
        return 'Đang đổ chuông...';
      case 'CONNECTING':
        return 'Đang thiết lập kết nối...';
      case 'CONNECTED':
        return formatDuration(callDuration);
      case 'ENDED':
        return 'Cuộc gọi đã kết thúc';
      default:
        return '';
    }
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        {/* Topbar: Thông tin người gọi và Thời gian */}
        <div className="video-call-topbar">
          <div className="video-call-partner-info">
            {partner.avatarUrl ? (
              <img src={partner.avatarUrl} alt={displayName} className="video-call-partner-avatar" />
            ) : (
              <div className="video-call-partner-avatar-fallback">{initial}</div>
            )}
            <div>
              <div className="video-call-partner-name">{displayName}</div>
              <div className="video-call-status-badge">{getStatusText()}</div>
            </div>
          </div>

          {callState === 'CONNECTED' && (
            <div className="video-call-timer">{formatDuration(callDuration)}</div>
          )}
        </div>

        {/* Khung hình Video chính (Remote) */}
        <div className="video-call-stage">
          {isVideoCall && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-remote-player"
            />
          ) : (
            <div className="video-voice-placeholder">
              {partner.avatarUrl ? (
                <img src={partner.avatarUrl} alt={displayName} className="voice-avatar-circle" />
              ) : (
                <div className="voice-avatar-fallback">{initial}</div>
              )}
              <div className="voice-calling-text">
                {callState === 'CONNECTED' ? 'Đang trong cuộc gọi thoại' : getStatusText()}
              </div>
            </div>
          )}

          {/* Khung hình Video của mình (Góc dưới nhỏ) */}
          {isVideoCall && (
            <div className="video-local-corner">
              {!isCameraOff && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="video-local-player"
                />
              ) : (
                <div className="video-local-off-placeholder">Camera đã tắt</div>
              )}
            </div>
          )}
        </div>

        {/* Thanh công cụ điều khiển ở đáy */}
        <div className="video-call-bottom-bar">
          <CallControls
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isVideoCall={isVideoCall}
            onToggleMute={onToggleMute}
            onToggleCamera={onToggleCamera}
            onHangup={onHangup}
          />
        </div>
      </div>
    </div>
  );
};
