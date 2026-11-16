// src/main/java/com/springrest/backend/dto/chat/response/ConversationResponseDTO.java
package com.springrest.backend.dto.chat.response;

import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.entity.Enum.ConversationType;
import com.springrest.backend.entity.Enum.GroupRoleType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponseDTO {
    private Integer id;
    private ConversationType type;
    private String name;
    private String avatarUrl;
    private UserResponseDTO otherUser;
    private List<GroupMemberResponseDTO> members;
    private GroupRoleType currentUserRole;
    private String lastMessage;
    private LocalDateTime updatedAt;
}
