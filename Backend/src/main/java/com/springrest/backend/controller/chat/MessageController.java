// Controller REST API quản lý tin nhắn hội thoại: lấy lịch sử tin nhắn, tải lên tệp/ảnh, chỉnh sửa và thu hồi tin nhắn
package com.springrest.backend.controller.chat;

import com.springrest.backend.dto.chat.request.EditMessageRequest;
import com.springrest.backend.dto.chat.response.ChatMessageResponse;
import com.springrest.backend.service.chat.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageController {
    private final MessageService messageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAttachment(
            @RequestParam("conversationId") Integer conversationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "replyToMessageId", required = false) Integer replyToMessageId
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Integer currentUserId = Integer.parseInt(auth.getName());

        try {
            ChatMessageResponse response = messageService.sendAttachmentMessage(
                    currentUserId,
                    conversationId,
                    content,
                    file,
                    replyToMessageId
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | AccessDeniedException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi tải tệp: " + e.getMessage()));
        }
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> getMessagesByConversationId(@PathVariable Integer conversationId) {
        if(conversationId == null) {
            throw new IllegalArgumentException("conversationId is required");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assert auth != null;
        Integer currentUserId = Integer.parseInt(auth.getName());

        if(currentUserId == null) {
            throw new IllegalArgumentException("You are not allowed in this conversation, userId not found");
        }

        List<Integer> listUser = messageService.findListMembersJoinConversation(conversationId);

        if(listUser == null || listUser.isEmpty()) {
            throw new IllegalArgumentException("Conversation not found");
        }

        if(!listUser.contains(currentUserId)) {
            throw new IllegalArgumentException("You are not allowed in this conversation");
        }

        try {
            List<ChatMessageResponse> responseData = messageService.getMessagesByConversationId(conversationId);
            return ResponseEntity.ok(responseData);
        }catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<?> editMessage(
            @PathVariable Integer messageId,
            @RequestBody EditMessageRequest request
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Integer currentUserId = Integer.parseInt(auth.getName());

        try {
            ChatMessageResponse response = messageService.editMessage(currentUserId, messageId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Integer messageId,
            @RequestParam(required = false) Integer receiverId
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Integer currentUserId = Integer.parseInt(auth.getName());

        try {
            messageService.deleteMessage(currentUserId, messageId, receiverId);
            return ResponseEntity.ok(Map.of("message", "Đã thu hồi tin nhắn thành công", "messageId", messageId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
