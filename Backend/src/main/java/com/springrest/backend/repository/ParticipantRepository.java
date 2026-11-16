// src/main/java/com/springrest/backend/repository/ParticipantRepository.java
package com.springrest.backend.repository;

import com.springrest.backend.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Integer> {

    @Query(value = "SELECT p1.conversation FROM participant p1 " +
            "INNER JOIN participant p2 ON p1.conversation = p2.conversation " +
            "WHERE p1.user = :userA AND p2.user = :userB LIMIT 1", nativeQuery = true)
    Optional<Integer> findDirectConversationId(@Param("userA") Integer userA, @Param("userB") Integer userB);

    @Query(value = "SELECT p.user FROM participant p " +
            "WHERE p.conversation = :conversationId", nativeQuery = true)
    List<Integer> findMembersJoinConversation(@Param("conversationId") Integer conversationId);

    List<Participant> findByConversationId(Integer conversationId);

    @Query("SELECT p FROM Participant p JOIN FETCH p.user LEFT JOIN FETCH p.groupRole WHERE p.conversation.id = :conversationId")
    List<Participant> findByConversationIdWithUserAndRole(@Param("conversationId") Integer conversationId);

    Optional<Participant> findByConversationIdAndUserId(Integer conversationId, Integer userId);

    boolean existsByConversationIdAndUserId(Integer conversationId, Integer userId);

    @Modifying
    @Query("DELETE FROM Participant p WHERE p.conversation.id = :conversationId AND p.user.id = :userId")
    void deleteByConversationIdAndUserId(@Param("conversationId") Integer conversationId, @Param("userId") Integer userId);
}
