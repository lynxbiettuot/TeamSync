package com.springrest.backend.Entity;

import com.springrest.backend.Entity.Enum.GroupRoleType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CollectionId;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="group_roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupRole {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer id;

    @Column(name="code")
    @Enumerated(EnumType.STRING)
    private GroupRoleType code;

    @Column(name="name")
    private String name;

    @Column(name="description")
    private String description;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @Column(name="priority")
    private Integer priority;

    //map to participant
    @OneToMany(mappedBy = "groupRole",cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Participant> participants = new ArrayList<>();
}
