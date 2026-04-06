package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.entity.Coupon;
import com.deliveryapp.backend.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/coupons")
public class AdminCouponController {

    @Autowired
    private CouponService couponService;

    @PostMapping
    public ResponseEntity<Object> createCoupon(@RequestBody com.deliveryapp.backend.dto.CouponRequest couponRequest) {
        try {
            Coupon created = couponService.createCoupon(couponRequest);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("status", HttpStatus.CREATED.value());
            response.put("message", "Coupon created successfully");
            response.put("coupon", created);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Error: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<Object> getAllCoupons() {
        List<Coupon> coupons = couponService.getAllCoupons();
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Coupons retrieved successfully");
        response.put("coupons", coupons);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getCouponById(@PathVariable Long id) {
        Coupon coupon = couponService.getCouponById(id);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Coupon found");
        response.put("coupon", coupon);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateCoupon(@PathVariable Long id,
            @RequestBody com.deliveryapp.backend.dto.CouponRequest couponRequest) {
        Coupon updated = couponService.updateCoupon(id, couponRequest);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Coupon updated successfully");
        response.put("coupon", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "Coupon deleted successfully"));
    }
}
