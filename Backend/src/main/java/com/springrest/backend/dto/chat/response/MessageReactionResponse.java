package com.springrest.backend.dto.chat.response;

import com.springrest.backend.entity.Enum.ReactType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageReactionResponse {
    private Integer userId;
    private String userName;
    private String avatarUrl;
    private ReactType reactType;
}
