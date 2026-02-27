package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.entity.Coupon;
import com.deliveryapp.backend.entity.CouponUsage;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.CouponRepository;
import com.deliveryapp.backend.repository.CouponUsageRepository;
import com.deliveryapp.backend.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponServiceImpl implements CouponService {

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private CouponUsageRepository couponUsageRepository;

    @Override
    public List<Coupon> getActiveCoupons() {
        return couponRepository.findByIsActiveTrue();
    }

    @Override
    public Coupon verifyCoupon(String code, Long userId, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid coupon code: " + code));

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            throw new IllegalArgumentException("Coupon " + code + " is not active");
        }

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Coupon " + code + " has expired");
        }

        if (coupon.getMinOrderAmount() != null && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException(
                    "Minimum order amount for coupon " + code + " is " + coupon.getMinOrderAmount());
        }

        if (coupon.getUsageLimitPerUser() != null) {
            CouponUsage usage = couponUsageRepository.findByCouponIdAndUserId(coupon.getId(), userId)
                    .orElse(new CouponUsage(null, coupon.getId(), userId, 0));
            if (usage.getUsageCount() >= coupon.getUsageLimitPerUser()) {
                throw new IllegalArgumentException("Usage limit reached for coupon " + code);
            }
        }

        return coupon;
    }

    @Override
    public Coupon createCoupon(com.deliveryapp.backend.dto.CouponRequest request) {
        Coupon coupon = new Coupon();
        return updateCouponFromRequest(coupon, request);
    }

    @Override
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @Override
    public Coupon getCouponById(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
    }

    @Override
    public Coupon updateCoupon(Long id, com.deliveryapp.backend.dto.CouponRequest request) {
        Coupon coupon = getCouponById(id);
        return updateCouponFromRequest(coupon, request);
    }

    @Override
    public void deleteCoupon(Long id) {
        if (!couponRepository.existsById(id)) {
            throw new ResourceNotFoundException("Coupon not found with id: " + id);
        }
        couponRepository.deleteById(id);
    }

    private Coupon updateCouponFromRequest(Coupon coupon, com.deliveryapp.backend.dto.CouponRequest request) {
        coupon.setCode(request.getCode());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setExpiryDate(request.getExpiryDate());
        coupon.setUsageLimitPerUser(request.getUsageLimitPerUser());
        coupon.setIsActive(request.getIsActive());

        if (coupon.getCreatedAt() == null) {
            coupon.setCreatedAt(LocalDateTime.now());
        }

        return couponRepository.save(coupon);
    }
}
