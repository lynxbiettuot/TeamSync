// src/main/java/com/springrest/backend/dto/chat/response/GroupMemberResponseDTO.java
package com.springrest.backend.dto.chat.response;

import com.springrest.backend.entity.Enum.GroupRoleType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponseDTO {
    private Integer userId;
    private String email;
    private String displayName;
    private String avatarUrl;
    private GroupRoleType role;
    private LocalDateTime joinedAt;
}
