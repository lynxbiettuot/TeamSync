// Dịch vụ nghiệp vụ tin nhắn: truy xuất lịch sử, gửi tệp đính kèm/hình ảnh, sửa và thu hồi tin nhắn cho 1-1 và nhóm
package com.springrest.backend.service.chat;

import com.springrest.backend.dto.chat.request.EditMessageRequest;
import com.springrest.backend.dto.chat.response.AttachmentResponseDTO;
import com.springrest.backend.dto.chat.response.ChatMessageResponse;
import com.springrest.backend.dto.chat.response.MessageReactionResponse;
import com.springrest.backend.dto.chat.response.ReplyMessageDTO;
import com.springrest.backend.dto.notification.NotificationEvent;
import com.springrest.backend.entity.Attachment;
import com.springrest.backend.entity.Conversation;
import com.springrest.backend.entity.Enum.NotificationType;
import com.springrest.backend.entity.Enum.MessageType;
import com.springrest.backend.entity.Message;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.ConversationRepository;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.ParticipantRepository;
import com.springrest.backend.repository.UserRepository;
import com.springrest.backend.service.notification.NotificationProducer;
import com.springrest.backend.service.upload.CloudinaryService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CloudinaryService cloudinaryService;
    private final NotificationProducer notificationProducer;

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

            if(m.getAttachmentList() != null && !m.getAttachmentList().isEmpty()) {
                List<AttachmentResponseDTO> listAttachments = m.getAttachmentList().stream()
                        .map(a -> new AttachmentResponseDTO(
                                a.getId(),
                                a.getName(),
                                a.getFileUrl(),
                                a.getFileType(),
                                a.getFileSize()
                        )).toList();
                res.setAttachments(listAttachments);
            }

            return res;
        }).toList();
        return listData;
    }

    @Transactional
    public ChatMessageResponse sendAttachmentMessage(
            Integer currentUserId,
            Integer conversationId,
            String content,
            MultipartFile file,
            Integer replyToMessageId
    ) throws Exception {
        if (conversationId == null) {
            throw new IllegalArgumentException("conversationId is required");
        }

        List<Integer> memberIds = findListMembersJoinConversation(conversationId);
        if (memberIds == null || memberIds.isEmpty() || !memberIds.contains(currentUserId)) {
            throw new AccessDeniedException("Bạn không phải thành viên của cuộc trò chuyện này");
        }

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Cuộc trò chuyện không tồn tại"));

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "file_" + System.currentTimeMillis();
        }

        String contentType = file.getContentType();
        boolean isImage = contentType != null && contentType.toLowerCase().startsWith("image/");
        MessageType messageType = isImage ? MessageType.IMAGE : MessageType.FILE;

        String uploadedUrl = cloudinaryService.uploadAttachment(file, "teamsync/attachments/" + conversationId);

        Message message = new Message();
        message.setConversation(conversation);
        message.setUser(sender);
        message.setContent(content != null ? content : "");
        message.setMessageType(messageType);
        message.setCreatedAt(LocalDateTime.now());

        ReplyMessageDTO replyDto = null;
        if (replyToMessageId != null) {
            Optional<Message> parentOpt = messageRepository.findByIdWithUser(replyToMessageId);
            if (parentOpt.isPresent()) {
                Message parentMessage = parentOpt.get();
                message.setReplyToMessage(parentMessage);
                String senderName = parentMessage.getUser() != null ? parentMessage.getUser().getDisplayName() : "Unknown";
                String parentContent = parentMessage.getDeletedAt() != null ? "Tin nhắn đã bị thu hồi" : parentMessage.getContent();
                replyDto = new ReplyMessageDTO(parentMessage.getId(), parentContent, senderName);
            }
        }

        Attachment attachment = new Attachment();
        attachment.setName(originalFilename);
        attachment.setFileUrl(uploadedUrl);
        attachment.setFileType(contentType);
        attachment.setFileSize(file.getSize());
        attachment.setMessage(message);

        message.getAttachmentList().add(attachment);
        Message savedMessage = messageRepository.save(message);

        ChatMessageResponse response = new ChatMessageResponse(
                savedMessage.getId(),
                savedMessage.getConversation().getId(),
                savedMessage.getUser().getId(),
                savedMessage.getContent(),
                savedMessage.getMessageType(),
                savedMessage.getCreatedAt()
        );
        response.setReplyTo(replyDto);

        List<AttachmentResponseDTO> attachmentDTOs = savedMessage.getAttachmentList().stream()
                .map(a -> new AttachmentResponseDTO(
                        a.getId(),
                        a.getName(),
                        a.getFileUrl(),
                        a.getFileType(),
                        a.getFileSize()
                )).toList();
        response.setAttachments(attachmentDTOs);

        for (Integer memberId : memberIds) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(memberId),
                    "/queue/messages",
                    response
            );

            if (!currentUserId.equals(memberId)) {
                String notificationContent = isImage ? "[Hình ảnh]" : "[Tệp tin] " + originalFilename;
                NotificationEvent notificationEvent = new NotificationEvent(
                        currentUserId,
                        memberId,
                        NotificationType.MESSAGE,
                        notificationContent,
                        conversationId
                );
                notificationProducer.sendNotificationEvent(notificationEvent);
            }
        }

        return response;
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
