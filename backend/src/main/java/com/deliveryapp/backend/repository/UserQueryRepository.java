package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.UserQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserQueryRepository extends JpaRepository<UserQuery, Long> {
}
