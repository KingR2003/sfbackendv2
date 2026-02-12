package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tokens")
public class Token {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "access_token")
    private String accessToken;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Token() {
    }
}
