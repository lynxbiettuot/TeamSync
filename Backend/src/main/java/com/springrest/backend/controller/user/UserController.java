package com.springrest.backend.controller.user;

import com.springrest.backend.dto.apiresponse.ApiResponse;
import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.dto.chat.request.UpdatePublicKeyRequest;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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

    //update public key if user change device
    @PutMapping("/public-key")
    public ResponseEntity<?> updatePublicKey(@RequestBody UpdatePublicKeyRequest request) {
        try{
            if (request == null || request.getPublicKey() == null || request.getPublicKey().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "publicKey is required", null));
            }

            //get user id from jwt
            String currentUserIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
            Integer currentUserId = Integer.parseInt(currentUserIdStr);

            User user = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + currentUserId));

            user.setPublicKey(request.getPublicKey().trim());//set public key for each user send from front end
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse<>(true, "Public key updated successfully", null));
        }catch (Exception e){
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "Error updating public key: " + e.getMessage(), null));
        }
    }

    //get public key by userId
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
