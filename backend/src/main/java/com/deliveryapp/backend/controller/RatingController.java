package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.RatingRequest;
import com.deliveryapp.backend.dto.RatingSummaryResponse;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Handles product ratings (1–5 stars) submitted by authenticated customers.
 * Ratings are per-product with optional variant reference.
 */
@RestController
@RequestMapping("/api/v1/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private UserRepository userRepository;

    // ---------------------------------------------------------------
    // POST /api/v1/ratings
    // Submit or update a rating for a product (authenticated)
    // ---------------------------------------------------------------
    @PostMapping
    public ResponseEntity<Object> submitRating(@Valid @RequestBody RatingRequest request) {
        try {
            Long userId = getAuthenticatedUserId();
            int savedRating = ratingService.submitOrUpdateRating(userId, request);

            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "Rating submitted successfully");
            response.put("productId", request.getProductId());
            response.put("variantId", request.getVariantId());
            response.put("rating", savedRating);
            return ResponseEntity.ok(response);

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(403, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(400, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
        }
    }

    // ---------------------------------------------------------------
    // GET /api/v1/ratings/product/{productId}
    // Get average rating + distribution for a product (public)
    // ---------------------------------------------------------------
    @GetMapping("/product/{productId}")
    public ResponseEntity<Object> getProductRatingSummary(@PathVariable Long productId) {
        try {
            RatingSummaryResponse summary = ratingService.getRatingSummary(productId);

            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("data", summary);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(404, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
        }
    }

    // ---------------------------------------------------------------
    // GET /api/v1/ratings/product/{productId}/mine
    // Get the logged-in user's own rating for a product (authenticated)
    // ---------------------------------------------------------------
    @GetMapping("/product/{productId}/mine")
    public ResponseEntity<Object> getMyRating(@PathVariable Long productId) {
        try {
            Long userId = getAuthenticatedUserId();
            Optional<Integer> rating = ratingService.getUserRating(userId, productId);

            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("productId", productId);
            if (rating.isPresent()) {
                response.put("rating", rating.get());
                response.put("rated", true);
            } else {
                response.put("rating", null);
                response.put("rated", false);
            }
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
        }
    }

    // ---------------------------------------------------------------
    // DELETE /api/v1/ratings/product/{productId}
    // Remove the logged-in user's rating for a product (authenticated)
    // ---------------------------------------------------------------
    @DeleteMapping("/product/{productId}")
    public ResponseEntity<Object> deleteMyRating(@PathVariable Long productId) {
        try {
            Long userId = getAuthenticatedUserId();
            ratingService.deleteRating(userId, productId);
            return ResponseEntity.ok(new ApiResponse(200, "Rating removed successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
        }
    }

    /** Resolves the currently authenticated user's DB id from their JWT. */
    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String identifier = auth.getName();
        User user = userRepository.findByMobile(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        return user.getId();
    }
}
