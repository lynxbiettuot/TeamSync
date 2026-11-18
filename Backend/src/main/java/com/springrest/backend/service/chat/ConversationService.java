// Service xử lý nghiệp vụ hội thoại chat 1-1, nhóm, danh sách thành viên và phân phối khóa E2EE
package com.springrest.backend.service.chat;

import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.dto.chat.request.AddGroupMembersRequest;
import com.springrest.backend.dto.chat.request.CreateGroupRequest;
import com.springrest.backend.dto.chat.request.UpdateGroupRequest;
import com.springrest.backend.dto.chat.response.ConversationResponseDTO;
import com.springrest.backend.dto.chat.response.GroupMemberResponseDTO;
import com.springrest.backend.entity.Conversation;
import com.springrest.backend.entity.Enum.ConversationType;
import com.springrest.backend.entity.Enum.GroupRoleType;
import com.springrest.backend.entity.GroupRole;
import com.springrest.backend.entity.Message;
import com.springrest.backend.entity.Participant;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.ConversationRepository;
import com.springrest.backend.repository.GroupRoleRepository;
import com.springrest.backend.repository.MessageRepository;
import com.springrest.backend.repository.ParticipantRepository;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ParticipantRepository participantRepository;
    private final ConversationRepository conversionRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final GroupRoleRepository groupRoleRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Integer getOrCreateDirectConversation(Integer currentUserId, Integer targetUserId) {
        if (!userRepository.existsById(targetUserId)) {
            throw new IllegalArgumentException("User does not exist");
        }

        Optional<Integer> currentConversation = participantRepository.findDirectConversationId(currentUserId, targetUserId);

        if (currentConversation.isPresent()) {
            return currentConversation.get();
        }

        Conversation newConversation = new Conversation();
        newConversation.setConversationType(ConversationType.INDIVIDUAL);
        newConversation.setCreatedAt(LocalDateTime.now());
        newConversation.setUpdatedAt(LocalDateTime.now());
        newConversation = conversionRepository.save(newConversation);

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

        return newConversation.getId();
    }

    @Transactional
    public ConversationResponseDTO createGroupConversation(Integer currentUserId, CreateGroupRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên nhóm không được để trống");
        }
        if (request.getMemberIds() == null || request.getMemberIds().isEmpty()) {
            throw new IllegalArgumentException("Nhóm phải có ít nhất 1 thành viên");
        }

        GroupRole adminRole = groupRoleRepository.findByCode(GroupRoleType.GROUP_ADMIN)
                .orElseGet(() -> {
                    GroupRole role = new GroupRole();
                    role.setCode(GroupRoleType.GROUP_ADMIN);
                    role.setName("Trưởng nhóm");
                    role.setCreatedAt(LocalDateTime.now());
                    return groupRoleRepository.save(role);
                });

        GroupRole memberRole = groupRoleRepository.findByCode(GroupRoleType.GROUP_MEMBER)
                .orElseGet(() -> {
                    GroupRole role = new GroupRole();
                    role.setCode(GroupRoleType.GROUP_MEMBER);
                    role.setName("Thành viên");
                    role.setCreatedAt(LocalDateTime.now());
                    return groupRoleRepository.save(role);
                });

        Conversation group = new Conversation();
        group.setName(request.getName().trim());
        group.setAvatarUrl(request.getAvatarUrl());
        group.setConversationType(ConversationType.GROUP);
        group.setCreatedAt(LocalDateTime.now());
        group.setUpdatedAt(LocalDateTime.now());
        group = conversionRepository.save(group);

        User creator = userRepository.getReferenceById(currentUserId);
        Participant creatorParticipant = new Participant();
        creatorParticipant.setConversation(group);
        creatorParticipant.setUser(creator);
        creatorParticipant.setGroupRole(adminRole);
        creatorParticipant.setJoinedAt(LocalDateTime.now());
        participantRepository.save(creatorParticipant);

        Set<Integer> uniqueMemberIds = new HashSet<>(request.getMemberIds());
        uniqueMemberIds.remove(currentUserId);

        for (Integer memberId : uniqueMemberIds) {
            if (userRepository.existsById(memberId)) {
                User member = userRepository.getReferenceById(memberId);
                Participant p = new Participant();
                p.setConversation(group);
                p.setUser(member);
                p.setGroupRole(memberRole);
                p.setJoinedAt(LocalDateTime.now());
                participantRepository.save(p);
            }
        }

        ConversationResponseDTO response = buildGroupConversationResponse(group, currentUserId);

        Map<String, Object> wsEvent = new LinkedHashMap<>();
        wsEvent.put("type", "CONVERSATION_CREATE");
        wsEvent.put("conversation", response);

        List<Integer> allMembers = participantRepository.findMembersJoinConversation(group.getId());
        for (Integer memberId : allMembers) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(memberId),
                    "/queue/messages",
                    wsEvent
            );
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<ConversationResponseDTO> getUserConversations(Integer currentUserId) {
        List<Conversation> curList = conversionRepository.findConversationByUserId(currentUserId);
        List<ConversationResponseDTO> listUserConversation = new ArrayList<>();

        for (Conversation conversation : curList) {
            if (conversation.getConversationType() == ConversationType.GROUP) {
                ConversationResponseDTO groupDto = buildGroupConversationResponse(conversation, currentUserId);
                listUserConversation.add(groupDto);
            } else {
                List<Participant> participants = participantRepository.findByConversationId(conversation.getId());
                for (Participant participant : participants) {
                    if (!participant.getUser().getId().equals(currentUserId)) {
                        User currentUser = participant.getUser();
                        Optional<Message> lastMessageOpt = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId());

                        ConversationResponseDTO currentUserResponse = new ConversationResponseDTO();
                        currentUserResponse.setId(conversation.getId());
                        currentUserResponse.setType(ConversationType.INDIVIDUAL);
                        currentUserResponse.setOtherUser(new UserResponseDTO(
                                currentUser.getId(),
                                currentUser.getEmail(),
                                currentUser.getDisplayName(),
                                currentUser.getAvatarUrl(),
                                currentUser.getStatus(),
                                currentUser.getPublicKey()
                        ));

                        String lastMessage = null;
                        LocalDateTime updatedAt = conversation.getCreatedAt() != null ? conversation.getCreatedAt() : LocalDateTime.now();

                        if (lastMessageOpt.isPresent()) {
                            lastMessage = lastMessageOpt.get().getDeletedAt() != null ? "Tin nhắn đã bị thu hồi" : lastMessageOpt.get().getContent();
                            updatedAt = lastMessageOpt.get().getCreatedAt();
                        }
                        currentUserResponse.setLastMessage(lastMessage);
                        currentUserResponse.setUpdatedAt(updatedAt);
                        listUserConversation.add(currentUserResponse);
                        break;
                    }
                }
            }
        }

        listUserConversation.sort((a, b) -> {
            if (a.getUpdatedAt() == null || b.getUpdatedAt() == null) return 0;
            return b.getUpdatedAt().compareTo(a.getUpdatedAt());
        });

        return listUserConversation;
    }

    @Transactional(readOnly = true)
    public ConversationResponseDTO getConversationDetails(Integer currentUserId, Integer conversationId) {
        Conversation conversation = conversionRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Cuộc trò chuyện không tồn tại"));

        if (!participantRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new AccessDeniedException("Bạn không thuộc cuộc trò chuyện này");
        }

        if (conversation.getConversationType() == ConversationType.GROUP) {
            return buildGroupConversationResponse(conversation, currentUserId);
        } else {
            List<Participant> participants = participantRepository.findByConversationId(conversationId);
            for (Participant participant : participants) {
                if (!participant.getUser().getId().equals(currentUserId)) {
                    User other = participant.getUser();
                    ConversationResponseDTO dto = new ConversationResponseDTO();
                    dto.setId(conversation.getId());
                    dto.setType(ConversationType.INDIVIDUAL);
                    dto.setOtherUser(new UserResponseDTO(
                            other.getId(),
                            other.getEmail(),
                            other.getDisplayName(),
                            other.getAvatarUrl(),
                            other.getStatus(),
                            other.getPublicKey()
                    ));
                    dto.setUpdatedAt(conversation.getUpdatedAt());
                    return dto;
                }
            }
            throw new IllegalArgumentException("Không tìm thấy thông tin đối phương");
        }
    }

    @Transactional
    public ConversationResponseDTO updateGroupInfo(Integer currentUserId, Integer conversationId, UpdateGroupRequest request) {
        Participant participant = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không thuộc nhóm này"));

        if (participant.getGroupRole() == null || participant.getGroupRole().getCode() != GroupRoleType.GROUP_ADMIN) {
            throw new AccessDeniedException("Chỉ trưởng nhóm mới có quyền cập nhật thông tin nhóm");
        }

        Conversation conversation = conversionRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Nhóm không tồn tại"));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            conversation.setName(request.getName().trim());
        }
        if (request.getAvatarUrl() != null) {
            conversation.setAvatarUrl(request.getAvatarUrl());
        }
        conversation.setUpdatedAt(LocalDateTime.now());
        conversionRepository.save(conversation);

        ConversationResponseDTO updatedDto = buildGroupConversationResponse(conversation, currentUserId);

        Map<String, Object> wsEvent = new LinkedHashMap<>();
        wsEvent.put("type", "CONVERSATION_UPDATE");
        wsEvent.put("conversation", updatedDto);

        List<Integer> allMembers = participantRepository.findMembersJoinConversation(conversationId);
        for (Integer memberId : allMembers) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(memberId),
                    "/queue/messages",
                    wsEvent
            );
        }

        return updatedDto;
    }

    @Transactional
    public ConversationResponseDTO addMembersToGroup(Integer currentUserId, Integer conversationId, AddGroupMembersRequest request) {
        Participant currentPart = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không thuộc nhóm này"));

        if (currentPart.getGroupRole() == null || currentPart.getGroupRole().getCode() != GroupRoleType.GROUP_ADMIN) {
            throw new AccessDeniedException("Chỉ trưởng nhóm mới có quyền thêm thành viên");
        }

        Conversation conversation = conversionRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Nhóm không tồn tại"));

        GroupRole memberRole = groupRoleRepository.findByCode(GroupRoleType.GROUP_MEMBER)
                .orElseGet(() -> {
                    GroupRole role = new GroupRole();
                    role.setCode(GroupRoleType.GROUP_MEMBER);
                    role.setName("Thành viên");
                    role.setCreatedAt(LocalDateTime.now());
                    return groupRoleRepository.save(role);
                });

        for (Integer newUserId : request.getMemberIds()) {
            if (userRepository.existsById(newUserId) && !participantRepository.existsByConversationIdAndUserId(conversationId, newUserId)) {
                User user = userRepository.getReferenceById(newUserId);
                Participant p = new Participant();
                p.setConversation(conversation);
                p.setUser(user);
                p.setGroupRole(memberRole);
                p.setJoinedAt(LocalDateTime.now());
                participantRepository.save(p);
            }
        }

        conversation.setUpdatedAt(LocalDateTime.now());
        conversionRepository.save(conversation);

        ConversationResponseDTO updatedDto = buildGroupConversationResponse(conversation, currentUserId);

        Map<String, Object> wsEvent = new LinkedHashMap<>();
        wsEvent.put("type", "CONVERSATION_UPDATE");
        wsEvent.put("conversation", updatedDto);

        List<Integer> allMembers = participantRepository.findMembersJoinConversation(conversationId);
        for (Integer memberId : allMembers) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(memberId),
                    "/queue/messages",
                    wsEvent
            );
        }

        return updatedDto;
    }

    @Transactional
    public void removeMemberFromGroup(Integer currentUserId, Integer conversationId, Integer targetUserId) {
        Participant currentPart = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không thuộc nhóm này"));

        if (currentPart.getGroupRole() == null || currentPart.getGroupRole().getCode() != GroupRoleType.GROUP_ADMIN) {
            throw new AccessDeniedException("Chỉ trưởng nhóm mới có quyền xóa thành viên");
        }

        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Không thể tự xóa chính mình, hãy dùng chức năng rời nhóm");
        }

        participantRepository.deleteByConversationIdAndUserId(conversationId, targetUserId);

        Map<String, Object> kickedEvent = new LinkedHashMap<>();
        kickedEvent.put("type", "CONVERSATION_DELETE");
        kickedEvent.put("conversationId", conversationId);
        messagingTemplate.convertAndSendToUser(
                String.valueOf(targetUserId),
                "/queue/messages",
                kickedEvent
        );

        Conversation conversation = conversionRepository.findById(conversationId).orElse(null);
        if (conversation != null) {
            conversation.setUpdatedAt(LocalDateTime.now());
            conversionRepository.save(conversation);
            ConversationResponseDTO updatedDto = buildGroupConversationResponse(conversation, currentUserId);

            Map<String, Object> wsEvent = new LinkedHashMap<>();
            wsEvent.put("type", "CONVERSATION_UPDATE");
            wsEvent.put("conversation", updatedDto);

            List<Integer> remainingMembers = participantRepository.findMembersJoinConversation(conversationId);
            for (Integer memberId : remainingMembers) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(memberId),
                        "/queue/messages",
                        wsEvent
                );
            }
        }
    }

    @Transactional
    public void leaveGroup(Integer currentUserId, Integer conversationId) {
        Participant participant = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không thuộc nhóm này"));

        participantRepository.delete(participant);

        Map<String, Object> selfEvent = new LinkedHashMap<>();
        selfEvent.put("type", "CONVERSATION_DELETE");
        selfEvent.put("conversationId", conversationId);
        messagingTemplate.convertAndSendToUser(
                String.valueOf(currentUserId),
                "/queue/messages",
                selfEvent
        );

        List<Integer> remainingMembers = participantRepository.findMembersJoinConversation(conversationId);
        if (remainingMembers == null || remainingMembers.isEmpty()) {
            conversionRepository.deleteById(conversationId);
            return;
        }

        if (participant.getGroupRole() != null && participant.getGroupRole().getCode() == GroupRoleType.GROUP_ADMIN) {
            Integer nextAdminId = remainingMembers.get(0);
            Participant nextAdminPart = participantRepository.findByConversationIdAndUserId(conversationId, nextAdminId).orElse(null);
            if (nextAdminPart != null) {
                GroupRole adminRole = groupRoleRepository.findByCode(GroupRoleType.GROUP_ADMIN).orElse(null);
                nextAdminPart.setGroupRole(adminRole);
                participantRepository.save(nextAdminPart);
            }
        }

        Conversation conversation = conversionRepository.findById(conversationId).orElse(null);
        if (conversation != null) {
            conversation.setUpdatedAt(LocalDateTime.now());
            conversionRepository.save(conversation);
            ConversationResponseDTO updatedDto = buildGroupConversationResponse(conversation, remainingMembers.get(0));

            Map<String, Object> wsEvent = new LinkedHashMap<>();
            wsEvent.put("type", "CONVERSATION_UPDATE");
            wsEvent.put("conversation", updatedDto);

            for (Integer memberId : remainingMembers) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(memberId),
                        "/queue/messages",
                        wsEvent
                );
            }
        }
    }

    @Transactional
    public void deleteConversation(Integer currentUserId, Integer conversationId) {
        Conversation conversation = conversionRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Cuộc trò chuyện không tồn tại"));

        List<Integer> memberIds = participantRepository.findMembersJoinConversation(conversationId);
        if (memberIds == null || !memberIds.contains(currentUserId)) {
            throw new AccessDeniedException("Bạn không thuộc cuộc trò chuyện này");
        }

        if (conversation.getConversationType() == ConversationType.GROUP) {
            Participant part = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId).orElse(null);
            if (part == null || part.getGroupRole() == null || part.getGroupRole().getCode() != GroupRoleType.GROUP_ADMIN) {
                throw new AccessDeniedException("Chỉ trưởng nhóm mới có quyền xóa/giải tán nhóm");
            }
        }

        conversionRepository.deleteById(conversationId);

        Map<String, Object> wsEvent = new LinkedHashMap<>();
        wsEvent.put("type", "CONVERSATION_DELETE");
        wsEvent.put("conversationId", conversationId);

        for (Integer memberId : memberIds) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(memberId),
                    "/queue/messages",
                    wsEvent
            );
        }
    }

    private ConversationResponseDTO buildGroupConversationResponse(Conversation conversation, Integer viewerId) {
        List<Participant> participants = participantRepository.findByConversationIdWithUserAndRole(conversation.getId());
        List<GroupMemberResponseDTO> memberDtos = new ArrayList<>();
        GroupRoleType viewerRole = null;

        for (Participant p : participants) {
            User u = p.getUser();
            GroupRoleType role = p.getGroupRole() != null ? p.getGroupRole().getCode() : GroupRoleType.GROUP_MEMBER;
            if (u.getId().equals(viewerId)) {
                viewerRole = role;
            }
            memberDtos.add(new GroupMemberResponseDTO(
                    u.getId(),
                    u.getEmail(),
                    u.getDisplayName(),
                    u.getAvatarUrl(),
                    role,
                    p.getJoinedAt(),
                    u.getPublicKey()
            ));
        }

        Optional<Message> lastMessageOpt = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId());
        String lastMessage = null;
        LocalDateTime updatedAt = conversation.getUpdatedAt() != null ? conversation.getUpdatedAt() : conversation.getCreatedAt();

        if (lastMessageOpt.isPresent()) {
            lastMessage = lastMessageOpt.get().getDeletedAt() != null ? "Tin nhắn đã bị thu hồi" : lastMessageOpt.get().getContent();
            updatedAt = lastMessageOpt.get().getCreatedAt();
        }

        ConversationResponseDTO dto = new ConversationResponseDTO();
        dto.setId(conversation.getId());
        dto.setType(ConversationType.GROUP);
        dto.setName(conversation.getName());
        dto.setAvatarUrl(conversation.getAvatarUrl());
        dto.setOtherUser(null);
        dto.setMembers(memberDtos);
        dto.setCurrentUserRole(viewerRole);
        dto.setLastMessage(lastMessage);
        dto.setUpdatedAt(updatedAt);

        return dto;
    }
}
