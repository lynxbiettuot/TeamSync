package com.springrest.backend.repository;

import com.springrest.backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Integer> {
}
