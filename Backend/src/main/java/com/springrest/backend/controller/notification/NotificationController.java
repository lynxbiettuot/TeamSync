package com.springrest.backend.controller.notification;

import com.springrest.backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("Unauthorized");
        }
        return Integer.parseInt(auth.getName());
    }

    @GetMapping
    public ResponseEntity<?> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getMyNotifications(getCurrentUserId()));
    }
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id) {
        notificationService.markAsRead(id, getCurrentUserId());
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        notificationService.markAllAsRead(getCurrentUserId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
