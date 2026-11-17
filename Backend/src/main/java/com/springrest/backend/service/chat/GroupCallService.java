// src/main/java/com/springrest/backend/service/chat/GroupCallService.java
package com.springrest.backend.service.chat;

import com.springrest.backend.dto.chat.response.GroupCallJoinResponse;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.ParticipantRepository;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class GroupCallService {

    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final LiveKitTokenService liveKitTokenService;
    private final SimpMessagingTemplate messagingTemplate;

    private final Map<Integer, Integer> activeCallHosts = new ConcurrentHashMap<>();

    @Value("${livekit.url:ws://localhost:7880}")
    private String livekitUrl;

    public GroupCallJoinResponse joinGroupCall(Integer currentUserId, Integer conversationId) {
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new AccessDeniedException("You're not permitted to join a group call");
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User is not existed!"));

        Integer hostId = activeCallHosts.computeIfAbsent(conversationId, id -> currentUserId);
        boolean isHost = hostId.equals(currentUserId);

        String roomName = "group_" + conversationId;
        String token = liveKitTokenService.createToken(roomName, currentUserId, user.getDisplayName());

        Map<String, Object> wsEvent = new LinkedHashMap<>();
        wsEvent.put("type", "GROUP_CALL_START");
        wsEvent.put("conversationId", conversationId);
        wsEvent.put("callerId", hostId);
        wsEvent.put("callerName", user.getDisplayName());
        wsEvent.put("callerAvatar", user.getAvatarUrl());

        List<Integer> members = participantRepository.findMembersJoinConversation(conversationId);
        for (Integer memberId : members) {
            if (!memberId.equals(currentUserId)) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(memberId),
                        "/queue/messages",
                        wsEvent
                );
            }
        }

        return new GroupCallJoinResponse(token, livekitUrl, roomName, conversationId, hostId, isHost);
    }

    public void endGroupCall(Integer currentUserId, Integer conversationId) {
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new AccessDeniedException("Bạn không thuộc nhóm trò chuyện này");
        }
        Integer hostId = activeCallHosts.get(conversationId);
        if (hostId != null && !hostId.equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ người tạo cuộc gọi mới có quyền kết thúc cuộc gọi cho tất cả");
        }
        activeCallHosts.remove(conversationId);
        broadcastGroupCallEnd(conversationId);
    }

    public void handleRoomFinished(String roomName) {
        if (roomName == null || !roomName.startsWith("group_")) {
            return;
        }
        try {
            Integer conversationId = Integer.parseInt(roomName.substring("group_".length()));
            activeCallHosts.remove(conversationId);
            broadcastGroupCallEnd(conversationId);
        } catch (NumberFormatException ignored) {
        }
    }

    public void broadcastGroupCallEnd(Integer conversationId) {
        Map<String, Object> wsEvent = new LinkedHashMap<>();
        wsEvent.put("type", "GROUP_CALL_END");
        wsEvent.put("conversationId", conversationId);

        List<Integer> members = participantRepository.findMembersJoinConversation(conversationId);
        for (Integer memberId : members) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(memberId),
                    "/queue/messages",
                    wsEvent
            );
        }
    }
}
