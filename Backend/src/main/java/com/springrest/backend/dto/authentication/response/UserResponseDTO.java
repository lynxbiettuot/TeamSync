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
    private String publicKey;

    public UserResponseDTO(Integer id, String email, String displayName, String avatarUrl, UserStatus status) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.status = status;
    }
}