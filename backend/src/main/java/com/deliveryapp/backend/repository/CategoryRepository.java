package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByStatus(String status);
    Optional<Category> findByIdAndStatus(Long id, String status);
    // User-side: only visible (isActive=true) and non-deleted
    List<Category> findByStatusAndIsActive(String status, Boolean isActive);
    Optional<Category> findByIdAndStatusAndIsActive(Long id, String status, Boolean isActive);
}
