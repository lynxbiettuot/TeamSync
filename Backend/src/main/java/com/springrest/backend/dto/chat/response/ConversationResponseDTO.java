package com.springrest.backend.dto.chat.response;

import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponseDTO {
    private Integer id;
    private UserResponseDTO otherUser;
    private String lastMessage;
    private LocalDateTime updatedAt;
}
