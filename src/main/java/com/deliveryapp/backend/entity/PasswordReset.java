package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PasswordReset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email_otp_id")
    private Long emailOtpId;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "attempt_count")
    private Integer attemptCount;

    @Column(name = "ip_address")
    private String ipAddress;
}
