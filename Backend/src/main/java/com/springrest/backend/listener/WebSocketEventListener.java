package com.springrest.backend.listener;

import com.springrest.backend.dto.chat.response.UserPresenceResponse;
import com.springrest.backend.service.chat.UserPresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {
    private final UserPresenceService userPresenceService;

    private final SimpMessagingTemplate simpMessagingTemplate;

    //handle when having ws request
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = event.getUser();

        if(principal == null) {
            return;
        }

        try {
             Integer userId = Integer.parseInt(principal.getName());
             String sessionId = headerAccessor.getSessionId();

             //save to redis
             boolean isFirstSession = userPresenceService.userConnected(userId, sessionId);

             //if this is the first time
            if(isFirstSession) {
                UserPresenceResponse curUser = new UserPresenceResponse(userId,"ONLINE");
                simpMessagingTemplate.convertAndSend("/topic/presence", curUser);
            }

        }catch(Exception e) {
            System.out.println("[WS Presence] Error when handling connect event " + e.getMessage());
            e.printStackTrace();
        }
    }

    //handle when disconnect event
    @EventListener
    void andleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();

        if(principal == null) {
            return;
        }

        try {
            Integer userId = Integer.parseInt(principal.getName());
            String sessionId = event.getSessionId();


            //unmount sessionId in redis
            boolean isLatSession = userPresenceService.userDisconnected(userId, sessionId);

            if(isLatSession) {
                UserPresenceResponse curUser = new UserPresenceResponse(userId,"OFFLINE");
                simpMessagingTemplate.convertAndSend("/topic/presence", curUser);
            }
        }catch (Exception e) {
            System.out.println("[WS Presence] Error when handling disconnect event " + e.getMessage());
        }
    }
}
