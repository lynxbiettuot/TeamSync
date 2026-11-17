// src/main/java/com/springrest/backend/service/chat/LiveKitTokenService.java
package com.springrest.backend.service.chat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class LiveKitTokenService {

    @Value("${livekit.api-key:devkey}")
    private String apiKey;

    @Value("${livekit.api-secret:secret}")
    private String apiSecret;

    public String createToken(String roomName, Integer userId, String displayName) {
        Map<String, Object> videoGrants = new LinkedHashMap<>();
        videoGrants.put("room", roomName);
        videoGrants.put("roomJoin", true);
        videoGrants.put("canPublish", true);
        videoGrants.put("canSubscribe", true);
        videoGrants.put("canPublishData", true);

        long now = System.currentTimeMillis();
        long exp = now + (6 * 3600 * 1000);

        Key signingKey = new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), SignatureAlgorithm.HS256.getJcaName());

        return Jwts.builder()
                .setIssuer(apiKey)// livekit get apikey, this is mandatory field
                .setSubject(String.valueOf(userId))// livekit get this to identity user who join
                .claim("name", displayName != null ? displayName : "User " + userId)// optional
                .claim("video", videoGrants)// mandatory field name is video to get livekit's permit to call
                .setNotBefore(new Date(now))
                .setExpiration(new Date(exp))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }
}
