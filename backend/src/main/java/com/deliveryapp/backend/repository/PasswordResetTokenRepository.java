package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    /** Delete all existing tokens for a user before creating a new one. */
    @Transactional
    void deleteByUserId(Long userId);
}
