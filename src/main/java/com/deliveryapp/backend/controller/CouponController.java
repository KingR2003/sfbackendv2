package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.Coupon;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/coupons")
public class CouponController {

    @Autowired
    private CouponService couponService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Object> getAvailableCoupons() {
        List<Coupon> coupons = couponService.getAllCoupons().stream()
                .filter(Coupon::getIsActive)
                .toList();
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", 200);
        response.put("message", "Available coupons retrieved");
        response.put("coupons", coupons);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{code}")
    public ResponseEntity<Object> getCouponByCode(@PathVariable String code) {
        Optional<Coupon> couponOpt = couponService.findByCode(code);
        if (couponOpt.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "Coupon details retrieved");
            response.put("coupon", couponOpt.get());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(404, "Coupon not found"));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Object> verifyCoupon(
            @RequestBody com.deliveryapp.backend.dto.CouponVerificationRequest request) {
        try {
            Long userId = getAuthenticatedUserId();
            Coupon coupon = couponService.verifyCoupon(request.getCode(), userId, request.getOrderAmount());
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Coupon is valid");
            response.put("coupon", coupon);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body(new ApiResponse(HttpStatus.PAYMENT_REQUIRED.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Error: " + e.getMessage()));
        }
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        String username = authentication.getName();
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByMobile(username)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User not found with identifier: " + username)));
        return user.getId();
    }
}
