package com.springrest.backend.service.chat;

import com.springrest.backend.dto.chat.response.ChatMessageResponse;
import com.springrest.backend.dto.chat.response.ReplyMessageDTO;
import com.springrest.backend.entity.Message;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.ParticipantRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private  final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;

    @Transactional
    public List<ChatMessageResponse> getMessagesByConversationId(Integer conversationId) {
        List<Message> listMessage = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        if (listMessage.isEmpty()) {
            return new ArrayList<ChatMessageResponse>();
        }

        List<ChatMessageResponse> listData= listMessage.stream().map(m -> {
            ChatMessageResponse res = new ChatMessageResponse(
                m.getId(),
                m.getConversation().getId(),
                m.getUser().getId(),
                m.getContent(),
                m.getMessageType(),
                m.getCreatedAt()
        );
            //get reply message if exist
            if(m.getReplyToMessage() != null) {
                Message parent = m.getReplyToMessage();
                String senderName = parent.getUser() != null ?parent.getUser().getDisplayName() : "Unknown";
                res.setReplyTo(new ReplyMessageDTO(parent.getId(), parent.getContent(), senderName));
            }
            return res;
        }).toList();
        return listData;
    }

    public List<Integer> findListMembersJoinConversation(Integer conversationId) {
        List<Integer> listMessage = participantRepository.findMembersJoinConversation(conversationId);
        return listMessage;
    }
}
