package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.ModulePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModulePermissionRepository extends JpaRepository<ModulePermission, Long> {
    List<ModulePermission> findByUserId(Long userId);
    Optional<ModulePermission> findByUserIdAndModuleId(Long userId, Long moduleId);
}
