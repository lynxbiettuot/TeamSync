// Service xử lý lưu trữ và phân phối K_nhom qua WebSocket cũng như sao lưu/khôi phục E2EE bằng PIN
package com.springrest.backend.service.chat;

import com.springrest.backend.dto.chat.request.DistributeGroupKeysRequest;
import com.springrest.backend.dto.chat.request.E2EEBackupRequest;
import com.springrest.backend.dto.chat.response.E2EEBackupResponse;
import com.springrest.backend.dto.chat.response.GroupKeyResponse;
import com.springrest.backend.entity.GroupEncryptedKey;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.GroupEncryptedKeyRepository;
import com.springrest.backend.repository.ParticipantRepository;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GroupKeyService {

    private final GroupEncryptedKeyRepository groupEncryptedKeyRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void saveGroupKeys(Integer senderId, Integer conversationId, DistributeGroupKeysRequest request) {
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, senderId)) {
            throw new AccessDeniedException("Bạn không thuộc nhóm trò chuyện này");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Người gửi không tồn tại"));

        if (request.getKeys() == null || request.getKeys().isEmpty()) {
            return;
        }

        Integer version = request.getKeyVersion() != null ? request.getKeyVersion() : 1;

        for (DistributeGroupKeysRequest.KeyItem item : request.getKeys()) {
            if (item.getRecipientId() == null || item.getEncryptedKey() == null) {
                continue;
            }

            Optional<GroupEncryptedKey> existingOpt = groupEncryptedKeyRepository
                    .findByConversationIdAndRecipientIdAndKeyVersion(conversationId, item.getRecipientId(), version);

            GroupEncryptedKey keyEntity = existingOpt.orElseGet(GroupEncryptedKey::new);
            keyEntity.setConversationId(conversationId);
            keyEntity.setRecipientId(item.getRecipientId());
            keyEntity.setSenderId(senderId);
            keyEntity.setEncryptedKey(item.getEncryptedKey());
            keyEntity.setKeyVersion(version);
            keyEntity.setCreatedAt(LocalDateTime.now());

            groupEncryptedKeyRepository.save(keyEntity);

            Map<String, Object> wsEvent = new LinkedHashMap<>();
            wsEvent.put("type", "GROUP_KEY_DISTRIBUTE");
            wsEvent.put("conversationId", conversationId);
            wsEvent.put("senderId", senderId);
            wsEvent.put("senderPublicKey", sender.getPublicKey());
            wsEvent.put("keyVersion", version);
            wsEvent.put("encryptedKey", item.getEncryptedKey());

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(item.getRecipientId()),
                    "/queue/messages",
                    wsEvent
            );
        }
    }

    @Transactional(readOnly = true)
    public GroupKeyResponse getGroupKeyForUser(Integer currentUserId, Integer conversationId) {
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new AccessDeniedException("Bạn không thuộc nhóm trò chuyện này");
        }

        Optional<GroupEncryptedKey> keyOpt = groupEncryptedKeyRepository
                .findTopByConversationIdAndRecipientIdOrderByKeyVersionDesc(conversationId, currentUserId);

        if (keyOpt.isEmpty()) {
            return null;
        }

        GroupEncryptedKey key = keyOpt.get();
        User sender = userRepository.findById(key.getSenderId()).orElse(null);
        String senderPublicKey = sender != null ? sender.getPublicKey() : null;

        return new GroupKeyResponse(
                key.getConversationId(),
                key.getRecipientId(),
                key.getSenderId(),
                senderPublicKey,
                key.getEncryptedKey(),
                key.getKeyVersion()
        );
    }

    @Transactional
    public void saveE2EEBackup(Integer userId, E2EEBackupRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        user.setEncryptedPrivateKey(request.getEncryptedPrivateKey());
        user.setBackupSalt(request.getBackupSalt());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public E2EEBackupResponse getE2EEBackup(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        boolean hasBackup = user.getEncryptedPrivateKey() != null && !user.getEncryptedPrivateKey().trim().isEmpty();
        return new E2EEBackupResponse(hasBackup, user.getEncryptedPrivateKey(), user.getBackupSalt());
    }
}
