// src/main/java/com/springrest/backend/dto/chat/request/AddGroupMembersRequest.java
package com.springrest.backend.dto.chat.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddGroupMembersRequest {
    @NotEmpty(message = "Danh sách thành viên không được để trống")
    private List<Integer> memberIds;
}
