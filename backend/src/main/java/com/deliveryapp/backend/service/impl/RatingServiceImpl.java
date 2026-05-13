package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.RatingRequest;
import com.deliveryapp.backend.dto.RatingSummaryResponse;
import com.deliveryapp.backend.entity.Product;
import com.deliveryapp.backend.entity.ProductRating;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.OrderRepository;
import com.deliveryapp.backend.repository.ProductRatingRepository;
import com.deliveryapp.backend.repository.ProductRepository;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.service.RatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RatingServiceImpl implements RatingService {

    @Autowired
    private ProductRatingRepository ratingRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    public int submitOrUpdateRating(Long userId, RatingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));

        // Enforce: only users who have ordered this product can rate it
        boolean hasPurchased = orderRepository.hasUserOrderedProduct(userId, request.getProductId());
        if (!hasPurchased) {
            throw new SecurityException("You can only rate products you have ordered.");
        }

        Optional<ProductRating> existing = ratingRepository.findByUserIdAndProductId(userId, request.getProductId());

        ProductRating ratingEntity = existing.orElseGet(ProductRating::new);
        ratingEntity.setUser(user);
        ratingEntity.setProduct(product);
        ratingEntity.setVariantId(request.getVariantId());
        ratingEntity.setRating(request.getRating());

        ratingRepository.save(ratingEntity);
        return request.getRating();
    }

    @Override
    public RatingSummaryResponse getRatingSummary(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Product not found with id: " + productId);
        }

        Double avg = ratingRepository.findAverageRatingByProductId(productId);
        long total = ratingRepository.countByProductId(productId);

        // Build distribution map: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);

        List<Object[]> rawDist = ratingRepository.findRatingDistributionByProductId(productId);
        for (Object[] row : rawDist) {
            Integer star = (Integer) row[0];
            Long count = (Long) row[1];
            distribution.put(star, count);
        }

        // Round average to 1 decimal
        double rounded = Math.round(avg * 10.0) / 10.0;

        return new RatingSummaryResponse(productId, rounded, total, distribution);
    }

    @Override
    public Optional<Integer> getUserRating(Long userId, Long productId) {
        return ratingRepository.findByUserIdAndProductId(userId, productId)
                .map(ProductRating::getRating);
    }

    @Override
    public void deleteRating(Long userId, Long productId) {
        ratingRepository.deleteByUserIdAndProductId(userId, productId);
    }
}
