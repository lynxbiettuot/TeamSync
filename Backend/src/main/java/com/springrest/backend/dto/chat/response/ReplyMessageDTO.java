package com.springrest.backend.dto.chat.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReplyMessageDTO {
    private Integer id;
    private String content;
    private String senderName;
};