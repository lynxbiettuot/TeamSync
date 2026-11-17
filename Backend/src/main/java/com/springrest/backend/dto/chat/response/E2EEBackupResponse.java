// DTO phản hồi trạng thái và dữ liệu sao lưu khóa riêng tư E2EE bằng mã PIN
package com.springrest.backend.dto.chat.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class E2EEBackupResponse {
    private boolean hasBackup;
    private String encryptedPrivateKey;
    private String backupSalt;
}
