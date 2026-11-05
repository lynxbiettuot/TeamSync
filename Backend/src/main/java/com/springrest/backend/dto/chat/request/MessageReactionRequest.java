package com.springrest.backend.dto.chat.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.springrest.backend.entity.Enum.ReactType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageReactionRequest {
    @JsonProperty("conversationId")
    @JsonAlias({"conversation_id","conversationId"})
    private Integer conversationId;

    @JsonProperty("messageId")
    @JsonAlias({"message_id","messageId"})
    private Integer messageId;

    @JsonProperty("receiverId")
    @JsonAlias({"receiver_id","receiverId"})
    private Integer receiverId;

    @JsonProperty("reactType")
    @JsonAlias({"react_type","reactType"})
    private ReactType reactType;
}
