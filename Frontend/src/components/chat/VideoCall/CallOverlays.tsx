// Component gom nhóm các cửa sổ hiển thị cuộc gọi: Hộp thoại cuộc gọi đến và Màn hình đàm thoại Video/Thoại
import React from 'react';
import type { CallState, ActiveCallSession } from '../../../types/call.types';
import { IncomingCallDialog } from './IncomingCallDialog';
import { VideoCallModal } from './VideoCallModal';

interface CallOverlaysProps {
  callState: CallState;
  callSession: ActiveCallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  onAccept: () => void;
  onReject: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onHangup: () => void;
}

export const CallOverlays: React.FC<CallOverlaysProps> = ({
  callState,
  callSession,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  callDuration,
  onAccept,
  onReject,
  onToggleMute,
  onToggleCamera,
  onHangup,
}) => {
  return (
    <>
      {/* Hộp thoại khi có cuộc gọi đến */}
      {callState === 'INCOMING' && callSession && (
        <IncomingCallDialog
          caller={callSession.partner}
          callType={callSession.callType}
          onAccept={onAccept}
          onReject={onReject}
        />
      )}

      {/* Màn hình hiển thị cuộc gọi Video/Thoại */}
      <VideoCallModal
        callState={callState}
        callSession={callSession}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        callDuration={callDuration}
        onToggleMute={onToggleMute}
        onToggleCamera={onToggleCamera}
        onHangup={onHangup}
      />
    </>
  );
};

export default CallOverlays;
