package com.springrest.backend.controller.auth;

import com.springrest.backend.dto.authentication.request.LoginRequest;
import com.springrest.backend.dto.authentication.request.RegisterRequest;
import com.springrest.backend.dto.authentication.request.SendOtpRequest;
import com.springrest.backend.dto.authentication.response.LoginResult;
import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.service.auth.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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

    @PostMapping("register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            authService.register(request);

            return ResponseEntity.ok(Map.of("message", "Completed"));
        }catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));
        }
    }

    @PostMapping("login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try{
            LoginResult result = authService.login(request);

            ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", result.getRefreshToken())
                    .httpOnly(true)
                    .secure(false) // Đặt là true nếu chạy trên HTTPS (production)
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // Hạn sống cookie: 7 ngày
                    .sameSite("Strict")
                    .build();

            Map<String, Object> data = Map.of(
                    "accessToken", result.getAccessToken(),
                    "tokenType", "Bearer",
                    "expiresIn", result.getExpiresIn(),
                    "user", result.getUser()
            );

            Map<String, Object> responseBody = Map.of(
                    "success", true,
                    "message", "Login successful",
                    "data", data
            );


            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(responseBody);
        }catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Đăng nhập thất bại");
            errorResponse.put("data", null);

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
