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
     * @param name         Optional display name (stored on first-time registration)
     */
    void sendOtp(String mobileNumber, String name);

    /**
     * Verify the OTP and return a JWT token on success.
     * Creates a new CUSTOMER user if none exists for this mobile number.
     *
     * @param mobileNumber E.164 formatted mobile number
     * @param otpCode      6-digit OTP supplied by the user
     * @param clientType   The type of client (MOBILE or WEBSITE)
     * @param name         Optional display name passed at registration
     * @return LoginResult containing JWT token, isNewUser flag, and user's name
     */
    LoginResult verifyOtpAndLogin(String mobileNumber, String otpCode, String clientType, String name);
}
