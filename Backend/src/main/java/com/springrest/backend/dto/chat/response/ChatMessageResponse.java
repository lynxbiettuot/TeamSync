// src/main/java/com/springrest/backend/dto/chat/response/ChatMessageResponse.java
package com.springrest.backend.dto.chat.response;

import com.springrest.backend.entity.Enum.MessageType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private Integer id;
    private Integer conversationId;
    private Integer senderId;
    private String senderName;
    private String content;
    private MessageType messageType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDeleted;
    private ReplyMessageDTO replyTo;
    private List<MessageReactionResponse> reactions = new ArrayList<>();

    public ChatMessageResponse(Integer id, Integer conversationId, Integer senderId, String content, MessageType messageType, LocalDateTime createdAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = null;
        this.content = content;
        this.messageType = messageType;
        this.createdAt = createdAt;
        this.updatedAt = null;
        this.isDeleted = false;
        this.replyTo = null;
        this.reactions = new ArrayList<>();
    }
}
