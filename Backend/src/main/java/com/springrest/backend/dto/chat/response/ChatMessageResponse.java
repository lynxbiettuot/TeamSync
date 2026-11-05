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
    private MessageType messageType;
    private LocalDateTime createdAt;
    private ReplyMessageDTO replyTo;

    public ChatMessageResponse(Integer id,Integer conversationId, Integer senderId, String content, MessageType messageType,LocalDateTime createdAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.content = content;
        this.messageType = messageType;
        this.createdAt = createdAt;
        this.replyTo = null;
    }
}
