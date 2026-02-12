package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_history")
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "variant_id")
    private Long variantId;

    private BigDecimal price;

    @Column(name = "changed_by")
    private Long changedBy;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    public PriceHistory() {
    }
}
