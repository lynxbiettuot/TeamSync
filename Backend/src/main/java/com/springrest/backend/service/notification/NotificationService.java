package com.springrest.backend.service.notification;

import com.springrest.backend.dto.notification.NotificationResponse;
import com.springrest.backend.entity.Notification;
import com.springrest.backend.repository.NotificationRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    //find all notification of user
    public Map<String, Object> getMyNotifications(Integer userId) {
        List<NotificationResponse> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getNotificationType(),
                        n.getContent(),
                        n.getReferenceId(),
                        n.isRead(),
                        n.getCreatedAt()
                ))
                .toList();
        long unreadCount = notificationRepository.countUnreadByUserId(userId);
        return Map.of(
                "notifications", notifications,
                "unreadCount", unreadCount
        );
    }

    //mark a notification is read
    @Transactional
    public void markAsRead(Integer notificationId, Integer userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        // Check if owner of notification can change these content
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not allowed to modify this notification");
        }
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    //mark all notification is read
    @Transactional
    public void markAllAsRead(Integer userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }
}
