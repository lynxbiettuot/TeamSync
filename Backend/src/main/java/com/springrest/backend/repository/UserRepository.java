package com.springrest.backend.repository;

import com.springrest.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface UserRepository extends Repository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
