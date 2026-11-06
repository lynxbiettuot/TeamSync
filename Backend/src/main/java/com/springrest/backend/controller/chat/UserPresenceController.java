package com.springrest.backend.controller.chat;

import com.springrest.backend.service.chat.UserPresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class UserPresenceController {
    private final UserPresenceService userPresenceService;

    @GetMapping("/online")
    public ResponseEntity<Set<Integer>> getOnlineUsers() {
        return ResponseEntity.ok(userPresenceService.getOnlineUserIds());
    }
}
