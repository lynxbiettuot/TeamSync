// src/main/java/com/springrest/backend/controller/chat/LiveKitWebhookController.java
package com.springrest.backend.controller.chat;

import com.springrest.backend.service.chat.GroupCallService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class LiveKitWebhookController {

    private final GroupCallService groupCallService;

    @Value("${livekit.api-secret:}")
    private String apiSecret;

    @PostMapping("/livekit")
    public ResponseEntity<String> handleLiveKitWebhook(
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (payload == null || payload.isEmpty()) {
            return ResponseEntity.ok("Empty payload");
        }

        if (apiSecret != null && !apiSecret.isBlank() && authHeader != null && !authHeader.isBlank()) {
            try {
                String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(Keys.hmacShaKeyFor(apiSecret.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                if (claims == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid webhook token");
                }
            } catch (Exception e) {
                log.warn("[LiveKit Webhook] Token verification failed: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Webhook authentication failed");
            }
        }

        try {
            String event = (String) payload.get("event");
            Object roomObj = payload.get("room");
            String roomName = null;
            int numParticipants = 0;

            if (roomObj instanceof Map<?, ?> roomMap) {
                Object nameVal = roomMap.get("name");
                if (nameVal != null) {
                    roomName = String.valueOf(nameVal);
                }
                Object numVal = roomMap.get("numParticipants");
                if (numVal instanceof Number number) {
                    numParticipants = number.intValue();
                }
            }

            log.info("[LiveKit Webhook] Received event: {}, room: {}, participants: {}", event, roomName, numParticipants);

            if ("room_finished".equals(event) || ("participant_left".equals(event) && numParticipants == 0)) {
                if (roomName != null) {
                    groupCallService.handleRoomFinished(roomName);
                }
            }

            return ResponseEntity.ok("Webhook processed successfully");
        } catch (Exception e) {
            log.error("[LiveKit Webhook] Error processing payload: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Malformed webhook payload");
        }
    }
}
