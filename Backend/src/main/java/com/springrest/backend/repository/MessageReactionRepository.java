package com.springrest.backend.repository;

import com.springrest.backend.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageReactionRepository extends JpaRepository<MessageReaction,Long> {
    //toggle reaction
    Optional<MessageReaction> findByMessageIdAndUserId(Integer messageId, Integer userId);

    //get all reactions in message
    List<MessageReaction> findByMessageId(Integer messageId);
}
