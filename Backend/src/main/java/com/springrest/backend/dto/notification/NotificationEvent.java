package com.springrest.backend.dto.notification;

import com.springrest.backend.entity.Enum.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private Integer senderId;
    private Integer receiverId;
    private NotificationType notificationType;
    private String rawContent;
    private Integer referenceId;// save conversationid or callId
}
