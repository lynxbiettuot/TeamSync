package com.springrest.backend.service.chat;

import com.springrest.backend.dto.chat.response.ChatMessageResponse;
import com.springrest.backend.entity.Message;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private  final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;

    public List<ChatMessageResponse> getMessagesByConversationId(Integer conversationId) {
        List<Message> listMessage = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        if (listMessage.isEmpty()) {
            return new ArrayList<ChatMessageResponse>();
        }

        List<ChatMessageResponse> listData= listMessage.stream().map(m -> new ChatMessageResponse(
                m.getId(),
                m.getConversation().getId(),
                m.getUser().getId(),
                m.getContent(),
                m.getMessageType(),
                m.getCreatedAt()
        )).toList();
        return listData;
    }

    public List<Integer> findListMembersJoinConversation(Integer conversationId) {
        List<Integer> listMessage = participantRepository.findMembersJoinConversation(conversationId);
        return listMessage;
    }
}
