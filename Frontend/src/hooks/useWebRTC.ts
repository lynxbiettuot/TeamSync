// Hook quản lý toàn bộ vòng đời kết nối WebRTC P2P, thiết bị Camera/Micro và tín hiệu STOMP
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatUser } from '../types/chat.types';
import type {
  CallType,
  CallState,
  CallSignalPayload,
  ActiveCallSession,
} from '../types/call.types';
import { callRingtone } from '../utils/callRingtone';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface UseWebRTCProps {
  currentUserId?: number;
  sendCallSignal: (payload: CallSignalPayload) => boolean;
}

export function useWebRTC({ currentUserId, sendCallSignal }: UseWebRTCProps) {
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [callSession, setCallSession] = useState<ActiveCallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const durationTimerRef = useRef<number | null>(null);
  const callingTimeoutRef = useRef<number | null>(null);

  // Đồng bộ localStream ref
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Bộ đếm thời gian khi cuộc gọi được kết nối
  useEffect(() => {
    if (callState === 'CONNECTED') {
      setCallDuration(0);
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState]);

  /**
   * Dọn dẹp toàn bộ tài nguyên (Camera, Micro, PeerConnection, Nhạc chuông)
   */
  const cleanupCall = useCallback(() => {
    callRingtone.stopRingtone();

    if (callingTimeoutRef.current) {
      clearTimeout(callingTimeoutRef.current);
      callingTimeoutRef.current = null;
    }

    // Tắt tất cả track của Camera và Micro
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setRemoteStream(null);
    iceCandidatesQueueRef.current = [];
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
  }, []);

  /**
   * Khởi tạo đối tượng RTCPeerConnection và cấu hình các sự kiện mạng
   */
  const createPeerConnection = useCallback(
    (targetUserId: number): RTCPeerConnection => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Khi trình duyệt tìm thấy địa chỉ IP mạng (ICE Candidate) -> gửi qua STOMP
      pc.onicecandidate = (event) => {
        if (event.candidate && currentUserId) {
          sendCallSignal({
            type: 'ICE_CANDIDATE',
            senderId: currentUserId,
            receiverId: targetUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Khi nhận được luồng hình ảnh/âm thanh từ đối phương
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Theo dõi trạng thái kết nối mạng
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          callRingtone.stopRingtone();
          setCallState('CONNECTED');
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          handleEndCallLocally();
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [currentUserId, sendCallSignal]
  );

  /**
   * Xin quyền và bật Camera/Micro (có cơ chế tự động fallback về Micro nếu Camera bị Device in use khi test trên 1 máy)
   */
  const openMediaDevices = useCallback(async (callType: CallType): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        '⚠️ Lỗi truy cập Camera/Microphone:\nTrình duyệt điện thoại yêu cầu kết nối bảo mật (HTTPS) để sử dụng Camera & Micro.\n\n' +
        'Cách mở nhanh trên điện thoại:\n' +
        '1. Mở Chrome trên điện thoại, truy cập: chrome://flags\n' +
        '2. Tìm kiếm: unsafely-treat-insecure-origin-as-secure\n' +
        '3. Nhập: http://172.16.18.194:5173 và chọn Enabled -> Bấm Relaunch.\n\n' +
        'Hoặc sử dụng HTTPS tunnel (như localtunnel / ngrok).'
      );
      throw new Error('navigator.mediaDevices is not available in insecure context');
    }

    // Nếu là video call, trước hết thử mở cả Camera và Micro
    if (callType === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user',
          },
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        return stream;
      } catch (videoErr: any) {
        console.warn('[WebRTC] Không thể mở Camera (có thể do trùng Camera hoặc bị chặn), tự động chuyển sang Micro:', videoErr);
        // Tự động đánh dấu camera tắt nếu thiết bị bị chiếm dụng (Device in use)
        setIsCameraOff(true);
      }
    }

    // Mở Micro (Audio-only hoặc fallback khi Camera không khả dụng)
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(audioStream);
      localStreamRef.current = audioStream;
      return audioStream;
    } catch (audioErr: any) {
      console.error('[WebRTC] Lỗi mở Micro:', audioErr);
      alert(`Không thể truy cập Micro/Camera: ${audioErr.message || 'Bị từ chối quyền truy cập'}`);
      throw audioErr;
    }
  }, []);

  /**
   * 1. BẮT ĐẦU CUỘC GỌI ĐI (Caller khởi xướng CALL_OFFER)
   */
  const startCall = useCallback(
    async (partner: ChatUser, callType: CallType) => {
      if (!currentUserId || !partner.id) return;

      try {
        setCallState('CALLING');
        setCallSession({ partner, callType, isInitiator: true });
        callRingtone.playOutgoingRingtone();

        const stream = await openMediaDevices(callType);
        const pc = createPeerConnection(partner.id);

        // Gắn các track Camera/Micro vào kết nối P2P
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Tạo bản tin chào mời (SDP Offer)
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Bắn tín hiệu qua STOMP cho người nhận
        sendCallSignal({
          type: 'CALL_OFFER',
          senderId: currentUserId,
          callerId: currentUserId,
          receiverId: partner.id,
          callType,
          sdp: offer,
        });

        // Tự động kết thúc nếu sau 30 giây đổ chuông mà đối phương không trả lời (Cuộc gọi nhỡ)
        if (callingTimeoutRef.current) {
          clearTimeout(callingTimeoutRef.current);
        }
        callingTimeoutRef.current = window.setTimeout(() => {
          console.log('[WebRTC] Hết thời gian chờ (30s) mà đối phương không trả lời');
          sendCallSignal({
            type: 'CALL_END',
            senderId: currentUserId,
            receiverId: partner.id,
            reason: 'TIMEOUT',
          });
          handleEndCallLocally();
        }, 30000);
      } catch (err) {
        console.error('[WebRTC] Lỗi khi bấm gọi:', err);
        cleanupCall();
        setCallState('IDLE');
        setCallSession(null);
      }
    },
    [currentUserId, openMediaDevices, createPeerConnection, sendCallSignal, cleanupCall]
  );

  /**
   * 2. CHẤP NHẬN CUỘC GỌI ĐẾN (Receiver bấm Nghe)
   */
  const acceptCall = useCallback(async () => {
    if (!callSession || !currentUserId || !peerConnectionRef.current) return;

    try {
      callRingtone.stopRingtone();
      setCallState('CONNECTING');

      const stream = await openMediaDevices(callSession.callType);
      const pc = peerConnectionRef.current;

      // Gắn track Camera/Micro của mình vào P2P
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Tạo bản tin đồng ý (SDP Answer)
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Bắn Answer về cho người gọi
      sendCallSignal({
        type: 'CALL_ANSWER',
        senderId: currentUserId,
        callerId: callSession.partner.id,
        receiverId: callSession.partner.id,
        callType: callSession.callType,
        sdp: answer,
      });

      // Bơm các ICE candidates đã được nhận trước đó vào kết nối
      while (iceCandidatesQueueRef.current.length > 0) {
        const candidate = iceCandidatesQueueRef.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    } catch (err) {
      console.error('[WebRTC] Lỗi khi nhận cuộc gọi:', err);
      rejectCall();
    }
  }, [callSession, currentUserId, openMediaDevices, sendCallSignal]);

  /**
   * 3. TỪ CHỐI CUỘC GỌI ĐẾN
   */
  const rejectCall = useCallback(() => {
    if (callSession && currentUserId) {
      sendCallSignal({
        type: 'CALL_REJECT',
        senderId: currentUserId,
        receiverId: callSession.partner.id,
        reason: 'REJECTED',
      });
    }
    cleanupCall();
    setCallState('IDLE');
    setCallSession(null);
  }, [callSession, currentUserId, sendCallSignal, cleanupCall]);

  /**
   * 4. CÚP MÁY / DẬP CUỘC GỌI
   */
  const endCall = useCallback(() => {
    if (callSession && currentUserId) {
      sendCallSignal({
        type: 'CALL_END',
        senderId: currentUserId,
        receiverId: callSession.partner.id,
        reason: 'USER_HANGUP',
      });
    }
    handleEndCallLocally();
  }, [callSession, currentUserId, sendCallSignal]);

  /**
   * Xử lý kết thúc cuộc gọi ở máy cục bộ
   */
  const handleEndCallLocally = useCallback(() => {
    callRingtone.playEndTone();
    setCallState('ENDED');
    setTimeout(() => {
      cleanupCall();
      setCallState('IDLE');
      setCallSession(null);
    }, 1500);
  }, [cleanupCall]);

  /**
   * Bật/Tắt Micro
   */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  /**
   * Bật/Tắt Camera
   */
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  /**
   * 5. TIẾP NHẬN VÀ PHÂN LUỒNG TÍN HIỆU TỪ SERVER (/user/queue/call)
   */
  const handleIncomingSignal = useCallback(
    async (signal: CallSignalPayload) => {
      const senderId = signal.senderId || signal.callerId;
      if (!senderId) return;

      switch (signal.type) {
        case 'CALL_OFFER': {
          // Nếu máy mình đang bận cuộc gọi khác -> Báo bận ngay
          if (callState !== 'IDLE') {
            sendCallSignal({
              type: 'CALL_BUSY',
              senderId: currentUserId,
              receiverId: senderId,
              reason: 'BUSY',
            });
            return;
          }

          const partnerUser: ChatUser = {
            id: senderId,
            email: '',
            displayName: signal.callerName || `Người dùng #${senderId}`,
            avatarUrl: signal.callerAvatar || null,
          };

          const callType: CallType = signal.callType || 'video';
          setCallSession({ partner: partnerUser, callType, isInitiator: false });
          setCallState('INCOMING');
          callRingtone.playIncomingRingtone();

          // Chuẩn bị RTCPeerConnection và nạp sẵn SDP Offer của đối phương
          const pc = createPeerConnection(senderId);
          if (signal.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
          break;
        }

        case 'CALL_ANSWER': {
          if (callingTimeoutRef.current) {
            clearTimeout(callingTimeoutRef.current);
            callingTimeoutRef.current = null;
          }
          // Người nhận đã bấm Nghe -> nạp SDP Answer vào
          if (peerConnectionRef.current && signal.sdp) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(signal.sdp)
            );

            // Bơm các candidate đang chờ trong hàng đợi
            while (iceCandidatesQueueRef.current.length > 0) {
              const candidate = iceCandidatesQueueRef.current.shift();
              if (candidate) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
            }
          }
          break;
        }

        case 'ICE_CANDIDATE': {
          if (signal.candidate) {
            const pc = peerConnectionRef.current;
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } catch (e) {
                console.warn('[WebRTC] Lỗi addIceCandidate:', e);
              }
            } else {
              // Lưu vào hàng đợi nếu remoteDescription chưa sẵn sàng
              iceCandidatesQueueRef.current.push(signal.candidate);
            }
          }
          break;
        }

        case 'CALL_REJECT': {
          handleEndCallLocally();
          break;
        }

        case 'CALL_BUSY': {
          alert('Người dùng hiện đang bận cuộc gọi khác.');
          handleEndCallLocally();
          break;
        }

        case 'CALL_END': {
          handleEndCallLocally();
          break;
        }
      }
    },
    [callState, currentUserId, createPeerConnection, sendCallSignal, handleEndCallLocally]
  );

  // Tự động dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return {
    callState,
    callSession,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    callDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    handleIncomingSignal,
  };
}
