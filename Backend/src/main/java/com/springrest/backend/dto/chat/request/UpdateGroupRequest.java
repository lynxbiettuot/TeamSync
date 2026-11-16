// src/main/java/com/springrest/backend/dto/chat/request/UpdateGroupRequest.java
package com.springrest.backend.dto.chat.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupRequest {
    private String name;
    private String avatarUrl;
}
