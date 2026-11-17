// src/main/java/com/springrest/backend/controller/chat/GroupCallController.java
package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.response.GroupCallJoinResponse;
import com.springrest.backend.service.chat.GroupCallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/calls/group")
@RequiredArgsConstructor
public class GroupCallController {

    private final GroupCallService groupCallService;

    @PostMapping("/{conversationId}/join")
    public ResponseEntity<?> joinGroupCall(@PathVariable Integer conversationId) {
        Integer currentUserId = getCurrentUserId();
        try {
            GroupCallJoinResponse response = groupCallService.joinGroupCall(currentUserId, conversationId);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{conversationId}/end")
    public ResponseEntity<?> endGroupCall(@PathVariable Integer conversationId) {
        Integer currentUserId = getCurrentUserId();
        try {
            groupCallService.endGroupCall(currentUserId, conversationId);
            return ResponseEntity.ok(Map.of("message", "Đã kết thúc cuộc gọi nhóm"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
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
