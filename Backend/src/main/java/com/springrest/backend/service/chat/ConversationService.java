package com.springrest.backend.service.chat;

import com.springrest.backend.entity.Conversation;
import com.springrest.backend.entity.Enum.ConversationType;
import com.springrest.backend.entity.Participant;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.ConversationRepository;
import com.springrest.backend.repository.ParticipantRepository;
import com.springrest.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ParticipantRepository participantRepository;
    private final ConversationRepository conversionRepository;
    private final UserRepository userRepository;

    @Transactional
    public Integer getOrCreateDirectConversation(Integer currentUserId, Integer targetUserId) {// chat 1-1
        if (!userRepository.existsById(targetUserId)) {
            throw new IllegalArgumentException("User does not exist");
        }

        Optional<Integer> currentConversation= participantRepository.findDirectConversationId(currentUserId,targetUserId);

        if(currentConversation.isPresent()) {
            return currentConversation.get();
        }

        //if don't have any conversation. create new
        Conversation newConversation = new Conversation();
        newConversation.setConversationType(ConversationType.INDIVIDUAL);// mark conversation as 1-1
        newConversation = conversionRepository.save(newConversation);

        //create participant
        User currentUser = userRepository.getReferenceById(currentUserId);
        Participant p1 = new Participant();
        p1.setConversation(newConversation);
        p1.setUser(currentUser);
        p1.setJoinedAt(LocalDateTime.now());
        participantRepository.save(p1);

        User targetUser = userRepository.getReferenceById(targetUserId);
        Participant p2 = new Participant();
        p2.setConversation(newConversation);
        p2.setUser(targetUser);
        p2.setJoinedAt(LocalDateTime.now());
        participantRepository.save(p2);

        //return conversation id
        return newConversation.getId();
    }
}
