package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);

    Optional<CartItem> findByUserIdAndVariantId(Long userId, Long variantId);

    void deleteByUserId(Long userId);

    void deleteByUserIdAndVariantId(Long userId, Long variantId);
}
