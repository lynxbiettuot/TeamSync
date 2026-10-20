package com.springrest.backend.dto.authentication.request;

import lombok.Data;

@Data
public class SendOtpRequest {
    private String email;
}
