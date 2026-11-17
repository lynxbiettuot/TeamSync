// src/hooks/useGroupCall.ts
// Hook quản lý toàn bộ kết nối WebRTC SFU qua LiveKit: phòng gọi, media tracks, mic/cam, chia sẻ màn hình và người tham gia
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  VideoPresets,
  Participant,
} from 'livekit-client';
import { chatService } from '../services/chatService';

export function useGroupCall() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<Set<string>>(new Set());
  const [callDuration, setCallDuration] = useState(0);
  const [isHost, setIsHost] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cập nhật danh sách người tham gia
  const updateParticipantsList = useCallback((room: Room) => {
    const list: Participant[] = [];
    if (room.localParticipant) {
      list.push(room.localParticipant);
    }
    room.remoteParticipants.forEach((p) => {
      list.push(p);
    });
    setParticipants([...list]);
  }, []);

  // Đếm thời lượng cuộc gọi
  useEffect(() => {
    if (isCallActive) {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  // Tham gia cuộc gọi nhóm
  const joinGroupCall = useCallback(
    async (conversationId: number) => {
      if (isConnecting || isCallActive) return;

      try {
        setIsConnecting(true);
        setActiveConversationId(conversationId);

        // 1. Gọi backend lấy LiveKit token
        const res = await chatService.joinGroupCall(conversationId);
        const { token, serverUrl } = res;
        setIsHost(Boolean(res.isHost));

        // 2. Khởi tạo đối tượng Room của LiveKit
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        });
        roomRef.current = room;

        // 3. Lắng nghe các sự kiện của Room
        room
          .on(RoomEvent.Connected, () => {
            setIsCallActive(true);
            setIsConnecting(false);
            updateParticipantsList(room);
          })
          .on(RoomEvent.Disconnected, () => {
            setIsCallActive(false);
            setIsConnecting(false);
            setParticipants([]);
            setActiveConversationId(null);
            setIsScreenSharing(false);
          })
          .on(RoomEvent.ParticipantConnected, () => {
            updateParticipantsList(room);
          })
          .on(RoomEvent.ParticipantDisconnected, () => {
            updateParticipantsList(room);
          })
          .on(RoomEvent.TrackSubscribed, () => {
            updateParticipantsList(room);
          })
          .on(RoomEvent.TrackUnsubscribed, () => {
            updateParticipantsList(room);
          })
          .on(RoomEvent.TrackMuted, () => {
            updateParticipantsList(room);
          })
          .on(RoomEvent.TrackUnmuted, () => {
            updateParticipantsList(room);
          })
          .on(RoomEvent.LocalTrackPublished, () => {
            updateParticipantsList(room);
          })
          .on(RoomEvent.LocalTrackUnpublished, () => {
            updateParticipantsList(room);
          })
          .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            const ids = new Set(speakers.map((s) => s.identity));
            setActiveSpeakerIds(ids);
          });

        // 4. Kết nối tới LiveKit Cloud / Server
        await room.connect(serverUrl, token);

        // 5. Bật Camera và Microphone cá nhân
        try {
          await room.localParticipant.enableCameraAndMicrophone();
          setIsMuted(false);
          setIsCameraOff(false);
        } catch (mediaErr) {
          console.warn('[LiveKit] Không mở được cả cam và mic cùng lúc, thử mở riêng mic:', mediaErr);
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
            setIsMuted(false);
            setIsCameraOff(true);
          } catch (micErr) {
            console.error('[LiveKit] Không mở được microphone:', micErr);
            setIsMuted(true);
            setIsCameraOff(true);
          }
        }

        updateParticipantsList(room);
      } catch (err) {
        console.error('[LiveKit] Lỗi khi tham gia cuộc gọi nhóm:', err);
        setIsConnecting(false);
        setIsCallActive(false);
        setActiveConversationId(null);
        alert('Không thể kết nối tới phòng gọi nhóm. Vui lòng thử lại.');
      }
    },
    [isCallActive, isConnecting, updateParticipantsList]
  );

  // Rời cuộc gọi
  const leaveGroupCall = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsCallActive(false);
    setIsConnecting(false);
    setActiveConversationId(null);
    setParticipants([]);
    setIsScreenSharing(false);
    setIsHost(false);
  }, []);

  // Kết thúc cuộc gọi nhóm (bắn tín hiệu cho cả nhóm)
  const endGroupCall = useCallback(
    async (conversationId: number) => {
      try {
        await chatService.endGroupCall(conversationId);
      } catch (err) {
        console.error('[LiveKit] Lỗi khi kết thúc cuộc gọi nhóm:', err);
      } finally {
        leaveGroupCall();
      }
    },
    [leaveGroupCall]
  );

  // Bật / Tắt Microphone
  const toggleMute = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return;
    const nextState = !isMuted;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!nextState);
      setIsMuted(nextState);
    } catch (err) {
      console.error('Lỗi chuyển đổi microphone:', err);
    }
  }, [isMuted]);

  // Bật / Tắt Camera
  const toggleCamera = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return;
    const nextState = !isCameraOff;
    try {
      await roomRef.current.localParticipant.setCameraEnabled(!nextState);
      setIsCameraOff(nextState);
    } catch (err) {
      console.error('Lỗi chuyển đổi camera:', err);
    }
  }, [isCameraOff]);

  // Bật / Tắt Chia sẻ màn hình
  const toggleScreenShare = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return;
    const nextState = !isScreenSharing;
    try {
      await roomRef.current.localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);
    } catch (err) {
      console.error('Lỗi chia sẻ màn hình:', err);
      setIsScreenSharing(false);
    }
  }, [isScreenSharing]);

  return {
    isCallActive,
    isConnecting,
    activeConversationId,
    participants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    activeSpeakerIds,
    callDuration,
    isHost,
    joinGroupCall,
    leaveGroupCall,
    endGroupCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}

export default useGroupCall;
