package com.springrest.backend.dto.chat.request;

import com.springrest.backend.entity.Enum.MessageType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {
    private Integer conversationId;
    private Integer receiverId;
    private String content;
    private MessageType messageType;
}
