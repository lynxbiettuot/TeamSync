package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.response.ConversationResponseDTO;
import com.springrest.backend.repository.ConversationRepository;
import com.springrest.backend.service.chat.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversationService;

    @PostMapping("/direct/{targetUserId}")
    public ResponseEntity<?> getOrCreateDirectConversation(@PathVariable Integer targetUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        Integer currentUserId = Integer.parseInt(auth.getName());

        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot chat with yourself");
        }

        Integer conversationId = conversationService.getOrCreateDirectConversation(currentUserId,targetUserId);

        return ResponseEntity.ok(Map.of("conversationId", conversationId));
    }

    @GetMapping
    public ResponseEntity<?> getAllConversations() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        Integer currentUserId = Integer.parseInt(auth.getName());

        try {
            List<ConversationResponseDTO> list = conversationService.getUserConversations(currentUserId);
            return ResponseEntity.ok(list);
        }catch (Exception e){
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
