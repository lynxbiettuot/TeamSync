// Repository truy vấn khóa nhóm K_nhom đã được mã hóa theo conversationId, recipientId và keyVersion
package com.springrest.backend.repository;

import com.springrest.backend.entity.GroupEncryptedKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupEncryptedKeyRepository extends JpaRepository<GroupEncryptedKey, Long> {
    Optional<GroupEncryptedKey> findTopByConversationIdAndRecipientIdOrderByKeyVersionDesc(Integer conversationId, Integer recipientId);

    Optional<GroupEncryptedKey> findByConversationIdAndRecipientIdAndKeyVersion(Integer conversationId, Integer recipientId, Integer keyVersion);

    List<GroupEncryptedKey> findByConversationId(Integer conversationId);
}
