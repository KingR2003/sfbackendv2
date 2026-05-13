package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "banner_interactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "banner_id", nullable = false)
    private Long bannerId;

    @Column(name = "user_id")
    private Long userId; // Can be null for guest users

    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_type", nullable = false)
    private InteractionType interactionType; // VIEW, CLICK

    @Column(name = "platform")
    private String platform; // MOBILE_APP, WEBSITE

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum InteractionType {
        VIEW, CLICK
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
