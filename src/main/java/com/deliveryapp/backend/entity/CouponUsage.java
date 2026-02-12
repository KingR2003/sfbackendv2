package com.deliveryapp.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "coupon_usage")
public class CouponUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coupon_id")
    private Long couponId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "usage_count")
    private Integer usageCount;

    public CouponUsage() {
    }
}
