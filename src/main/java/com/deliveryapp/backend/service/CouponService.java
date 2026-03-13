package com.deliveryapp.backend.service;

import com.deliveryapp.backend.entity.Coupon;
import java.util.List;

public interface CouponService {
    List<Coupon> getActiveCoupons();
    List<Coupon> getActiveCouponsByPlatform(String platform);

    Coupon verifyCoupon(String code, Long userId, java.math.BigDecimal orderAmount);

    java.util.Optional<Coupon> findByCode(String code);

    // Admin CRUD operations
    Coupon createCoupon(com.deliveryapp.backend.dto.CouponRequest request);

    List<Coupon> getAllCoupons();

    Coupon getCouponById(Long id);

    Coupon updateCoupon(Long id, com.deliveryapp.backend.dto.CouponRequest request);

    void deleteCoupon(Long id);
}
