package com.springrest.backend.dto.authentication.request;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
