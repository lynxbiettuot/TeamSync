package com.springrest.backend.controller.user;

import com.springrest.backend.dto.authentication.response.UserResponseDTO;
import com.springrest.backend.entity.User;
import com.springrest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
                    ,u.getDisplayName(),u.getAvatarUrl(),u.getStatus())).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        }catch(Exception e){
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error occur when searching: " + e.getMessage());
            return ResponseEntity.internalServerError().body((List<UserResponseDTO>) errorResponse);
        }
    }
}
