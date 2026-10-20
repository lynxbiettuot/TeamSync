package com.springrest.backend.dto.authentication.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String otp;
    private String displayName;
    private String password;
}
