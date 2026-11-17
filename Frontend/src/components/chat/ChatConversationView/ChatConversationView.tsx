// src/components/chat/ChatConversationView/ChatConversationView.tsx
// Component hiển thị không gian chat đang hoạt động: Header đối thoại, banner gọi nhóm, danh sách tin nhắn và ô nhập liệu
import React from 'react';
import type { Message, ChatUser, Conversation, ReactType } from '../../../types/chat.types';
import type { CallType, GroupCallStartEvent } from '../../../types/call.types';
import { ChatHeader } from '../ChatHeader/ChatHeader';
import { GroupCallBanner } from '../GroupCall/GroupCallBanner';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import './ChatConversationView.css';

interface ChatConversationViewProps {
  activeConv?: Conversation;
  activeChatUser?: ChatUser | null;
  currentUserId?: number;
  isOnline: boolean;
  isInCall: boolean;
  messages: Message[];
  hasMore: boolean;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  replyingMessage: Message | null;
  activeGroupCallBanner?: GroupCallStartEvent | null;
  onBack: () => void;
  onStartCall: (partner: ChatUser, type: CallType) => void;
  onStartGroupCall?: () => void;
  onJoinGroupCall?: () => void;
  onDismissGroupCallBanner?: () => void;
  onDeleteConversation: () => void;
  onScrollToTop: () => void;
  onReplyMessage: (message: Message) => void;
  onCancelReply: () => void;
  onReactMessage: (messageId: number, reactType: ReactType) => void;
  onEditMessage: (messageId: number, newContent: string) => void;
  onDeleteMessage: (messageId: number) => void;
  onSendMessage: (content: string) => void;
  onUpdateGroupName?: (conversationId: number, newName: string) => Promise<void>;
  onAddMembers?: (conversationId: number, memberIds: number[]) => Promise<void>;
  onRemoveMember?: (conversationId: number, targetUserId: number) => Promise<void>;
  onLeaveGroup?: (conversationId: number) => Promise<void>;
}

export const ChatConversationView: React.FC<ChatConversationViewProps> = ({
  activeConv,
  activeChatUser,
  currentUserId,
  isOnline,
  isInCall,
  messages,
  hasMore,
  isLoadingInitial,
  isLoadingMore,
  chatContainerRef,
  replyingMessage,
  activeGroupCallBanner,
  onBack,
  onStartCall,
  onStartGroupCall,
  onJoinGroupCall,
  onDismissGroupCallBanner,
  onDeleteConversation,
  onScrollToTop,
  onReplyMessage,
  onCancelReply,
  onReactMessage,
  onEditMessage,
  onDeleteMessage,
  onSendMessage,
  onUpdateGroupName,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
}) => {
  return (
    <main className="chat-main">
      {/* Header: Tên và Avatar người đang chat / nhóm & Nút quản lý */}
      <ChatHeader
        user={activeChatUser || activeConv?.otherUser}
        conversation={activeConv}
        conversationName={activeConv?.name}
        isOnline={isOnline}
        isInCall={isInCall}
        onBack={onBack}
        onStartCall={onStartCall}
        onStartGroupCall={onStartGroupCall}
        onDeleteConversation={onDeleteConversation}
        onUpdateGroupName={onUpdateGroupName}
        onAddMembers={onAddMembers}
        onRemoveMember={onRemoveMember}
        onLeaveGroup={onLeaveGroup}
        currentUserId={currentUserId}
      />

      {/* Banner thông báo cuộc gọi nhóm nếu đang diễn ra */}
      {activeGroupCallBanner &&
        activeGroupCallBanner.conversationId === activeConv?.id &&
        onJoinGroupCall &&
        onDismissGroupCallBanner && (
          <GroupCallBanner
            callEvent={activeGroupCallBanner}
            onJoin={onJoinGroupCall}
            onDismiss={onDismissGroupCallBanner}
          />
        )}

      {/* Message List: Danh sách tin nhắn & cuộn tải thêm */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        hasMore={hasMore}
        isLoadingInitial={isLoadingInitial}
        isLoadingMore={isLoadingMore}
        chatContainerRef={chatContainerRef}
        onScrollToTop={onScrollToTop}
        onReplyMessage={onReplyMessage}
        onReactMessage={onReactMessage}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
      />

      {/* Message Input: Ô soạn thảo và gửi tin nhắn */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={false}
        replyingMessage={replyingMessage}
        onCancelReply={onCancelReply}
      />
    </main>
  );
};

export default ChatConversationView;
