package com.springrest.backend.dto.chat.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.springrest.backend.entity.Enum.MessageType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {

    @JsonProperty("conversationId")
    @JsonAlias({"conversation_id", "conversationId"})
    private Integer conversationId;

    @JsonProperty("receiverId")
    @JsonAlias({"receiver_id", "receiverId"})
    private Integer receiverId;

    private String content;

    @JsonProperty("messageType")
    @JsonAlias({"message_type", "messageType"})
    private MessageType messageType;
}
