package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyOtpRequest {

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "\\+[1-9]\\d{6,14}",
        message = "Mobile number must be in E.164 format, e.g. +919876543210"
    )
    private String mobileNumber;

    @NotBlank(message = "OTP code is required")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    private String otpCode;

    /** Optional: user's display name (used if not provided at send-otp step) */
    private String name;
}

