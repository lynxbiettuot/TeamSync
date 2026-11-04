package com.springrest.backend.repository;

import com.springrest.backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Integer> {
    //query full dialog which user joined
    @Query(value="SELECT c.* FROM conversation c "
                + "INNER JOIN participant p ON p.conversation = c.id "
                + "WHERE p.user = :userId", nativeQuery = true)
    List<Conversation> findConversationByUserId(@Param("userId") Integer userId);

}
