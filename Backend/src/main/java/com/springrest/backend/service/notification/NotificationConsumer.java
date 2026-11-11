package com.springrest.backend.service.notification;

import com.springrest.backend.config.RabbitMQConfig;
import com.springrest.backend.dto.notification.NotificationEvent;
import com.springrest.backend.dto.notification.NotificationResponse;
import com.springrest.backend.entity.Notification;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.NotificationRepository;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationConsumer {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void handleNotificationEvent(NotificationEvent event) {
        User receiver = userRepository.findById(event.getReceiverId()).orElse(null);
        if (receiver == null) {
            return;
        }

        String senderName = "Ai đó";
        if (event.getSenderId() != null) {
            senderName = userRepository.findById(event.getSenderId())
                    .map(User::getDisplayName)
                    .orElse("Ai đó");
        }

        //cut down the message if preview is too long
        String preview = event.getRawContent() != null ? event.getRawContent() : "";
        if (preview.length() > 50) {
            preview = preview.substring(0, 50) + "...";
        }


        String finalContent = switch (event.getNotificationType()) {
            case MESSAGE -> senderName + " đã gửi tin nhắn: " + preview;
            case CALL -> "Bạn có cuộc gọi nhỡ từ " + senderName;
            case MENTION -> senderName + " đã nhắc đến bạn: " + preview;
        };

        //save to db
        Notification notification = new Notification();
        notification.setUser(receiver);
        notification.setNotificationType(event.getNotificationType());
        notification.setContent(finalContent);
        notification.setReferenceId(event.getReferenceId());
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        //send notification
        NotificationResponse response = new NotificationResponse(
                saved.getId(),
                saved.getNotificationType(),
                saved.getContent(),
                saved.getReferenceId(),
                saved.isRead(),
                saved.getCreatedAt()
        );
        messagingTemplate.convertAndSendToUser(
                String.valueOf(receiver.getId()),
                "/queue/notifications",
                response
        );

    }
}
