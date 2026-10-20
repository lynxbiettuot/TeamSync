package com.springrest.backend.controller.auth;

import com.springrest.backend.dto.authentication.request.SendOtpRequest;
import com.springrest.backend.service.auth.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("register/send-otp")
    public ResponseEntity<?> sendRegisterOtp(@RequestBody SendOtpRequest request) {
        try {
            System.out.println("This is send email otp");
            authService.sendRegisterOtp(request.getEmail());

            return ResponseEntity.ok(Map.of("message", "Otp is sent"));
        }catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));
        }
    }
}
