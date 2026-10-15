package com.springrest.backend.Entity;

import com.springrest.backend.Entity.Enum.ReactType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="message_reaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageReaction {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer id;

    @Column(name="react_type")
    private ReactType reactType;

    @Column(name="created_at")
    private LocalDateTime createAt;

    //map to message
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="message_id", foreignKey = @ForeignKey(name="MESSAGE_FK"))
    private Message message;

    //map to user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id", foreignKey = @ForeignKey(name="USER_ID_FK"))
    private User user;
}
