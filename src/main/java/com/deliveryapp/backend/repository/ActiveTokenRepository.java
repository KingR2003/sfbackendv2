package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.ActiveToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActiveTokenRepository extends JpaRepository<ActiveToken, Long> {
}
