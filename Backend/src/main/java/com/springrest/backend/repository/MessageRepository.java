package com.springrest.backend.repository;

import com.springrest.backend.entity.Conversation;
import com.springrest.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface MessageRepository extends JpaRepository<Message,Integer> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Integer conversationId);
}
