package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.UserQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserQueryRepository extends JpaRepository<UserQuery, Long> {
    List<UserQuery> findAllByOrderByCreatedAtDesc();
}
