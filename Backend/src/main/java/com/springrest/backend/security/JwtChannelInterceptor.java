package com.springrest.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {// interceptor for identify sender

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Chỉ xử lý frame CONNECT (lúc frontend mới kết nối)
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                try {
                    Claims claims = Jwts.parser()
                            .setSigningKey(jwtTokenProvider.getJwtSecret())
                            .parseClaimsJws(token)
                            .getBody();

                    Integer userId = claims.get("userId", Integer.class);

                    if (userId != null) {
                        // Tạo Principal với userId → gắn vào session WebSocket(taoj Object Principal)
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        String.valueOf(userId),
                                        null,
                                        Collections.emptyList()
                                );
                        accessor.setUser(authentication); // ← Add Principal to session WS
                    }

                } catch (Exception e) {
                    // Token is not valid or exxpired → don't set Principal
                    System.out.println("[WS] Token is not valid: " + e.getMessage());
                }
            }
        }

        return message;
    }
}

