// src/types/chat.types.ts

export type ConversationType = 'INDIVIDUAL' | 'GROUP';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

/** Thông tin người dùng trong chat */
export interface ChatUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status?: string;
}

/** Cuộc hội thoại ở Sidebar */
export interface Conversation {
  id: number;
  name?: string | null;
  conversationType?: ConversationType;
  conversation_type?: ConversationType;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  lastMessage?: string | null;
  last_message?: string | null;
  otherUser?: ChatUser;
  unreadCount?: number;
}

/** Thông tin trích dẫn khi phản hồi tin nhắn */
export interface ReplyMessage {
  id: number;
  content: string;
  senderName?: string;
  sender_name?: string;
}

/** Đối tượng Tin nhắn */
export interface Message {
  id: number;
  conversationId?: number;
  conversation_id?: number;
  senderId?: number;
  sender_id?: number;
  user?: ChatUser;
  senderName?: string;
  senderAvatar?: string | null;
  content: string;
  messageType?: MessageType;
  message_type?: MessageType;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  replyTo?: ReplyMessage | null;
  reply_to?: ReplyMessage | null;
}

/** Payload gửi qua WebSocket STOMP (/app/chat.send) */
export interface SendMessagePayload {
  conversation_id: number;
  receiver_id: number;
  content: string;
  message_type: 'TEXT';
  reply_to_message_id?: number | null;
  replyToMessageId?: number | null;
}

/** Response phân trang Cursor-based từ GET /api/messages/{conversationId} */
export interface MessagesPaginationResponse {
  data: Message[];
  hasMore: boolean;
}

/** Response tạo/lấy hội thoại 1-1 từ POST /api/conversations/direct/{userId} */
export interface DirectConversationResponse {
  conversation_id: number;
}
