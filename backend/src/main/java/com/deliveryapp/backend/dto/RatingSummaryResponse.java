package com.deliveryapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatingSummaryResponse {

    private Long productId;

    /** Rounded to 1 decimal place, e.g. 4.3 */
    private Double averageRating;

    private Long totalRatings;

    /** How many rated 1, 2, 3, 4, 5 stars */
    private Map<Integer, Long> distribution;
}
