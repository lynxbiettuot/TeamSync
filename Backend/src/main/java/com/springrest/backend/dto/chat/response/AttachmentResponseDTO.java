// DTO phản hồi thông tin tệp đính kèm và hình ảnh trong tin nhắn
package com.springrest.backend.dto.chat.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponseDTO {
    private Integer id;
    private String name;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
}
