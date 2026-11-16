package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.request.CallSignalDTO;
import com.springrest.backend.repository.ParticipantRepository;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class CallController {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final ParticipantRepository participantRepository;

    //get signal from client
    @MessageMapping("/call.signal")
    public void handleCallSignal(@Payload CallSignalDTO signal, Principal principal) {
        if(principal == null) {
            return;
        }

        try {
            Integer authenticatedSenderId = Integer.parseInt(principal.getName());

            Integer targetUserId = signal.getReceiverId();
            if (targetUserId == null) {
                log.warn("Can't get targetUserId: {}", authenticatedSenderId);
                return;
            }

            //check if both of them already have conversation
            boolean canCall = participantRepository.findDirectConversationId(authenticatedSenderId, targetUserId).isPresent();
            if (!canCall) {
                log.warn("[WebRTC Call] Call is denied, you're not permitted: {}", authenticatedSenderId, targetUserId);
                return;
            }


            signal.setSenderId(authenticatedSenderId);
            if ("CALL_OFFER".equalsIgnoreCase(signal.getType())) {

                signal.setCallerId(authenticatedSenderId);
                userRepository.findById(authenticatedSenderId).ifPresent(user -> {
                    if (signal.getCallerName() == null || signal.getCallerName().isBlank()) {
                        String name = user.getDisplayName();
                        signal.setCallerName(name != null && !name.isBlank() ? name : user.getEmail());
                    }
                    if (signal.getCallerAvatar() == null) {
                        signal.setCallerAvatar(user.getAvatarUrl());
                    }
                });
            }

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(targetUserId),
                    "/queue/call",
                    signal
            );
        }catch (Exception e) {
            log.error("[WebRTC Call] error handling call signal: {}", e.getMessage(), e);
        }
    }
}