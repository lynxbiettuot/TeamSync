package com.springrest.backend.service.auth;

import com.springrest.backend.dto.authentication.request.LoginRequest;
import com.springrest.backend.dto.authentication.request.RegisterRequest;
import com.springrest.backend.dto.authentication.response.LoginResponse;
import com.springrest.backend.dto.authentication.response.LoginResult;
import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.entity.Enum.UserStatus;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.UserRepository;
import com.springrest.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final MailService mailService;
    private final JwtTokenProvider jwtTokenProvider;

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
        userRepository.save(user);

        redisTemplate.delete(redisKey);
    }

    public LoginResult login(LoginRequest request) {
        String email = request.getEmail();
        String password = request.getPassword();
        if(!userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email or password is incorrect");
        }

        Optional<User> user = userRepository.findByEmail(email);
        System.out.println("This is user");
        boolean isPasswordMatch = false;
        if(user.isPresent()) {
            isPasswordMatch = passwordEncoder.matches(password, user.get().getPassword());
        }

        if(!isPasswordMatch) {
            throw new RuntimeException("Email or password is incorrect");
        }
        //access token
        String jwtToken = jwtTokenProvider.generateJwtToken(user.get());

        //refresh token
        String refreshToken = jwtTokenProvider.generateJwtRefreshToken();

        User actualUser = user.get();

        UserResponseDTO userData = new UserResponseDTO(actualUser.getId(), actualUser.getEmail(),  actualUser.getDisplayName(), actualUser.getAvatarUrl(), actualUser.getStatus());

        return new LoginResult(jwtToken,refreshToken,jwtTokenProvider.getJwtExpiration(),userData);
    }
}
