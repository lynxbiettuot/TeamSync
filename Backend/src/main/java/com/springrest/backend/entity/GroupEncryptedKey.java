// Entity lưu trữ bản ghi khóa nhóm K_nhom được bọc bằng ECDH Shared Key cho từng thành viên
package com.springrest.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_encrypted_key", uniqueConstraints = {
        @UniqueConstraint(name = "UK_CONV_RECIPIENT_VERSION", columnNames = {"conversation_id", "recipient_id", "key_version"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupEncryptedKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Integer conversationId;

    @Column(name = "recipient_id", nullable = false)
    private Integer recipientId;

    @Column(name = "sender_id", nullable = false)
    private Integer senderId;

    @Column(name = "encrypted_key", columnDefinition = "TEXT", nullable = false)
    private String encryptedKey;

    @Column(name = "key_version", nullable = false)
    private Integer keyVersion;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
