// src/main/java/com/springrest/backend/controller/chat/ConversationController.java
package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.request.AddGroupMembersRequest;
import com.springrest.backend.dto.chat.request.CreateGroupRequest;
import com.springrest.backend.dto.chat.request.UpdateGroupRequest;
import com.springrest.backend.dto.chat.response.ConversationResponseDTO;
import com.springrest.backend.service.chat.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
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
        Integer currentUserId = getCurrentUserId();

        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot chat with yourself");
        }

        Integer conversationId = conversationService.getOrCreateDirectConversation(currentUserId, targetUserId);
        return ResponseEntity.ok(Map.of("conversationId", conversationId));
    }

    @PostMapping("/group")
    public ResponseEntity<?> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        Integer currentUserId = getCurrentUserId();
        try {
            ConversationResponseDTO response = conversationService.createGroupConversation(currentUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllConversations() {
        Integer currentUserId = getCurrentUserId();
        try {
            List<ConversationResponseDTO> list = conversationService.getUserConversations(currentUserId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> getConversationDetails(@PathVariable Integer conversationId) {
        Integer currentUserId = getCurrentUserId();
        try {
            ConversationResponseDTO dto = conversationService.getConversationDetails(currentUserId, conversationId);
            return ResponseEntity.ok(dto);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/group/{conversationId}")
    public ResponseEntity<?> updateGroupInfo(@PathVariable Integer conversationId,
                                             @RequestBody UpdateGroupRequest request) {
        Integer currentUserId = getCurrentUserId();
        try {
            ConversationResponseDTO updated = conversationService.updateGroupInfo(currentUserId, conversationId, request);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/group/{conversationId}/members")
    public ResponseEntity<?> addMembers(@PathVariable Integer conversationId,
                                        @Valid @RequestBody AddGroupMembersRequest request) {
        Integer currentUserId = getCurrentUserId();
        try {
            ConversationResponseDTO updated = conversationService.addMembersToGroup(currentUserId, conversationId, request);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/group/{conversationId}/members/{targetUserId}")
    public ResponseEntity<?> removeMember(@PathVariable Integer conversationId,
                                          @PathVariable Integer targetUserId) {
        Integer currentUserId = getCurrentUserId();
        try {
            conversationService.removeMemberFromGroup(currentUserId, conversationId, targetUserId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa thành viên khỏi nhóm"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/group/{conversationId}/leave")
    public ResponseEntity<?> leaveGroup(@PathVariable Integer conversationId) {
        Integer currentUserId = getCurrentUserId();
        try {
            conversationService.leaveGroup(currentUserId, conversationId);
            return ResponseEntity.ok(Map.of("message", "Đã rời nhóm thành công"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{conversationId}")
    public ResponseEntity<?> deleteConversation(@PathVariable Integer conversationId) {
        Integer currentUserId = getCurrentUserId();
        try {
            conversationService.deleteConversation(currentUserId, conversationId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa cuộc trò chuyện thành công", "conversationId", conversationId));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("Unauthorized");
        }
        return Integer.parseInt(auth.getName());
    }
}
