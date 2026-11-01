package com.springrest.backend.controller.chat;

import com.springrest.backend.repository.ConversationRepository;
import com.springrest.backend.service.chat.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversationService;

    @PostMapping("/direct/{targetUserId}")
    public ResponseEntity<?> getOrCreateDirectConversation(@PathVariable Integer targetUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Integer currentUserId = Integer.parseInt(auth.getName());

        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot chat with yourself");
        }

        Integer conversationId = conversationService.getOrCreateDirectConversation(currentUserId,targetUserId);

        return ResponseEntity.ok(Map.of("conversationId", conversationId));
    }
}
