// DTO phản hồi chứa K_nhom đã bọc của người dùng hiện tại trong nhóm chat
package com.springrest.backend.dto.chat.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupKeyResponse {
    private Integer conversationId;
    private Integer recipientId;
    private Integer senderId;
    private String senderPublicKey;
    private String encryptedKey;
    private Integer keyVersion;
}
