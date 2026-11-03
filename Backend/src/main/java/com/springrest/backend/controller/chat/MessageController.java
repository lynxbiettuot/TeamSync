package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.response.ChatMessageResponse;
import com.springrest.backend.entity.Message;
import com.springrest.backend.service.chat.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageController {
    private final MessageService messageService;

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> getMessagesByConversationId(@PathVariable Integer conversationId) {
        if(conversationId == null) {// request with conversation id empty
            throw new IllegalArgumentException("conversationId is required");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assert auth != null;
        Integer currentUserId = Integer.parseInt(auth.getName());

        if(currentUserId == null) {
            throw new IllegalArgumentException("You are not allowed in this conversation, userId not found");
        }

        List<Integer> listUser = messageService.findListMembersJoinConversation(conversationId);

        if(listUser == null || listUser.isEmpty()) {
            throw new IllegalArgumentException("Conversation not found");
        }

        if(listUser.size() != 2 || !listUser.contains(currentUserId)) {
            throw new IllegalArgumentException("You are not allowed in this conversation");
        }

        try {
            List<ChatMessageResponse> responseData = messageService.getMessagesByConversationId(conversationId);
            return ResponseEntity.ok(responseData);
        }catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
