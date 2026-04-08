package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {

    List<WishlistItem> findByUserId(Long userId);

    Optional<WishlistItem> findByUserIdAndProductIdAndVariantId(Long userId, Long productId, Long variantId);

    boolean existsByUserIdAndProductIdAndVariantId(Long userId, Long productId, Long variantId);

    void deleteByUserIdAndProductIdAndVariantId(Long userId, Long productId, Long variantId);

    void deleteAllByUserId(Long userId);
}
