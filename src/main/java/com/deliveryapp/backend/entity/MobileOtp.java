package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Stores mobile OTP records for customer authentication.
 * Each send-otp request creates a new record.
 */
@Entity
@Table(name = "mobile_otp")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MobileOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mobile number in E.164 format, e.g. +919876543210 */
    @Column(name = "mobile_number", nullable = false, length = 20)
    private String mobileNumber;

    /** 6-digit numeric OTP code */
    @Column(name = "otp_code", nullable = false, length = 6)
    private String otpCode;

    /** Timestamp after which this OTP is invalid (createdAt + 5 minutes) */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** Number of failed verification attempts (max 3) */
    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    /** True once the OTP has been successfully verified */
    @Column(name = "verified", nullable = false)
    private Boolean verified = false;

    /** Optional display name provided at registration time */
    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (attemptCount == null) attemptCount = 0;
        if (verified == null) verified = false;
    }
}
