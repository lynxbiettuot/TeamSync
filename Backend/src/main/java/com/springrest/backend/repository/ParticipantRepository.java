package com.springrest.backend.repository;

import com.springrest.backend.entity.Participant;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Integer> {


    @Query(value="SELECT p1.conversation FROM participant p1 " +
            "INNER JOIN participant p2 ON p1.conversation = p2.conversation " +
            "WHERE p1.user = :userA AND p2.user = :userB LIMIT 1",nativeQuery = true)
    Optional<Integer> findDirectConversationId(@Param("userA") Integer userA, @Param("userB") Integer userB);
}
