package com.springrest.backend.repository;

import com.springrest.backend.entity.Participant;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Integer> {// query on JpaRepository table


    @Query(value="SELECT p1.conversation FROM participant p1 " +
            "INNER JOIN participant p2 ON p1.conversation = p2.conversation " +
            "WHERE p1.user = :userA AND p2.user = :userB LIMIT 1",nativeQuery = true)
    Optional<Integer> findDirectConversationId(@Param("userA") Integer userA, @Param("userB") Integer userB);

    @Query(value="SELECT p.user FROM participant p " +
        "WHERE p.conversation = :conversationId ",nativeQuery = true)
    List<Integer> findMembersJoinConversation(@Param("conversationId") Integer conversationId);

    //find participants in conversation
    List<Participant> findByConversationId(Integer conversationId);
}
