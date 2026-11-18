// Entity lưu trữ thông tin tệp đính kèm và hình ảnh trong tin nhắn trò chuyện
package com.springrest.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name="attachment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer id;

    @Column(name="name")
    private String name;

    @Column(name="file_url", length = 1000, nullable = true)
    private String fileUrl;

    @Column(name="file_type", nullable = true)
    private String fileType;

    @Column(name="file_size", nullable = true)
    private Long fileSize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="message_id", foreignKey = @ForeignKey(name = "ATTACHMENT_MESSAGE_FK"))
    private Message message;
}
