package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.ActiveToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ActiveTokenRepository extends JpaRepository<ActiveToken, Long> {
    Optional<ActiveToken> findByTokenIdAndIsActive(Long tokenId, Boolean isActive);
    List<ActiveToken> findByUserIdAndIsActive(Long userId, Boolean isActive);
}
