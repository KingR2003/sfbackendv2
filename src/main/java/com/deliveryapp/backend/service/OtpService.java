package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.LoginResult;

/**
 * Business logic for mobile OTP generation, storage, and verification.
 */
public interface OtpService {

    /**
     * Generate a 6-digit OTP, store it with 5-minute expiry, and send via SNS.
     *
     * @param mobileNumber E.164 formatted mobile number
     */
    void sendOtp(String mobileNumber);

    /**
     * Verify the OTP and return a JWT token on success.
     * Creates a new CUSTOMER user if none exists for this mobile number.
     *
     * @param mobileNumber E.164 formatted mobile number
     * @param otpCode      6-digit OTP supplied by the user
     * @return LoginResult containing JWT token and isNewUser flag
     */
    LoginResult verifyOtpAndLogin(String mobileNumber, String otpCode);
}
