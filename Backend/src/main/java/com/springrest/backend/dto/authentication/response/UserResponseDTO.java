package com.springrest.backend.dto.authentication.response;

import com.springrest.backend.entity.Enum.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserResponseDTO {
    private Integer id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private UserStatus status;
}