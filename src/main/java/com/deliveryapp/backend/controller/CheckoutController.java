package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.CheckoutRequest;
import com.deliveryapp.backend.entity.OrderEntity;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/checkout")
public class CheckoutController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Object> checkout(@Valid @RequestBody CheckoutRequest request) {
        Long userId = getAuthenticatedUserId();
        try {
            OrderEntity order = orderService.checkout(userId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.CREATED.value());
            response.put("message", "Order placed successfully");
            response.put("order", order);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            // Check if message looks like coupon failure or stock failure
            // But user specifically asked for 402 on coupon.
            // Let's use 402 for all validation failures here to be safe and consistent with
            // request
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body(new ApiResponse(HttpStatus.PAYMENT_REQUIRED.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "Placement failed: " + e.getMessage()));
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
