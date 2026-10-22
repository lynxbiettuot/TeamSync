package com.springrest.backend.dto.authentication.response;

import com.springrest.backend.entity.Enum.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserResponseDTO user;
}
