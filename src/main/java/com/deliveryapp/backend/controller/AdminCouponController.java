package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.CouponRequest;
import com.deliveryapp.backend.entity.Coupon;
import com.deliveryapp.backend.service.CouponService;
import jakarta.validation.Valid;
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
    public ResponseEntity<ApiResponse<Coupon>> createCoupon(@Valid @RequestBody CouponRequest request) {
        Coupon coupon = couponService.createCoupon(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(201, "Coupon created successfully", coupon));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Coupon>>> getAllCoupons() {
        return ResponseEntity.ok(new ApiResponse<>(200, "All coupons retrieved", couponService.getAllCoupons()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Coupon>> getCouponById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(200, "Coupon retrieved", couponService.getCouponById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Coupon>> updateCoupon(@PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        Coupon updatedCoupon = couponService.updateCoupon(id, request);
        return ResponseEntity.ok(new ApiResponse<>(200, "Coupon updated successfully", updatedCoupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(new ApiResponse<>(200, "Coupon deleted successfully"));
    }
}
