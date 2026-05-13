package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    @Query("SELECT SUM(o.finalAmount) FROM OrderEntity o WHERE o.orderStatus = 'DELIVERED'")
    BigDecimal calculateTotalRevenue();

    List<OrderEntity> findByUserId(Long userId);

    List<OrderEntity> findByCreatedAtAfter(java.time.LocalDateTime date);

    /**
     * Check if a user has at least one order containing a variant of the given product.
     * Joins orders → order_items → product_variants to trace the product.
     */
    @Query("""
        SELECT COUNT(o) > 0 FROM OrderEntity o
        JOIN OrderItem oi ON oi.orderId = o.id
        JOIN ProductVariant pv ON pv.id = oi.variantId
        WHERE o.userId = :userId
        AND pv.productId = :productId
        """)
    boolean hasUserOrderedProduct(@Param("userId") Long userId, @Param("productId") Long productId);
}
