package com.springrest.backend.dto.authentication.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerifyPassword {
    private String email;
    private String newResetPassword;
    private String newConfirmResetPassword;
    private String otp;
}
