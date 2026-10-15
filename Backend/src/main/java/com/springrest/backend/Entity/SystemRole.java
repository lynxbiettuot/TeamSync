package com.springrest.backend.Entity;

import com.springrest.backend.Entity.Enum.SystemRoleLabel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="system_roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SystemRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="code")
    private SystemRoleLabel code;

    @Column(name="name")
    private String name;

    @Column(name="description")
    private String description;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name="USER_ID_FK"))
    private User user;
}
