package com.springrest.backend.service.chat;

import com.springrest.backend.dto.chat.request.MessageReactionRequest;
import com.springrest.backend.dto.chat.response.MessageReactionResponse;
import com.springrest.backend.entity.MessageReaction;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.MessageReactionRepository;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MessageReactionService {
    private final MessageReactionRepository messageReactionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public MessageReactionResponse reactToMessage(Integer userId, MessageReactionRequest request) {
        //reaction sender info
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        //check if user used to react this message
        Optional<MessageReaction> existingOpt = messageReactionRepository.findByMessageIdAndUserId(request.getMessageId(), userId);

        if(existingOpt.isPresent() && existingOpt.get().getReactType() == request.getReactType()) {// react in same icon -> unmount the reaction icon
            messageReactionRepository.delete(existingOpt.get());

            return new MessageReactionResponse(userId, currentUser.getDisplayName(),currentUser.getAvatarUrl(),null);
        }else if(existingOpt.isPresent()) {// switch to another icon
            MessageReaction existingMessageReaction = existingOpt.get();

            existingMessageReaction.setReactType(request.getReactType());

            messageReactionRepository.save(existingMessageReaction);
            return new MessageReactionResponse(userId, currentUser.getDisplayName(), currentUser.getAvatarUrl(), request.getReactType());
        }
        MessageReaction reaction = new MessageReaction();
        reaction.setMessage(messageRepository.getReferenceById(request.getMessageId()));
        reaction.setUser(currentUser);
        reaction.setReactType(request.getReactType());
        reaction.setCreateAt(LocalDateTime.now());
        messageReactionRepository.save(reaction);
        return new MessageReactionResponse(userId, currentUser.getDisplayName(), currentUser.getAvatarUrl(), request.getReactType());
    }

}
