// DTO phản hồi thông tin thành viên nhóm chat kèm khóa công khai E2EE phục vụ chia sẻ K_nhom
package com.springrest.backend.dto.chat.response;

import com.springrest.backend.entity.Enum.GroupRoleType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponseDTO {
    private Integer userId;
    private String email;
    private String displayName;
    private String avatarUrl;
    private GroupRoleType role;
    private LocalDateTime joinedAt;
    private String publicKey;

    public GroupMemberResponseDTO(Integer userId, String email, String displayName, String avatarUrl, GroupRoleType role, LocalDateTime joinedAt) {
        this.userId = userId;
        this.email = email;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.joinedAt = joinedAt;
    }
}
