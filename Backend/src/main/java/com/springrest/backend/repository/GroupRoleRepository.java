// src/main/java/com/springrest/backend/repository/GroupRoleRepository.java
package com.springrest.backend.repository;

import com.springrest.backend.entity.Enum.GroupRoleType;
import com.springrest.backend.entity.GroupRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupRoleRepository extends JpaRepository<GroupRole, Integer> {
    Optional<GroupRole> findByCode(GroupRoleType code);
}
