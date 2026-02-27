package com.deliveryapp.backend.service;

import com.deliveryapp.backend.entity.Coupon;
import java.math.BigDecimal;
import java.util.List;

public interface CouponService {
    List<Coupon> getActiveCoupons();

    Coupon verifyCoupon(String code, Long userId, BigDecimal orderAmount);
}
