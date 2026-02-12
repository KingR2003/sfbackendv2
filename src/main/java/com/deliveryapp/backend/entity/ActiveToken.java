package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "active_tokens")
public class ActiveToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "token_id")
    private Long tokenId;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public ActiveToken() {
    }
}
