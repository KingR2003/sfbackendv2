package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    @NotBlank(message = "Discount type is required (FIXED or PERCENTAGE)")
    private String discountType;

    @NotNull(message = "Discount value is required")
    @Positive(message = "Discount value must be positive")
    private BigDecimal discountValue;

    private BigDecimal minOrderAmount;

    private BigDecimal maxDiscountAmount;

    /** Start of the coupon validity date range (inclusive). */
    private LocalDate startDate;

    /** End of the coupon validity date range (inclusive). */
    private LocalDate expireDate;

    private Integer usageLimitPerUser;

    private String daysOfWeek;

    /** Daily time window start – e.g. 15:00 for 3 PM. */
    private LocalTime startTime;

    /** Daily time window end – e.g. 19:00 for 7 PM. */
    private LocalTime endTime;

    private String platform;

    private Boolean isActive = true;
}

