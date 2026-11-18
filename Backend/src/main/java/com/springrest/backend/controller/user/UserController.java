// Controller REST API quản lý thông tin người dùng: tìm kiếm, cập nhật khóa công khai E2EE và tải lên ảnh đại diện
package com.springrest.backend.controller.user;

import com.springrest.backend.dto.apiresponse.ApiResponse;
import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.dto.chat.request.UpdatePublicKeyRequest;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.UserRepository;
import com.springrest.backend.service.upload.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            String currentUserIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
            Integer currentUserId = Integer.parseInt(currentUserIdStr);

            User user = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + currentUserId));

            String avatarUrl = cloudinaryService.uploadAvatar(file, "teamsync/avatars");
            user.setAvatarUrl(avatarUrl);
            user.setUpdatedAt(LocalDateTime.now());
            User saved = userRepository.save(user);

            UserResponseDTO response = new UserResponseDTO(
                    saved.getId(),
                    saved.getEmail(),
                    saved.getDisplayName(),
                    saved.getAvatarUrl(),
                    saved.getStatus(),
                    saved.getPublicKey()
            );

            return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật ảnh đại diện thành công", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "Lỗi tải ảnh: " + e.getMessage(), null));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponseDTO>> searchUsers(@RequestParam("q") String keyword) {
        try{
            String currentUserIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
            Integer currentUserId = Integer.parseInt(currentUserIdStr);

            System.out.println(currentUserId);

            List<User> users = userRepository.searchUsers(keyword, currentUserId);

            List<UserResponseDTO> response = users.stream().map(u -> new UserResponseDTO(u.getId(),u.getEmail()
                    ,u.getDisplayName(),u.getAvatarUrl(),u.getStatus(),u.getPublicKey())).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        }catch(Exception e){
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error occur when searching: " + e.getMessage());
            return ResponseEntity.internalServerError().body((List<UserResponseDTO>) errorResponse);
        }
    }

    @PutMapping("/public-key")
    public ResponseEntity<?> updatePublicKey(@RequestBody UpdatePublicKeyRequest request) {
        try{
            if (request == null || request.getPublicKey() == null || request.getPublicKey().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "publicKey is required", null));
            }

            String currentUserIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
            Integer currentUserId = Integer.parseInt(currentUserIdStr);

            User user = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + currentUserId));

            user.setPublicKey(request.getPublicKey().trim());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse<>(true, "Public key updated successfully", null));
        }catch (Exception e){
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "Error updating public key: " + e.getMessage(), null));
        }
    }

    @GetMapping("{userId}/public-key")
    public ResponseEntity<?> getUserPublicKey(@PathVariable("userId") Integer userId) {
        try {
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("publicKey", user.getPublicKey());
            return ResponseEntity.ok(new ApiResponse<>(true, "Get public key successfully", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
