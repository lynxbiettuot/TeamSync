// src/main/java/com/springrest/backend/controller/chat/ChatController.java
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
import com.springrest.backend.repository.ParticipantRepository;
import com.springrest.backend.repository.UserRepository;
import com.springrest.backend.service.chat.MessageReactionService;
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
    private final ParticipantRepository participantRepository;
    private final MessageReactionService messageReactionService;
    private final NotificationProducer notificationProducer;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request, Principal principal) {
        //ChatMessageReques đối tượng gửi từ client, từ stompClient -. jackson -> đổi sang ChatMessageReques
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

            User userRef = userRepository.findById(senderId).orElse(null);
            newMessage.setUser(userRef);

            newMessage.setContent(request.getContent());
            newMessage.setMessageType(request.getMessageType());
            newMessage.setCreatedAt(LocalDateTime.now());

            ReplyMessageDTO replyDto = null;
            if (request.getReplyToMessageId() != null) {
                Optional<Message> parentOpt = messageRepository.findByIdWithUser(request.getReplyToMessageId());

                if (parentOpt.isPresent()) {
                    Message parentMessage = parentOpt.orElse(null);
                    newMessage.setReplyToMessage(parentMessage);
                    String senderName = parentMessage.getUser() != null ? parentMessage.getUser().getDisplayName() : "Unknown";
                    replyDto = new ReplyMessageDTO(parentMessage.getId(), parentMessage.getContent(), senderName);
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
            response.setSenderName(userRef != null ? userRef.getDisplayName() : null);
            response.setReplyTo(replyDto);

            List<Integer> members = participantRepository.findMembersJoinConversation(request.getConversationId());
            for (Integer memberId : members) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(memberId),
                        "/queue/messages",
                        response
                );

                if (!memberId.equals(senderId)) {
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

            //create ressponse to FE
            Map<String,Object> reactionEvent = new LinkedHashMap<>();
            reactionEvent.put("type","REACTION");
            reactionEvent.put("conversationId",request.getConversationId());
            reactionEvent.put("messageId", request.getMessageId());
            reactionEvent.put("reaction", reactionResponse);

            List<Integer> members = participantRepository.findMembersJoinConversation(request.getConversationId());
            for (Integer memberId : members) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(memberId),
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
