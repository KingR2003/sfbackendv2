package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.RatingRequest;
import com.deliveryapp.backend.dto.RatingSummaryResponse;

import java.util.Optional;

public interface RatingService {

    /** Submit or update a rating. Returns the saved rating value. */
    int submitOrUpdateRating(Long userId, RatingRequest request);

    /** Get the average rating summary for a product. */
    RatingSummaryResponse getRatingSummary(Long productId);

    /** Get the logged-in user's own rating for a product. */
    Optional<Integer> getUserRating(Long userId, Long productId);

    /** Remove the logged-in user's rating for a product. */
    void deleteRating(Long userId, Long productId);
}
