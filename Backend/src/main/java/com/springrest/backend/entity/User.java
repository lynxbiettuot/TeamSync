package com.springrest.backend.entity;

import com.springrest.backend.entity.Enum.UserStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity()
@Table(name="users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true,nullable = false, name = "email")
    private String email;

    @Column(nullable =  false, name = "password")
    private String password;

    @Column(name="display_name")
    private String displayName;

    @Column(name="avatar_url")
    private String avatarUrl;

    @Column(name="reset_password_token", length = 255)
    private String resetPasswordToken;

    @Column(name="reset_password_expirations")
    private LocalDateTime resetPasswordExpirations;

    @Enumerated(EnumType.STRING)
    @Column(name="status")
    private UserStatus status;

    @Column(name = "google_id", unique = true, length = 100, nullable = true)
    private String googleId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // map to refresh token
    @OneToMany(mappedBy = "user",cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RefreshToken> refreshTokens = new ArrayList<RefreshToken>();

    //map to system role
    @OneToMany(mappedBy = "user",cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SystemRole> systemRoles = new ArrayList<SystemRole>();

    //map to notification
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Notification> notifications = new ArrayList<Notification>();

    //map to participant
    @OneToMany(mappedBy = "user",cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Participant> participants = new ArrayList<>();

    //map to message
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages = new ArrayList<>();
}
