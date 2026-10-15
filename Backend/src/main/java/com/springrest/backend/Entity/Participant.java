package com.springrest.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name="participant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="joined_at")
    @Enumerated(EnumType.STRING)
    private LocalDateTime joinedAt;

    @Column(name="last_read_at")
    private LocalDateTime lastReadAt;

    //map to user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user", foreignKey = @ForeignKey(name="USER_ID_FK"))
    private User user;

    //map to group roles
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="group_role", foreignKey = @ForeignKey(name="GROUP_ROLE_ID_FK"))
    private GroupRole groupRole;

    //map to Conversation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="conversation", foreignKey = @ForeignKey(name="CONVERSATION_ID_FK"))
    private Conversation conversation;
}
