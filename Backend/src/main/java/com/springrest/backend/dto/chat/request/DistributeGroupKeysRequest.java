// DTO yêu cầu phân phối danh sách K_nhom đã được mã hóa cho các thành viên trong nhóm trò chuyện
package com.springrest.backend.dto.chat.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistributeGroupKeysRequest {
    private Integer keyVersion = 1;
    private List<KeyItem> keys;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KeyItem {
        private Integer recipientId;
        private String encryptedKey;
    }
}
