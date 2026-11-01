package com.springrest.backend.dto.chat.response;

import com.springrest.backend.entity.Enum.MessageType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private Integer id;
    private Integer conversationId;
    private Integer senderId;
    private String content;
    private MessageType mesageType;
    private LocalDateTime timestamp;
}
