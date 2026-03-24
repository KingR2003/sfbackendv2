package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

    /** The date-time from which the coupon becomes valid. */
    @Column(name = "start_date")
    private LocalDateTime startDate;

    /** The date-time at which the coupon expires. */
    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser;

    @Column(name = "days_of_week")
    private String daysOfWeek; // e.g., "MONDAY,TUESDAY"

    /** Daily window start – e.g. 15:00 for 3 PM. Coupon is only usable after this time each day. */
    @Column(name = "start_time")
    private java.time.LocalTime startTime;

    /** Daily window end – e.g. 19:00 for 7 PM. Coupon expires after this time each day. */
    @Column(name = "end_time")
    private java.time.LocalTime endTime;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "platform")
    private String platform; // e.g., "MOBILE_APP", "WEBSITE", "BOTH"

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    private String status = "active";

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "active";
        }
    }
}
