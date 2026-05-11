package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "product_ratings",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class ProductRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who submitted the rating. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The product being rated. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * The specific variant the user purchased/rated (optional).
     * Stored as a plain Long so we don't need a hard FK join every time.
     */
    @Column(name = "variant_id")
    private Long variantId;

    /** Star rating: 1 to 5. */
    @Column(nullable = false)
    private Integer rating;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
