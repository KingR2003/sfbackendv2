package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.EmailChangeToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, Long> {

    Optional<EmailChangeToken> findByToken(String token);

    /** Delete any existing pending email change for this user before creating a new one. */
    @Transactional
    void deleteByUserId(Long userId);
}
