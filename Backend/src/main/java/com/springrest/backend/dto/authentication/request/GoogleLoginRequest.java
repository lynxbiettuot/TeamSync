// DTO chứa Google idToken gửi từ Frontend để đăng nhập OAuth2
package com.springrest.backend.dto.authentication.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequest {
    private String idToken;
}
