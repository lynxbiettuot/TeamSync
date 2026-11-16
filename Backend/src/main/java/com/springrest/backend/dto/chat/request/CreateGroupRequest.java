// src/main/java/com/springrest/backend/dto/chat/request/CreateGroupRequest.java
package com.springrest.backend.dto.chat.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupRequest {
    @NotBlank(message = "Tên nhóm không được để trống")
    private String name;

    private String avatarUrl;

    @NotEmpty(message = "Nhóm phải có ít nhất 1 thành viên khác")
    private List<Integer> memberIds;
}
