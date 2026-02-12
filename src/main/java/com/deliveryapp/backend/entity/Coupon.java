package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;

    @Column(name = "discount_type")
    private String discountType;

    @Column(name = "discount_value")
    private BigDecimal discountValue;

    @Column(name = "min_order_amount")
    private BigDecimal minOrderAmount;

    @Column(name = "max_discount_amount")
    private BigDecimal maxDiscountAmount;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Coupon() {
    }
}
