package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findBySupportIdOrderByCreatedAtAsc(Long supportId);
}
