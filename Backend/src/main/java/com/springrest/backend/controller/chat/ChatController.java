// Controller WebSocket xử lý gửi tin nhắn thời gian thực và thả cảm xúc phản ứng cho cả chat 1-1 và nhóm
package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.request.ChatMessageRequest;
import com.springrest.backend.dto.chat.request.MessageReactionRequest;
import com.springrest.backend.dto.chat.response.ChatMessageResponse;
import com.springrest.backend.dto.chat.response.MessageReactionResponse;
import com.springrest.backend.dto.chat.response.ReplyMessageDTO;
import com.springrest.backend.dto.notification.NotificationEvent;
import com.springrest.backend.entity.Conversation;
import com.springrest.backend.entity.Enum.NotificationType;
import com.springrest.backend.entity.Message;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.ConversationRepository;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.UserRepository;
import com.springrest.backend.service.chat.MessageReactionService;
import com.springrest.backend.service.chat.MessageService;
import com.springrest.backend.service.notification.NotificationProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageReactionService messageReactionService;
    private final MessageService messageService;
    private final NotificationProducer notificationProducer;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request, Principal principal) {
        try {
            if (principal == null) {
                System.out.println("JWT Token is not verified");
                return;
            }

            Integer senderId = Integer.parseInt(principal.getName());
            System.out.println("[WS] sendMessage từ userId: " + senderId + ", request: " + request);

            Message newMessage = new Message();

            Conversation conversationRef = conversationRepository.getReferenceById(request.getConversationId());
            newMessage.setConversation(conversationRef);

            User userRef = userRepository.getReferenceById(senderId);
            newMessage.setUser(userRef);

            newMessage.setContent(request.getContent());
            newMessage.setMessageType(request.getMessageType());
            newMessage.setCreatedAt(LocalDateTime.now());

            ReplyMessageDTO replyDto = null;
            if(request.getReplyToMessageId() != null) {
                Optional<Message> parentOpt = messageRepository.findByIdWithUser(request.getReplyToMessageId());

                if(parentOpt.isPresent()) {
                    Message parentMessage = parentOpt.orElse(null);
                    newMessage.setReplyToMessage(parentMessage);
                    String senderName = parentMessage.getUser() != null ? parentMessage.getUser().getDisplayName() : "Unknown";
                    String parentContent = parentMessage.getDeletedAt() != null ? "Tin nhắn đã bị thu hồi" : parentMessage.getContent();
                    replyDto = new ReplyMessageDTO(parentMessage.getId(), parentContent, senderName);
                }
            }

            Message savedMessage = messageRepository.save(newMessage);

            ChatMessageResponse response = new ChatMessageResponse(
                    savedMessage.getId(),
                    savedMessage.getConversation().getId(),
                    savedMessage.getUser().getId(),
                    savedMessage.getContent(),
                    request.getMessageType(),
                    savedMessage.getCreatedAt()
            );
            response.setReplyTo(replyDto);

            List<Integer> memberIds = messageService.findListMembersJoinConversation(request.getConversationId());

            if (memberIds != null && !memberIds.isEmpty()) {
                for (Integer memberId : memberIds) {
                    messagingTemplate.convertAndSendToUser(
                            String.valueOf(memberId),
                            "/queue/messages",
                            response
                    );

                    if (!senderId.equals(memberId)) {
                        NotificationEvent notificationEvent = new NotificationEvent(
                                senderId,
                                memberId,
                                NotificationType.MESSAGE,
                                savedMessage.getContent(),
                                savedMessage.getConversation().getId()
                        );
                        notificationProducer.sendNotificationEvent(notificationEvent);
                    }
                }
            } else {
                if (request.getReceiverId() != null) {
                    messagingTemplate.convertAndSendToUser(
                            String.valueOf(request.getReceiverId()),
                            "/queue/messages",
                            response
                    );
                    if (!senderId.equals(request.getReceiverId())) {
                        NotificationEvent notificationEvent = new NotificationEvent(
                                senderId,
                                request.getReceiverId(),
                                NotificationType.MESSAGE,
                                savedMessage.getContent(),
                                savedMessage.getConversation().getId()
                        );
                        notificationProducer.sendNotificationEvent(notificationEvent);
                    }
                }
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(senderId),
                        "/queue/messages",
                        response
                );
            }

        } catch (Exception e) {
            System.out.println("[WS] Lỗi sendMessage: " + e.getMessage());
            e.printStackTrace();

            if (principal != null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Cannot send message: " + e.getMessage());

                messagingTemplate.convertAndSendToUser(
                        principal.getName(),
                        "/queue/errors",
                        errorResponse
                );
            }
        }
    }

    @MessageMapping("/chat.react")
    public void reactToMessage(@Payload MessageReactionRequest request, Principal principal) {
        try{
            if (principal == null) {
                System.out.println("[WS] JWT Token is not verified");
                return;
            }

            Integer senderId = Integer.parseInt(principal.getName());

            MessageReactionResponse reactionResponse = messageReactionService.reactToMessage(senderId, request);

            Map<String,Object> reactionEvent = new LinkedHashMap<>();
            reactionEvent.put("type","REACTION");
            reactionEvent.put("conversationId",request.getConversationId());
            reactionEvent.put("messageId", request.getMessageId());
            reactionEvent.put("reaction", reactionResponse);

            List<Integer> memberIds = messageService.findListMembersJoinConversation(request.getConversationId());
            if (memberIds != null && !memberIds.isEmpty()) {
                for (Integer memberId : memberIds) {
                    messagingTemplate.convertAndSendToUser(
                            String.valueOf(memberId),
                            "/queue/messages",
                            reactionEvent
                    );
                }
            } else {
                if (request.getReceiverId() != null) {
                    messagingTemplate.convertAndSendToUser(
                            String.valueOf(request.getReceiverId()),
                            "/queue/messages",
                            reactionEvent
                    );
                }
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(senderId),
                        "/queue/messages",
                        reactionEvent
                );
            }
        }catch (Exception e){
            System.out.println("[WS] Lỗi reactToMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
