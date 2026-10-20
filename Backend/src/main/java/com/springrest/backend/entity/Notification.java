package com.springrest.backend.entity;

import com.springrest.backend.entity.Enum.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="notification")
    @Enumerated(EnumType.STRING)
    private NotificationType notificationType;

    @Column(name="content")
    private String content;

    @Column(name = "reference_id")
    private Integer referenceId;

    @Column(name="is_read")
    private boolean isRead;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @Column(name="updated_at")
    private LocalDateTime updatedAt;

    //map to user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name="NOTIFICATION_USER_ID_FK"))
    private User user;
}
