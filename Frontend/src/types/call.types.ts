// Định nghĩa kiểu dữ liệu cho tính năng Gọi Thoại & Video Call WebRTC 1-1 qua STOMP
import type { ChatUser } from './chat.types';

export type CallType = 'video' | 'audio';

export type CallSignalType =
  | 'CALL_OFFER'
  | 'CALL_ANSWER'
  | 'ICE_CANDIDATE'
  | 'CALL_REJECT'
  | 'CALL_BUSY'
  | 'CALL_END';

export interface CallSignalPayload {
  type: CallSignalType;
  senderId?: number;
  callerId?: number;
  callerName?: string;
  callerAvatar?: string;
  receiverId: number;
  callType?: CallType;
  sdp?: any;
  candidate?: any;
  reason?: string;
}

export type CallState =
  | 'IDLE'        // Rảnh, không có cuộc gọi nào
  | 'CALLING'     // Đang bấm gọi đi, chờ đối phương nhấc máy
  | 'INCOMING'    // Có cuộc gọi đến, chuông đang reo
  | 'CONNECTING'  // Đang bắt tay WebRTC P2P
  | 'CONNECTED'   // Đã thông mạng, đang đàm thoại
  | 'ENDED';      // Cuộc gọi kết thúc, chuẩn bị đóng modal

export interface ActiveCallSession {
  partner: ChatUser;
  callType: CallType;
  isInitiator: boolean;
}
