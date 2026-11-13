package com.springrest.backend.service.chat;

import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.dto.chat.response.ConversationResponseDTO;
import com.springrest.backend.entity.Conversation;
import com.springrest.backend.entity.Enum.ConversationType;
import com.springrest.backend.entity.Message;
import com.springrest.backend.entity.Participant;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.ConversationRepository;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.ParticipantRepository;
import com.springrest.backend.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ParticipantRepository participantRepository;
    private final ConversationRepository conversionRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public Integer getOrCreateDirectConversation(Integer currentUserId, Integer targetUserId) {// chat 1-1
        if (!userRepository.existsById(targetUserId)) {
            throw new IllegalArgumentException("User does not exist");
        }

        Optional<Integer> currentConversation= participantRepository.findDirectConversationId(currentUserId,targetUserId);

        if(currentConversation.isPresent()) {
            return currentConversation.get();
        }

        //if you don't have any conversation. create new
        Conversation newConversation = new Conversation();
        newConversation.setConversationType(ConversationType.INDIVIDUAL);// mark conversation as 1-1
        newConversation.setCreatedAt(LocalDateTime.now());
        newConversation.setUpdatedAt(LocalDateTime.now());
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

    @Transactional(readOnly = true)
    public List<ConversationResponseDTO> getUserConversations(Integer currentUserId) {
        //list conversation
        List<Conversation> curList = conversionRepository.findConversationByUserId(currentUserId);

        List<ConversationResponseDTO> listUserConversation = new ArrayList<>();

        for(Conversation conversation : curList) {
            List<Participant> participants = participantRepository.findByConversationId(conversation.getId());
            //find other
            Integer otherUserId;

            String lastMessage = null;

            for(Participant participant : participants) {
                if(!participant.getUser().getId().equals(currentUserId)) {
                    User currentUser = participant.getUser();
                    otherUserId = currentUser.getId();

                    Optional<Message> lastMessageOtp = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId());

                    ConversationResponseDTO currentUserResponse  = new ConversationResponseDTO();
                    currentUserResponse.setId(conversation.getId());
                    currentUserResponse.setOtherUser(new UserResponseDTO(currentUser.getId(),
                                                    currentUser.getEmail(),
                                                    currentUser.getDisplayName(),
                                                    currentUser.getAvatarUrl(),
                                                    currentUser.getStatus(),
                                                    currentUser.getPublicKey()));

                    LocalDateTime updatedAt = conversation.getCreatedAt() != null ? conversation.getCreatedAt() : LocalDateTime.now();

                    if (lastMessageOtp.isPresent()) {
                        lastMessage = lastMessageOtp.get().getContent();
                        updatedAt = lastMessageOtp.get().getCreatedAt();
                    }
                    currentUserResponse.setLastMessage(lastMessage);
                    currentUserResponse.setUpdatedAt(updatedAt);
                    listUserConversation.add(currentUserResponse);
                    break;
                }
            }
        }
        listUserConversation.sort((a, b) -> {
            if (a.getUpdatedAt() == null || b.getUpdatedAt() == null) return 0;
            return b.getUpdatedAt().compareTo(a.getUpdatedAt());
        });

        return listUserConversation;
    }
}
