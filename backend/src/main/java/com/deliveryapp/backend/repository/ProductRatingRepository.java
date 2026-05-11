package com.deliveryapp.backend.repository;

import com.deliveryapp.backend.entity.ProductRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;

@Repository
public interface ProductRatingRepository extends JpaRepository<ProductRating, Long> {

    /** Find a user's rating for a specific product. */
    Optional<ProductRating> findByUserIdAndProductId(Long userId, Long productId);

    /** Get all ratings for a product. */
    List<ProductRating> findByProductId(Long productId);

    /** Count total ratings for a product. */
    long countByProductId(Long productId);

    /** Calculate average rating for a product. */
    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM ProductRating r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    /** Count ratings per star value for a product (for distribution). */
    @Query("SELECT r.rating, COUNT(r) FROM ProductRating r WHERE r.product.id = :productId GROUP BY r.rating")
    List<Object[]> findRatingDistributionByProductId(@Param("productId") Long productId);

    /** Delete a user's rating for a product. */
    @Transactional
    void deleteByUserIdAndProductId(Long userId, Long productId);
}
