package com.springrest.backend.dto.notification;


import com.fasterxml.jackson.annotation.JsonProperty;
import com.springrest.backend.entity.Enum.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Integer id;
    private NotificationType notificationType;
    private String content;
    private Integer referenceId;// save referenceid and callid

    @JsonProperty("isRead")
    private boolean isRead;

    private LocalDateTime createdAt;
}
