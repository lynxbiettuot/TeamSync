package com.springrest.backend.service.auth;

import com.springrest.backend.dto.authentication.request.RegisterRequest;
import com.springrest.backend.entity.Enum.UserStatus;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final MailService mailService;

    //redis prefix key
    private static final String REGISTER_OTP_PREFIX = "REGISTER_OTP";

    private static final String RESET_PW_OTP_PREFIX = "RESET_PW_OTP";

    private static final long OTP_TTL_MINUTES = 5;

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    public void sendRegisterOtp(String email) {
        if(userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already exist");
        }

        String otp = generateOtp();
        String redisKey = REGISTER_OTP_PREFIX + email;

        redisTemplate.opsForValue().set(redisKey, otp,OTP_TTL_MINUTES, TimeUnit.MINUTES);
        mailService.sendEmail(email, "Your regisration code: ",otp);

    }

    public void register(RegisterRequest registerRequest) {
        // validate
        String email = registerRequest.getEmail();
        String redisKey = REGISTER_OTP_PREFIX + email;

        String cahcedOtp = redisTemplate.opsForValue().get(redisKey);
        if(cahcedOtp == null || !cahcedOtp.equals(registerRequest.getOtp())) {
            throw new RuntimeException("OTP has expired");
        }

        if(userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already exist");
        }

        // create new user
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(registerRequest.getDisplayName());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
    }
}
