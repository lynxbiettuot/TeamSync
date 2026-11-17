// src/components/chat/GroupCall/ParticipantVideoTile.tsx
// Component hiển thị luồng video, mic và trạng thái phát biểu của từng thành viên trong cuộc gọi nhóm LiveKit
import React, { useEffect, useRef, useState } from 'react';
import { Participant, ParticipantEvent, Track } from 'livekit-client';
import { MicrophoneOffIcon } from '../VideoCall/CallIcons';
import './ParticipantVideoTile.css';

interface ParticipantVideoTileProps {
  participant: Participant;
  isSpeaking?: boolean;
}

export const ParticipantVideoTile: React.FC<ParticipantVideoTileProps> = ({
  participant,
  isSpeaking = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [hasVideo, setHasVideo] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(!participant.isMicrophoneEnabled);

  useEffect(() => {
    const videoEl = videoRef.current;
    const audioEl = audioRef.current;

    const updateTracks = () => {
      // 1. Kiểm tra luồng video (ưu tiên màn hình chia sẻ nếu có, sau đó đến camera)
      const screenPub = participant.getTrackPublication(Track.Source.ScreenShare);
      const camPub = participant.getTrackPublication(Track.Source.Camera);
      const activeVideoPub = (screenPub?.track && !screenPub.isMuted) ? screenPub : camPub;

      if (videoEl && activeVideoPub?.track && !activeVideoPub.isMuted) {
        activeVideoPub.track.attach(videoEl);
        setHasVideo(true);
      } else {
        if (videoEl) videoEl.srcObject = null;
        setHasVideo(false);
      }

      // 2. Luồng âm thanh: chỉ phát âm thanh của thành viên khác (remote), không phát của chính mình để tránh vọng tiếng
      if (audioEl && !participant.isLocal) {
        const micPub = participant.getTrackPublication(Track.Source.Microphone);
        if (micPub?.track && !micPub.isMuted) {
          micPub.track.attach(audioEl);
        } else {
          audioEl.srcObject = null;
        }
      }

      setIsMicMuted(!participant.isMicrophoneEnabled);
    };

    updateTracks();

    // Lắng nghe các sự kiện track của participant
    participant.on(ParticipantEvent.TrackSubscribed, updateTracks);
    participant.on(ParticipantEvent.TrackUnsubscribed, updateTracks);
    participant.on(ParticipantEvent.TrackMuted, updateTracks);
    participant.on(ParticipantEvent.TrackUnmuted, updateTracks);
    participant.on(ParticipantEvent.LocalTrackPublished, updateTracks);
    participant.on(ParticipantEvent.LocalTrackUnpublished, updateTracks);

    return () => {
      participant.off(ParticipantEvent.TrackSubscribed, updateTracks);
      participant.off(ParticipantEvent.TrackUnsubscribed, updateTracks);
      participant.off(ParticipantEvent.TrackMuted, updateTracks);
      participant.off(ParticipantEvent.TrackUnmuted, updateTracks);
      participant.off(ParticipantEvent.LocalTrackPublished, updateTracks);
      participant.off(ParticipantEvent.LocalTrackUnpublished, updateTracks);

      if (videoEl) {
        const screenPub = participant.getTrackPublication(Track.Source.ScreenShare);
        const camPub = participant.getTrackPublication(Track.Source.Camera);
        screenPub?.track?.detach(videoEl);
        camPub?.track?.detach(videoEl);
      }
      if (audioEl) {
        const micPub = participant.getTrackPublication(Track.Source.Microphone);
        micPub?.track?.detach(audioEl);
      }
    };
  }, [participant]);

  const displayName = participant.name || `Người dùng ${participant.identity}`;
  const initial = displayName.charAt(0).toUpperCase();
  const isScreenSharing = Boolean(
    participant.getTrackPublication(Track.Source.ScreenShare)?.track &&
      !participant.getTrackPublication(Track.Source.ScreenShare)?.isMuted
  );

  return (
    <div
      className={`participant-video-tile ${
        isSpeaking ? 'participant-video-tile--speaking' : ''
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className={`participant-video-element ${
          participant.isLocal && !isScreenSharing ? 'participant-video-element--mirrored' : ''
        } ${!hasVideo ? 'participant-video-hidden' : ''}`}
      />

      {/* Audio Element cho Remote Participants */}
      {!participant.isLocal && <audio ref={audioRef} autoPlay />}

      {/* Avatar Fallback khi Camera tắt hoặc chưa có track video */}
      {!hasVideo && (
        <div className="participant-fallback-avatar">
          <div className="participant-avatar-circle">{initial}</div>
          <span className="participant-avatar-label">Camera đang tắt</span>
        </div>
      )}

      {/* Thanh thông tin & trạng thái */}
      <div className="participant-overlay-bar">
        <div className="participant-name-badge">
          {isSpeaking && <span className="participant-badge-speaking" title="Đang nói" />}
          <span>
            {displayName} {participant.isLocal && '(Bạn)'}
            {isScreenSharing && ' 🖥️'}
          </span>
        </div>

        <div className="participant-status-badges">
          {isMicMuted && (
            <div className="participant-badge-mic-muted" title="Microphone đã tắt">
              <MicrophoneOffIcon size={14} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantVideoTile;
