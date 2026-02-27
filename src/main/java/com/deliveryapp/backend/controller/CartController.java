package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.CartItemRequest;
import com.deliveryapp.backend.dto.CartResponse;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        Long userId = getAuthenticatedUserId();
        CartResponse cart = cartService.getCart(userId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Cart retrieved successfully", cart));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<String>> addToCart(@Valid @RequestBody CartItemRequest request) {
        Long userId = getAuthenticatedUserId();
        cartService.addToCart(userId, request);
        return ResponseEntity.ok(new ApiResponse<>(200, "Item updated in cart"));
    }

    @DeleteMapping("/{variantId}")
    public ResponseEntity<ApiResponse<String>> removeFromCart(@PathVariable Long variantId) {
        Long userId = getAuthenticatedUserId();
        cartService.removeFromCart(userId, variantId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Item removed from cart"));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<String>> clearCart() {
        Long userId = getAuthenticatedUserId();
        cartService.clearCart(userId);
        return ResponseEntity.ok(new ApiResponse<>(200, "Cart cleared successfully"));
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        String username = authentication.getName(); // email or mobile
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByMobile(username)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User not found with identifier: " + username)));
        return user.getId();
    }
}
