package com.springrest.backend.entity;

import com.springrest.backend.entity.Enum.MessageType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="content")
    private String content;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @Column(name="updated_at")
    private LocalDateTime updatedAt;

    @Column(name="deleted_at")
    private LocalDateTime deletedAt;

    @Column(name="message_type")
    @Enumerated(EnumType.STRING)
    private MessageType messageType;

    // map to user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "MESSAGE_USER_ID_FK"))
    private User user;

    //map to conversation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", foreignKey = @ForeignKey(name = "MESSAGE_CONVERSATION_ID_FK"))
    private Conversation conversation;

    //map to attachment
    @OneToMany(mappedBy = "message",cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Attachment> attachmentList = new ArrayList<>();

    //map to message reaction
    @OneToMany(mappedBy = "message",cascade = CascadeType.ALL,orphanRemoval = true)
    private List<MessageReaction> messageReactions = new ArrayList<>();
}
