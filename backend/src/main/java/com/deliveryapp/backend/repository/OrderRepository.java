package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    
    @Query("SELECT SUM(o.finalAmount) FROM OrderEntity o WHERE o.orderStatus = 'DELIVERED'")
    BigDecimal calculateTotalRevenue();

    List<OrderEntity> findByUserId(Long userId);
}
