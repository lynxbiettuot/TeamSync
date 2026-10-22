package com.springrest.backend.dto.authentication.response;

import com.springrest.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResult {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private UserResponseDTO user;
}
