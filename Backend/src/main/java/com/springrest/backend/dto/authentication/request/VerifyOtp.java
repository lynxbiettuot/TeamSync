package com.springrest.backend.dto.authentication.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerifyOtp {
    private String email;
    private String otp;
}
