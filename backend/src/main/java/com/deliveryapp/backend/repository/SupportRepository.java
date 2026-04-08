package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.Support;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportRepository extends JpaRepository<Support, Long> {
    List<Support> findByEmail(String email);
    Support findByTicketId(String ticketId);
}
