// Hook điều phối toàn bộ logic ChatPage: E2EE 1-1, E2EE nhóm K_nhom, sao lưu PIN, STOMP WebSocket, WebRTC và LiveKit SFU
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { e2eeService } from '../../services/e2eeService';
import { useConversations } from '../../hooks/useConversations';
import { useChatPresence } from '../../hooks/useChatPresence';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useGroupCall } from '../../hooks/useGroupCall';
import type { Message, SendMessagePayload, ReactType } from '../../types/chat.types';
import type { CallSignalPayload, GroupCallStartEvent } from '../../types/call.types';

export function useChatPageLogic() {
  const { user, logout } = useAuth();
  const currentUserId = user?.id ? Number(user.id) : undefined;

  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [activeGroupCallBanner, setActiveGroupCallBanner] = useState<GroupCallStartEvent | null>(null);

  // 1. Quản lý danh sách hội thoại & chọn cuộc trò chuyện
  const {
    conversations,
    isLoadingConversations,
    activeConversationId,
    activeChatUser,
    selectConversation,
    updateLastMessage,
    addConversation,
    updateConversation,
    removeConversation,
  } = useConversations(currentUserId);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const isGroup =
    activeConv?.conversationType === 'GROUP' ||
    activeConv?.type === 'GROUP' ||
    activeConv?.conversation_type === 'GROUP';
  const groupMembers = activeConv?.members;

  // 2. Quản lý trạng thái Online / Offline từ Redis qua WebSocket
  const { onlineUserIds, handlePresenceReceived } = useChatPresence();

  // 3. Quản lý thông báo realtime từ RabbitMQ & chuông thông báo
  const {
    notifications,
    toastNotification,
    unreadCount,
    handleNotificationReceived,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleDismissToast,
  } = useChatNotifications({
    activeConversationId,
    onNavigateToConversation: selectConversation,
  });

  // 4. Quản lý tin nhắn, cuộn trang & giải mã E2EE tự động
  const {
    messages,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    chatContainerRef,
    loadOlderMessages,
    appendMessage,
    updateReaction,
    handleMessageEdited,
    handleMessageDeleted,
  } = useChatMessages({
    conversationId: activeConversationId,
    currentUserId,
    activeChatUser,
    isGroup,
    groupMembers,
  });

  // 5. Khởi tạo cặp khóa E2EE trong IndexedDB & luôn đồng bộ lên Server
  useEffect(() => {
    if (currentUserId) {
      e2eeService.initE2EE(currentUserId).catch((err) => {
        console.error('[E2EE] Lỗi khởi tạo E2EE:', err);
      });
    }
  }, [currentUserId]);

  // 6. Xử lý khi nhận tin nhắn mới từ WebSocket (/user/queue/messages)
  const handleIncomingMessage = useCallback(
    async (newMsg: Message) => {
      const msgConvId = newMsg.conversationId ?? newMsg.conversation_id;
      let decryptedContent = newMsg.content;

      const currentConv = conversations.find((c) => c.id === msgConvId);
      const isGroupConv =
        currentConv?.conversationType === 'GROUP' ||
        currentConv?.type === 'GROUP' ||
        currentConv?.conversation_type === 'GROUP';

      if (isGroupConv && msgConvId && currentUserId) {
        try {
          const groupKey = await e2eeService.getOrFetchGroupKey(
            msgConvId,
            currentUserId,
            currentConv?.members
          );
          if (groupKey) {
            decryptedContent = await e2eeService.decryptMessage(newMsg.content, groupKey);
          }
        } catch (err) {
          console.warn('[E2EE] Lỗi giải mã tin nhắn nhóm nhận:', err);
        }
      } else {
        const partnerUser =
          currentConv?.otherUser || (activeConversationId === msgConvId ? activeChatUser : null);

        if (currentUserId && partnerUser?.id) {
          let pubKey = partnerUser.publicKey;
          if (!pubKey) {
            pubKey = await e2eeService.fetchLatestPublicKey(partnerUser.id);
          }

          if (pubKey) {
            try {
              const sharedKey = await e2eeService.getSharedKey(
                currentUserId,
                partnerUser.id,
                pubKey
              );
              if (sharedKey) {
                decryptedContent = await e2eeService.decryptMessage(newMsg.content, sharedKey);
              }
            } catch (err) {
              console.warn('[E2EE] Lỗi giải mã tin nhắn nhận:', err);
            }
          }
        }
      }

      let replyData = newMsg.replyTo || newMsg.reply_to;
      let decryptedReplyContent = replyData?.content;

      if (replyData && replyData.content && replyData.content !== 'Tin nhắn đã bị thu hồi') {
        if (isGroupConv && msgConvId && currentUserId) {
          try {
            const groupKey = await e2eeService.getOrFetchGroupKey(
              msgConvId,
              currentUserId,
              currentConv?.members
            );
            if (groupKey) {
              decryptedReplyContent = await e2eeService.decryptMessage(replyData.content, groupKey);
            }
          } catch (err) {
            console.warn('[E2EE] Lỗi giải mã reply tin nhắn nhóm nhận:', err);
          }
        } else {
          const partnerUser =
            currentConv?.otherUser || (activeConversationId === msgConvId ? activeChatUser : null);

          if (currentUserId && partnerUser?.id) {
            let pubKey = partnerUser.publicKey;
            if (!pubKey) {
              pubKey = await e2eeService.fetchLatestPublicKey(partnerUser.id);
            }
            if (pubKey) {
              try {
                const sharedKey = await e2eeService.getSharedKey(
                  currentUserId,
                  partnerUser.id,
                  pubKey
                );
                if (sharedKey) {
                  decryptedReplyContent = await e2eeService.decryptMessage(replyData.content, sharedKey);
                }
              } catch (err) {
                console.warn('[E2EE] Lỗi giải mã reply tin nhắn nhận:', err);
              }
            }
          }
        }
      }

      const updatedReply = replyData
        ? {
            ...replyData,
            content: decryptedReplyContent || replyData.content,
          }
        : null;

      const displayMsg: Message = {
        ...newMsg,
        content: decryptedContent,
        replyTo: updatedReply,
        reply_to: updatedReply,
      };

      if (activeConversationId && msgConvId === activeConversationId) {
        appendMessage(displayMsg);
      }

      if (msgConvId) {
        updateLastMessage(
          msgConvId,
          decryptedContent,
          newMsg.createdAt || newMsg.created_at
        );
      }
    },
    [activeConversationId, activeChatUser, appendMessage, conversations, currentUserId, updateLastMessage]
  );

  // 7. Quản lý trạng thái và kết nối cuộc gọi nhóm LiveKit SFU
  const {
    isCallActive: isGroupCallActive,
    isConnecting: isGroupCallConnecting,
    activeConversationId: groupCallConversationId,
    participants: groupCallParticipants,
    isMuted: isGroupCallMuted,
    isCameraOff: isGroupCallCameraOff,
    isScreenSharing: isGroupCallScreenSharing,
    activeSpeakerIds: groupCallActiveSpeakerIds,
    callDuration: groupCallDuration,
    isHost: isGroupCallHost,
    joinGroupCall,
    leaveGroupCall,
    endGroupCall,
    toggleMute: toggleGroupCallMute,
    toggleCamera: toggleGroupCallCamera,
    toggleScreenShare: toggleGroupCallScreenShare,
  } = useGroupCall();

  // 8. Khởi tạo WebSocket STOMP & WebRTC
  const handleCallSignalRef = useRef<(signal: CallSignalPayload) => void>(() => {});

  const { isConnected, sendMessage, sendReaction, sendCallSignal } = useChatWebSocket({
    onMessageReceived: handleIncomingMessage,
    onReactionReceived: (event) => {
      updateReaction(event.messageId, event.reaction);
    },
    onMessageEdited: (event) => {
      if (activeConversationId === event.conversationId) {
        handleMessageEdited(event.message);
      }
    },
    onMessageDeleted: (event) => {
      if (activeConversationId === event.conversationId) {
        handleMessageDeleted(event.messageId);
      }
    },
    onConversationDeleted: (event) => {
      removeConversation(event.conversationId);
    },
    onConversationCreated: (event) => {
      addConversation(event.conversation);
    },
    onConversationUpdated: (event) => {
      updateConversation(event.conversation);
    },
    onGroupCallStart: (event) => {
      setActiveGroupCallBanner(event);
    },
    onGroupCallEnd: (event) => {
      setActiveGroupCallBanner((prev) => (prev?.conversationId === event.conversationId ? null : prev));
      if (groupCallConversationId === event.conversationId) {
        leaveGroupCall();
      }
    },
    onPresenceReceived: handlePresenceReceived,
    onNotificationReceived: handleNotificationReceived,
    onCallSignalReceived: (signal) => {
      handleCallSignalRef.current(signal);
    },
    onGroupKeyDistributed: async (event) => {
      if (currentUserId) {
        await e2eeService.handleReceivedGroupKey(event, currentUserId);
      }
    },
  });

  // 8. Quản lý trạng thái và kết nối cuộc gọi WebRTC 1-1
  const {
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
  } = useWebRTC({
    currentUserId,
    sendCallSignal,
  });

  useEffect(() => {
    handleCallSignalRef.current = handleIncomingSignal;
  }, [handleIncomingSignal]);

  // 9. Gửi tin nhắn qua STOMP (/app/chat.send) với E2EE
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !currentUserId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    const isGroupConv =
      currentConv?.conversationType === 'GROUP' ||
      currentConv?.type === 'GROUP' ||
      currentConv?.conversation_type === 'GROUP';

    let messageContentToSend = content;

    if (isGroupConv) {
      try {
        const groupKey = await e2eeService.getOrFetchGroupKey(
          activeConversationId,
          currentUserId,
          currentConv?.members
        );
        if (groupKey) {
          messageContentToSend = await e2eeService.encryptMessage(content, groupKey);
        }
      } catch (err) {
        console.error('[E2EE] Lỗi mã hóa tin nhắn nhóm, gửi dạng thường:', err);
      }

      const payload: SendMessagePayload = {
        conversation_id: activeConversationId,
        receiver_id: null,
        content: messageContentToSend,
        message_type: 'TEXT',
        reply_to_message_id: replyingMessage ? replyingMessage.id : null,
        replyToMessageId: replyingMessage ? replyingMessage.id : null,
      };

      const sent = sendMessage(payload);
      if (sent) {
        setReplyingMessage(null);
        updateLastMessage(activeConversationId, content);
      }
      return;
    }

    const receiverId = activeChatUser?.id || currentConv?.otherUser?.id;
    let receiverPublicKey = activeChatUser?.publicKey || currentConv?.otherUser?.publicKey;

    if (!receiverId) {
      console.warn('Không xác định được receiver_id');
      return;
    }

    if (!receiverPublicKey) {
      receiverPublicKey = await e2eeService.fetchLatestPublicKey(receiverId);
    }

    if (receiverPublicKey) {
      try {
        const sharedKey = await e2eeService.getSharedKey(
          currentUserId,
          receiverId,
          receiverPublicKey
        );
        if (sharedKey) {
          messageContentToSend = await e2eeService.encryptMessage(content, sharedKey);
        }
      } catch (err) {
        console.error('[E2EE] Lỗi mã hóa tin nhắn, gửi dạng thường:', err);
      }
    }

    const payload: SendMessagePayload = {
      conversation_id: activeConversationId,
      receiver_id: receiverId,
      content: messageContentToSend,
      message_type: 'TEXT',
      reply_to_message_id: replyingMessage ? replyingMessage.id : null,
      replyToMessageId: replyingMessage ? replyingMessage.id : null,
    };

    const sent = sendMessage(payload);

    if (sent) {
      setReplyingMessage(null);
      updateLastMessage(activeConversationId, content);
    }
  };

  // 9b. Gửi tệp tin hoặc hình ảnh đính kèm qua REST API (POST /api/messages/upload)
  const handleSendAttachment = async (file: File, content: string) => {
    if (!activeConversationId) return;

    try {
      const res = await chatService.uploadAttachment(
        activeConversationId,
        file,
        content,
        replyingMessage ? replyingMessage.id : undefined
      );

      setReplyingMessage(null);
      if (res && res.id) {
        appendMessage(res);
      }
      const isImg = file.type.startsWith('image/');
      const preview = isImg ? '[Hình ảnh]' : `[Tệp tin] ${file.name}`;
      updateLastMessage(activeConversationId, content ? `${preview} ${content}` : preview);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Tải tệp đính kèm thất bại');
    }
  };

  // 10. Gửi reaction qua STOMP (/app/chat.react)
  const handleReactMessage = (messageId: number, reactType: ReactType) => {
    if (!activeConversationId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    const isGroupConv =
      currentConv?.conversationType === 'GROUP' ||
      currentConv?.type === 'GROUP' ||
      currentConv?.conversation_type === 'GROUP';
    const receiverId = isGroupConv ? null : (activeChatUser?.id || currentConv?.otherUser?.id || null);

    sendReaction({
      conversationId: activeConversationId,
      messageId,
      receiverId,
      reactType,
    });
  };

  // 11. Chỉnh sửa tin nhắn
  const handleEditMessage = async (messageId: number, newContent: string) => {
    if (!activeConversationId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    const isGroupConv =
      currentConv?.conversationType === 'GROUP' ||
      currentConv?.type === 'GROUP' ||
      currentConv?.conversation_type === 'GROUP';
    const receiverId = isGroupConv ? undefined : (activeChatUser?.id || currentConv?.otherUser?.id);

    let contentToSend = newContent;
    if (isGroupConv && currentUserId) {
      try {
        const groupKey = await e2eeService.getOrFetchGroupKey(
          activeConversationId,
          currentUserId,
          currentConv?.members
        );
        if (groupKey) {
          contentToSend = await e2eeService.encryptMessage(newContent, groupKey);
        }
      } catch (err) {
        console.error('[E2EE] Lỗi mã hóa tin nhắn nhóm sửa:', err);
      }
    } else if (currentUserId && receiverId) {
      try {
        let receiverPublicKey = activeChatUser?.publicKey || currentConv?.otherUser?.publicKey;
        if (!receiverPublicKey) {
          receiverPublicKey = await e2eeService.fetchLatestPublicKey(receiverId);
        }
        if (receiverPublicKey) {
          const sharedKey = await e2eeService.getSharedKey(currentUserId, receiverId, receiverPublicKey);
          if (sharedKey) {
            contentToSend = await e2eeService.encryptMessage(newContent, sharedKey);
          }
        }
      } catch (err) {
        console.error('[E2EE] Lỗi mã hóa tin nhắn sửa:', err);
      }
    }

    try {
      await chatService.editMessage(messageId, contentToSend, receiverId);
      handleMessageEdited({
        id: messageId,
        content: newContent,
        updatedAt: new Date().toISOString(),
      } as Message);
    } catch (err) {
      console.error('Lỗi khi chỉnh sửa tin nhắn:', err);
      alert('Không thể chỉnh sửa tin nhắn. Vui lòng thử lại.');
    }
  };

  // 12. Thu hồi tin nhắn
  const handleDeleteMessage = async (messageId: number) => {
    if (!activeConversationId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    const isGroupConv =
      currentConv?.conversationType === 'GROUP' ||
      currentConv?.type === 'GROUP' ||
      currentConv?.conversation_type === 'GROUP';
    const receiverId = isGroupConv ? undefined : (activeChatUser?.id || currentConv?.otherUser?.id);

    try {
      await chatService.deleteMessage(messageId, receiverId);
      handleMessageDeleted(messageId);
    } catch (err) {
      console.error('Lỗi khi thu hồi tin nhắn:', err);
      alert('Không thể thu hồi tin nhắn. Vui lòng thử lại.');
    }
  };

  // 13. Xóa cuộc trò chuyện
  const handleDeleteConversation = async () => {
    if (!activeConversationId) return;

    try {
      await chatService.deleteConversation(activeConversationId);
      removeConversation(activeConversationId);
    } catch (err) {
      console.error('Lỗi khi xóa cuộc trò chuyện:', err);
      alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  // 14. Quản lý Nhóm trò chuyện (Group Chat CRUD)
  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    try {
      const newGroup = await chatService.createGroup({ name, memberIds });
      addConversation(newGroup);
      selectConversation(newGroup.id);
      if (currentUserId && newGroup.members) {
        await e2eeService.getOrFetchGroupKey(newGroup.id, currentUserId, newGroup.members);
      }
    } catch (err) {
      console.error('Lỗi khi tạo nhóm:', err);
      throw err;
    }
  };

  const handleUpdateGroupName = async (conversationId: number, newName: string) => {
    try {
      const updated = await chatService.updateGroupInfo(conversationId, { name: newName });
      updateConversation(updated);
    } catch (err) {
      console.error('Lỗi khi đổi tên nhóm:', err);
      throw err;
    }
  };

  const handleAddGroupMembers = async (conversationId: number, memberIds: number[]) => {
    try {
      const updated = await chatService.addGroupMembers(conversationId, memberIds);
      updateConversation(updated);
      if (currentUserId && updated.members) {
        const newMembers = updated.members.filter((m) => memberIds.includes(m.userId));
        await e2eeService.distributeKeyToNewMembers(conversationId, currentUserId, newMembers);
      }
    } catch (err) {
      console.error('Lỗi khi thêm thành viên:', err);
      throw err;
    }
  };

  const handleRemoveGroupMember = async (conversationId: number, targetUserId: number) => {
    try {
      await chatService.removeGroupMember(conversationId, targetUserId);
      const updated = await chatService.getConversationDetails(conversationId);
      updateConversation(updated);
    } catch (err) {
      console.error('Lỗi khi xóa thành viên:', err);
      throw err;
    }
  };

  const handleLeaveGroup = async (conversationId: number) => {
    try {
      await chatService.leaveGroup(conversationId);
      removeConversation(conversationId);
    } catch (err) {
      console.error('Lỗi khi rời nhóm:', err);
      throw err;
    }
  };

  const handleBackupPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!currentUserId) return false;
    return await e2eeService.backupPrivateKeyWithPin(currentUserId, pin);
  }, [currentUserId]);

  const handleRestorePin = useCallback(async (pin: string): Promise<boolean> => {
    if (!currentUserId) return false;
    return await e2eeService.restorePrivateKeyWithPin(currentUserId, pin);
  }, [currentUserId]);

  const handleStartGroupCall = useCallback(() => {
    if (activeConversationId) {
      joinGroupCall(activeConversationId);
    }
  }, [activeConversationId, joinGroupCall]);

  const handleJoinGroupCall = useCallback(() => {
    if (activeGroupCallBanner) {
      joinGroupCall(activeGroupCallBanner.conversationId);
    }
  }, [activeGroupCallBanner, joinGroupCall]);

  const handleDismissGroupCallBanner = useCallback(() => {
    setActiveGroupCallBanner(null);
  }, []);

  const handleEndGroupCallForEveryone = useCallback(() => {
    const targetConvId = groupCallConversationId || activeConversationId;
    if (targetConvId) {
      endGroupCall(targetConvId);
    }
  }, [groupCallConversationId, activeConversationId, endGroupCall]);

  const otherChatUserId = activeChatUser?.id || activeConv?.otherUser?.id;
  const isChatUserOnline = otherChatUserId !== undefined && onlineUserIds.has(otherChatUserId);

  return {
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
    handleSendAttachment,
    handleReactMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleDeleteConversation,
    handleCreateGroup,
    handleUpdateGroupName,
    handleAddGroupMembers,
    handleRemoveGroupMember,
    handleLeaveGroup,
    handleBackupPin,
    handleRestorePin,
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
    endGroupCall,
    toggleGroupCallMute,
    toggleGroupCallCamera,
    toggleGroupCallScreenShare,
  };
}
