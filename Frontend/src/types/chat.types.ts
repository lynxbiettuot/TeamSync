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
  reactions?: MessageReaction[];
}

/** Loại cảm xúc thả vào tin nhắn */
export type ReactType = 'LIKE' | 'HAHA' | 'SAD' | 'ANGRY';

/** Đối tượng cảm xúc của một user */
export interface MessageReaction {
  userId: number;
  userName?: string;
  avatarUrl?: string | null;
  reactType: ReactType | null;
}

/** Payload gửi thả cảm xúc qua WebSocket STOMP (/app/chat.react) */
export interface SendReactionPayload {
  conversationId: number;
  messageId: number;
  receiverId: number;
  reactType: ReactType;
}

/** Sự kiện WebSocket khi có thay đổi reaction */
export interface ReactionWebSocketEvent {
  type: 'REACTION';
  conversationId: number;
  messageId: number;
  reaction: MessageReaction;
}

/** Sự kiện WebSocket khi có thay đổi trạng thái Online / Offline (/topic/presence) */
export interface UserPresenceEvent {
  userId: number;
  status: 'ONLINE' | 'OFFLINE';
}

/** Loại thông báo từ Backend (khớp NotificationType enum) */
export type NotificationType = 'MESSAGE' | 'CALL' | 'MENTION';

/** Đối tượng Thông báo từ REST /api/notifications và WebSocket /user/queue/notifications */
export interface NotificationItem {
  id: number;
  notificationType: NotificationType;
  content: string;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}

/** Response từ GET /api/notifications */
export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
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
