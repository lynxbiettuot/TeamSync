// src/main/java/com/springrest/backend/dto/chat/response/GroupCallJoinResponse.java
package com.springrest.backend.dto.chat.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupCallJoinResponse {
    private String token;
    private String serverUrl;
    private String roomName;
    private Integer conversationId;
    private Integer hostId;
    private boolean isHost;
}
