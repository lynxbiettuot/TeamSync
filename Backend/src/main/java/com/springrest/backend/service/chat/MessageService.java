// Dịch vụ nghiệp vụ tin nhắn: truy xuất lịch sử hội thoại, sửa tin nhắn và thu hồi tin nhắn cho 1-1 và nhóm
package com.springrest.backend.service.chat;

import com.springrest.backend.dto.chat.request.EditMessageRequest;
import com.springrest.backend.dto.chat.response.ChatMessageResponse;
import com.springrest.backend.dto.chat.response.MessageReactionResponse;
import com.springrest.backend.dto.chat.response.ReplyMessageDTO;
import com.springrest.backend.entity.Message;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.ParticipantRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public List<ChatMessageResponse> getMessagesByConversationId(Integer conversationId) {
        List<Message> listMessage = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        if (listMessage.isEmpty()) {
            return new ArrayList<ChatMessageResponse>();
        }

        List<ChatMessageResponse> listData= listMessage.stream().map(m -> {
            ChatMessageResponse res = new ChatMessageResponse(
                m.getId(),
                m.getConversation().getId(),
                m.getUser().getId(),
                m.getDeletedAt() != null ? "Tin nhắn đã bị thu hồi" : m.getContent(),
                m.getMessageType(),
                m.getCreatedAt()
            );
            res.setUpdatedAt(m.getUpdatedAt());
            res.setIsDeleted(m.getDeletedAt() != null);

            if(m.getReplyToMessage() != null) {
                Message parent = m.getReplyToMessage();
                String senderName = parent.getUser() != null ? parent.getUser().getDisplayName() : "Unknown";
                String parentContent = parent.getDeletedAt() != null ? "Tin nhắn đã bị thu hồi" : parent.getContent();
                res.setReplyTo(new ReplyMessageDTO(parent.getId(), parentContent, senderName));
            }

            if(m.getMessageReactions() != null && !m.getMessageReactions().isEmpty()) {
                List<MessageReactionResponse> listReactions = m.getMessageReactions().stream()
                        .map(r -> new MessageReactionResponse(
                                r.getUser().getId(),
                                r.getUser().getDisplayName(),
                                r.getUser().getAvatarUrl(),
                                r.getReactType()
                        )).toList();
                res.setReactions(listReactions);
            }

            return res;
        }).toList();
        return listData;
    }

    public List<Integer> findListMembersJoinConversation(Integer conversationId) {
        List<Integer> listMessage = participantRepository.findMembersJoinConversation(conversationId);
        return listMessage;
    }

    @Transactional
    public ChatMessageResponse editMessage(Integer currentUserId, Integer messageId, EditMessageRequest request) {
        Message message = messageRepository.findByIdWithUserAndConversation(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Tin nhắn không tồn tại"));

        if (!message.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Bạn không có quyền sửa tin nhắn này");
        }

        if (message.getDeletedAt() != null) {
            throw new IllegalStateException("Không thể chỉnh sửa tin nhắn đã bị thu hồi");
        }

        message.setContent(request.getNewContent());
        message.setUpdatedAt(LocalDateTime.now());
        Message updatedMessage = messageRepository.save(message);

        ChatMessageResponse response = new ChatMessageResponse(
                updatedMessage.getId(),
                updatedMessage.getConversation().getId(),
                updatedMessage.getUser().getId(),
                updatedMessage.getContent(),
                updatedMessage.getMessageType(),
                updatedMessage.getCreatedAt()
        );
        response.setUpdatedAt(updatedMessage.getUpdatedAt());
        response.setIsDeleted(false);

        Map<String, Object> wsEvent = new LinkedHashMap<>();
        wsEvent.put("type", "MESSAGE_EDIT");
        wsEvent.put("conversationId", message.getConversation().getId());
        wsEvent.put("message", response);

        List<Integer> memberIds = findListMembersJoinConversation(message.getConversation().getId());
        if (memberIds != null && !memberIds.isEmpty()) {
            for (Integer memberId : memberIds) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(memberId),
                        "/queue/messages",
                        wsEvent
                );
            }
        } else {
            if (request.getReceiverId() != null) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(request.getReceiverId()),
                        "/queue/messages",
                        wsEvent
                );
            }
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(currentUserId),
                    "/queue/messages",
                    wsEvent
            );
        }

        return response;
    }

    @Transactional
    public void deleteMessage(Integer currentUserId, Integer messageId, Integer receiverId) {
        Message message = messageRepository.findByIdWithUserAndConversation(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Tin nhắn không tồn tại"));

        if (!message.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Bạn không có quyền thu hồi tin nhắn này");
        }

        message.setDeletedAt(LocalDateTime.now());
        message.setContent("Tin nhắn đã bị thu hồi");
        messageRepository.save(message);

        Map<String, Object> wsEvent = new LinkedHashMap<>();
        wsEvent.put("type", "MESSAGE_DELETE");
        wsEvent.put("conversationId", message.getConversation().getId());
        wsEvent.put("messageId", messageId);

        List<Integer> memberIds = findListMembersJoinConversation(message.getConversation().getId());
        if (memberIds != null && !memberIds.isEmpty()) {
            for (Integer memberId : memberIds) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(memberId),
                        "/queue/messages",
                        wsEvent
                );
            }
        } else {
            if (receiverId != null) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(receiverId),
                        "/queue/messages",
                        wsEvent
                );
            }
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(currentUserId),
                    "/queue/messages",
                    wsEvent
            );
        }
    }
}
