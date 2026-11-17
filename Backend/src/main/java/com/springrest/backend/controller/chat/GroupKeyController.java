// Controller REST API cung cấp endpoint phân phối/lấy khóa K_nhom và sao lưu/khôi phục E2EE bằng PIN
package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.request.DistributeGroupKeysRequest;
import com.springrest.backend.dto.chat.request.E2EEBackupRequest;
import com.springrest.backend.dto.chat.response.E2EEBackupResponse;
import com.springrest.backend.dto.chat.response.GroupKeyResponse;
import com.springrest.backend.service.chat.GroupKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class GroupKeyController {

    private final GroupKeyService groupKeyService;

    @PostMapping("/api/conversations/group/{conversationId}/keys")
    public ResponseEntity<?> distributeKeys(
            @PathVariable Integer conversationId,
            @RequestBody DistributeGroupKeysRequest request
    ) {
        Integer currentUserId = getCurrentUserId();
        try {
            groupKeyService.saveGroupKeys(currentUserId, conversationId, request);
            return ResponseEntity.ok(Map.of("message", "Đã phân phối khóa nhóm thành công"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/conversations/group/{conversationId}/key")
    public ResponseEntity<?> getGroupKey(@PathVariable Integer conversationId) {
        Integer currentUserId = getCurrentUserId();
        try {
            GroupKeyResponse response = groupKeyService.getGroupKeyForUser(currentUserId, conversationId);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/e2ee/backup")
    public ResponseEntity<?> saveBackup(@RequestBody E2EEBackupRequest request) {
        Integer currentUserId = getCurrentUserId();
        try {
            groupKeyService.saveE2EEBackup(currentUserId, request);
            return ResponseEntity.ok(Map.of("message", "Đã lưu bản sao lưu E2EE thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/e2ee/backup")
    public ResponseEntity<?> getBackup() {
        Integer currentUserId = getCurrentUserId();
        try {
            E2EEBackupResponse response = groupKeyService.getE2EEBackup(currentUserId);
            return ResponseEntity.ok(response);
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
