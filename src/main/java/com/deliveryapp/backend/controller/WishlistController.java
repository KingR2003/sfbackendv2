package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.WishlistResponse;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.ResourceNotFoundException;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private UserRepository userRepository;

    /** GET /api/v1/wishlist — get authenticated user's wishlist */
    @GetMapping
    public ResponseEntity<Object> getWishlist() {
        Long userId = getAuthenticatedUserId();
        List<WishlistResponse> items = wishlistService.getWishlist(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", 200);
        response.put("message", "Wishlist retrieved successfully");
        response.put("wishlist", items);
        response.put("count", items.size());
        return ResponseEntity.ok(response);
    }

    /** POST /api/v1/wishlist/add/{productId} — add product to wishlist */
    @PostMapping("/add/{productId}")
    public ResponseEntity<ApiResponse> addToWishlist(@PathVariable Long productId) {
        Long userId = getAuthenticatedUserId();
        wishlistService.addToWishlist(userId, productId);
        return ResponseEntity.ok(new ApiResponse(200, "Product added to wishlist"));
    }

    /** DELETE /api/v1/wishlist/{productId} — remove product from wishlist */
    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse> removeFromWishlist(@PathVariable Long productId) {
        Long userId = getAuthenticatedUserId();
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.ok(new ApiResponse(200, "Product removed from wishlist"));
    }

    /** DELETE /api/v1/wishlist/clear — clear entire wishlist */
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse> clearWishlist() {
        Long userId = getAuthenticatedUserId();
        wishlistService.clearWishlist(userId);
        return ResponseEntity.ok(new ApiResponse(200, "Wishlist cleared successfully"));
    }

    /** GET /api/v1/wishlist/check/{productId} — check if product is wishlisted */
    @GetMapping("/check/{productId}")
    public ResponseEntity<Object> checkWishlist(@PathVariable Long productId) {
        Long userId = getAuthenticatedUserId();
        boolean wishlisted = wishlistService.isProductWishlisted(userId, productId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", 200);
        response.put("productId", productId);
        response.put("wishlisted", wishlisted);
        return ResponseEntity.ok(response);
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        String username = authentication.getName();
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByMobile(username)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "User not found with identifier: " + username)));
        return user.getId();
    }
}
