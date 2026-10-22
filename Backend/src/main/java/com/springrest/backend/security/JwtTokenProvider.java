package com.springrest.backend.security;

import com.springrest.backend.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.Data;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

@Component
@Data
public class JwtTokenProvider {
    private final String jwtSecret = "TeamSyncSuperSecretKeyForJwtAuthenticationWhichMustBeLongEnough";

    private final long jwtExpiration = 86400;

    public String generateJwtToken( User user ) {
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime expiration = now.plusSeconds(jwtExpiration);

        Date issuedAtDate = Date.from(now.atZone(ZoneId.systemDefault()).toInstant());
        Date expirationDate = Date.from(expiration.atZone(ZoneId.systemDefault()).toInstant());

        String jwtString = Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(issuedAtDate)
                .setExpiration(expirationDate)
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
        return jwtString;
    }

    public String generateJwtRefreshToken( ) {
        return UUID.randomUUID().toString();
    }
}
