package com.springrest.backend.repository;

import com.springrest.backend.entity.Conversation;
import com.springrest.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface MessageRepository extends JpaRepository<Message,Integer> {
   //find all message in a conversation
    List<Message> findByConversationIdOrderByCreatedAtAsc(Integer conversationId);

    //find the last one messsage in a comversation
    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Integer conversationId);
}
