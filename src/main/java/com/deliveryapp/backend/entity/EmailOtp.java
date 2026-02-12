package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_otp")
public class EmailOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private String email;

    @Column(name = "otp_code")
    private String otpCode;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_used")
    private Boolean isUsed;

    @Column(name = "attempt_count")
    private Integer attemptCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public EmailOtp() {
    }
}
