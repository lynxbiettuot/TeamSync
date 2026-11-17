// DTO yêu cầu sao lưu khóa riêng tư E2EE đã được mã hóa bằng mã PIN PBKDF2
package com.springrest.backend.dto.chat.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class E2EEBackupRequest {
    private String encryptedPrivateKey;
    private String backupSalt;
}
