package com.springrest.backend.repository;

import com.springrest.backend.entity.User;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query(value = "SELECT * FROM users u WHERE (u.display_name LIKE %:keyword% OR u.email LIKE %:keyword%) AND u.id != :currentUserId", nativeQuery = true)
    List<User> searchUsers(@Param("keyword") String keyword, @Param("currentUserId") Integer currentUserId);
}
