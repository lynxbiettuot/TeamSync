package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.request.ChatMessageRequest;
import com.springrest.backend.dto.chat.response.ChatMessageResponse;
import com.springrest.backend.entity.Conversation;
import com.springrest.backend.entity.Message;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.ConversationRepository;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

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

            User userRef = userRepository.getReferenceById(senderId);
            newMessage.setUser(userRef);

            newMessage.setContent(request.getContent());
            newMessage.setMessageType(request.getMessageType());
            newMessage.setCreatedAt(LocalDateTime.now());

            Message savedMessage = messageRepository.save(newMessage);

            ChatMessageResponse response = new ChatMessageResponse(
                    savedMessage.getId(),
                    savedMessage.getConversation().getId(),
                    savedMessage.getUser().getId(),
                    savedMessage.getContent(),
                    request.getMessageType(),
                    savedMessage.getCreatedAt()
            );

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(request.getReceiverId()),
                    "/queue/messages",
                    response
            );

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(senderId),
                    "/queue/messages",
                    response
            );

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
}
