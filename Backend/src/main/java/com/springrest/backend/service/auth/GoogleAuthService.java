// Service xác thực Google idToken, tự động tạo hoặc đồng bộ User và cấp JWT token cho phiên đăng nhập
package com.springrest.backend.service.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.springrest.backend.dto.authentication.response.LoginResult;
import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.entity.Enum.UserStatus;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.UserRepository;
import com.springrest.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    @Value("${google.client.id}")
    private String googleClientId;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public LoginResult authenticateGoogleUser(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new IllegalArgumentException("Google idToken is required");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance()
            )
            .setAudience(Collections.singletonList(googleClientId))
            .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Google Token không hợp lệ hoặc đã hết hạn");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Không thể xác định email từ Google Token");
            }

            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            String googleId = payload.getSubject();

            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            User user;

            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                }
                if (user.getAvatarUrl() == null && pictureUrl != null) {
                    user.setAvatarUrl(pictureUrl);
                }
                user.setUpdatedAt(LocalDateTime.now());
                user = userRepository.save(user);
            } else {
                user = new User();
                user.setEmail(email);
                user.setDisplayName(name != null && !name.isBlank() ? name : email);
                user.setAvatarUrl(pictureUrl);
                user.setGoogleId(googleId);
                user.setStatus(UserStatus.ACTIVE);
                user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                user.setCreatedAt(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                user = userRepository.save(user);
            }

            String jwtToken = jwtTokenProvider.generateJwtToken(user);
            String refreshToken = jwtTokenProvider.generateJwtRefreshToken();

            String redisKeyRefreshToken = "REFRESH_TOKEN:" + refreshToken;
            redisTemplate.opsForValue().set(redisKeyRefreshToken, user.getEmail(), 7, TimeUnit.DAYS);

            UserResponseDTO userData = new UserResponseDTO(
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName(),
                    user.getAvatarUrl(),
                    user.getStatus(),
                    user.getPublicKey()
            );

            return new LoginResult(jwtToken, refreshToken, jwtTokenProvider.getJwtExpiration(), userData);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GoogleAuth] Lỗi xác thực Google Token: {}", e.getMessage(), e);
            throw new RuntimeException("Xác thực Google thất bại: " + e.getMessage(), e);
        }
    }
}
