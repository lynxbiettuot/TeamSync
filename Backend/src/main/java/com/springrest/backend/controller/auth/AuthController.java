package com.springrest.backend.controller.auth;

import com.springrest.backend.dto.authentication.request.*;
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

    @PostMapping("forgot-password")
    public ResponseEntity<?> resetPawword(@RequestBody SendOtpRequest request) {
        Map<String, Object> data = new HashMap<>();
        try{
            String resutl = authService.reSentOtp(request);
            data.put("success", true);
            data.put("resutl", resutl);
            data.put("message", "Reset password successful");
            return ResponseEntity.ok().body(data);
        }catch (RuntimeException e) {
            data.put("success", true);
            data.put("resutl", null);
            data.put("message",e.getMessage() != null ? e.getMessage() : "Can't send otp");
            return ResponseEntity.badRequest().body(data);
        }
    }

    @PostMapping("verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtp request) {
        Map<String, Object> data = new HashMap<>();
        try{
            String result = authService.verifyOtp(request);
            data.put("success", true);
            data.put("resutl", result);
            return ResponseEntity.ok().body(data);
        }catch (RuntimeException e) {
            data.put("success", false);
            data.put("resutl", null);
            return ResponseEntity.badRequest().body(data);
        }
    }

    @PostMapping("reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody VerifyPassword request) {
        Map<String, Object> data = new HashMap<>();
        try{
            String result = authService.verifyPassword(request);
            data.put("success", true);
            data.put("message", result);
            return ResponseEntity.ok().body(data);
        }catch (RuntimeException e) {
            data.put("success", false);
            data.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(data);
        }
    }

    @PostMapping("refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        try {
            LoginResult result = authService.refreshToken(refreshToken);

            Map<String, Object> data = Map.of(
                    "accessToken", result.getAccessToken(),
                    "tokenType", "Bearer",
                    "expiresIn", result.getExpiresIn(),
                    "user", result.getUser()
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Refresh token successful",
                    "data", data
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", e.getMessage() != null ? e.getMessage() : "Session expired"
            ));
        }
    }

    @PostMapping("logout")
    public ResponseEntity<?> logout(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }

        // Xóa cookie trên trình duyệt
        ResponseCookie clearCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(Map.of("success", true, "message", "Logged out successfully"));
    }

}
