// src/pages/chat/ChatPage.tsx
// Trang chính ChatPage: kết hợp Navbar, Sidebar, ConversationView, CallOverlays (1-1) và GroupCallModal (LiveKit SFU)
import React from 'react';
import { useChatPageLogic } from './useChatPageLogic';
import { ChatNavbar } from '../../components/chat/ChatNavbar/ChatNavbar';
import { ChatSidebar } from '../../components/chat/ChatSidebar/ChatSidebar';
import { ChatConversationView } from '../../components/chat/ChatConversationView/ChatConversationView';
import { ChatEmptyState } from '../../components/chat/ChatEmptyState/ChatEmptyState';
import { NotificationToast } from '../../components/chat/Notification/NotificationToast';
import { CallOverlays } from '../../components/chat/VideoCall/CallOverlays';
import { GroupCallModal } from '../../components/chat/GroupCall/GroupCallModal';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const {
    user,
    logout,
    currentUserId,
    isConnected,
    conversations,
    isLoadingConversations,
    activeConversationId,
    activeChatUser,
    activeConv,
    isChatUserOnline,
    onlineUserIds,
    selectConversation,
    notifications,
    toastNotification,
    unreadCount,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleDismissToast,
    messages,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    chatContainerRef,
    loadOlderMessages,
    replyingMessage,
    setReplyingMessage,
    handleSendMessage,
    handleReactMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleDeleteConversation,
    handleCreateGroup,
    handleUpdateGroupName,
    handleAddGroupMembers,
    handleRemoveGroupMember,
    handleLeaveGroup,
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
    isGroupCallActive,
    isGroupCallConnecting,
    groupCallParticipants,
    groupCallDuration,
    isGroupCallMuted,
    isGroupCallCameraOff,
    isGroupCallScreenSharing,
    groupCallActiveSpeakerIds,
    isGroupCallHost,
    activeGroupCallBanner,
    handleStartGroupCall,
    handleJoinGroupCall,
    handleDismissGroupCallBanner,
    handleEndGroupCallForEveryone,
    leaveGroupCall,
    toggleGroupCallMute,
    toggleGroupCallCamera,
    toggleGroupCallScreenShare,
  } = useChatPageLogic();

  return (
    <div className="chat-page">
      {/* 1. Thanh điều hướng Navbar trên cùng */}
      <ChatNavbar
        isConnected={isConnected}
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
        onLogout={logout}
      />

      {/* 2. Không gian làm việc Chat */}
      <div className={`chat-workspace ${activeConversationId ? 'has-active-chat' : ''}`}>
        {/* Left Sidebar: Danh sách chat (1-1 & Nhóm), tìm kiếm và nút tạo nhóm */}
        <ChatSidebar
          conversations={conversations}
          isLoadingConversations={isLoadingConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(convId, selectedUser) => {
            setReplyingMessage(null);
            selectConversation(convId, selectedUser);
          }}
          onlineUserIds={onlineUserIds}
          onCreateGroup={handleCreateGroup}
          currentUserId={currentUserId}
        />

        {/* Right Section: Khung Chat đang hoạt động hoặc Màn hình chờ */}
        {activeConversationId ? (
          <ChatConversationView
            activeConv={activeConv}
            activeChatUser={activeChatUser}
            currentUserId={currentUserId}
            isOnline={isChatUserOnline}
            isInCall={callState !== 'IDLE' || isGroupCallActive || isGroupCallConnecting}
            messages={messages}
            hasMore={hasMore}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            chatContainerRef={chatContainerRef}
            replyingMessage={replyingMessage}
            activeGroupCallBanner={activeGroupCallBanner}
            onBack={() => selectConversation(null)}
            onStartCall={startCall}
            onStartGroupCall={handleStartGroupCall}
            onJoinGroupCall={handleJoinGroupCall}
            onDismissGroupCallBanner={handleDismissGroupCallBanner}
            onDeleteConversation={handleDeleteConversation}
            onScrollToTop={loadOlderMessages}
            onReplyMessage={setReplyingMessage}
            onCancelReply={() => setReplyingMessage(null)}
            onReactMessage={handleReactMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onSendMessage={handleSendMessage}
            onUpdateGroupName={handleUpdateGroupName}
            onAddMembers={handleAddGroupMembers}
            onRemoveMember={handleRemoveGroupMember}
            onLeaveGroup={handleLeaveGroup}
          />
        ) : (
          <ChatEmptyState />
        )}
      </div>

      {/* 3. Toast thông báo nổi khi có sự kiện mới */}
      <NotificationToast
        notification={toastNotification}
        onClick={handleNotificationClick}
        onDismiss={handleDismissToast}
      />

      {/* 4. Các modal hiển thị cuộc gọi WebRTC 1-1 */}
      <CallOverlays
        callState={callState}
        callSession={callSession}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        callDuration={callDuration}
        onAccept={acceptCall}
        onReject={rejectCall}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onHangup={endCall}
      />

      {/* 5. Modal toàn màn hình cuộc gọi nhóm LiveKit SFU */}
      <GroupCallModal
        isOpen={isGroupCallActive || isGroupCallConnecting}
        isConnecting={isGroupCallConnecting}
        conversationName={activeConv?.name || 'Nhóm trò chuyện'}
        participants={groupCallParticipants}
        activeSpeakerIds={groupCallActiveSpeakerIds}
        isMuted={isGroupCallMuted}
        isCameraOff={isGroupCallCameraOff}
        isScreenSharing={isGroupCallScreenSharing}
        callDuration={groupCallDuration}
        isHost={isGroupCallHost}
        onToggleMute={toggleGroupCallMute}
        onToggleCamera={toggleGroupCallCamera}
        onToggleScreenShare={toggleGroupCallScreenShare}
        onLeaveCall={leaveGroupCall}
        onEndCallForEveryone={handleEndGroupCallForEveryone}
      />
    </div>
  );
};

export default ChatPage;
