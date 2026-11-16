package com.springrest.backend.dto.chat.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EditMessageRequest {
    private String newContent;
    private Integer receiverId;
}
