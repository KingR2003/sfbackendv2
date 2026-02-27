package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.OtpResponse;
import com.deliveryapp.backend.dto.SendOtpRequest;
import com.deliveryapp.backend.dto.VerifyOtpRequest;
import com.deliveryapp.backend.exception.InvalidOtpException;
import com.deliveryapp.backend.exception.OtpExpiredException;
import com.deliveryapp.backend.exception.OtpRateLimitException;
import com.deliveryapp.backend.exception.TooManyOtpAttemptsException;
import com.deliveryapp.backend.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Customer (CUSTOMER role) authentication via mobile OTP.
 *
 * POST /api/v1/auth/send-otp   — generate & send 6-digit OTP via AWS SNS
 * POST /api/v1/auth/verify-otp — verify OTP; returns JWT on success
 *
 * Admin authentication is handled by AdminAuthController (/api/v1/admin/auth/**).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private OtpService otpService;

    // ---------------------------------------------------------------
    // POST /api/v1/auth/send-otp
    // ---------------------------------------------------------------

    /**
     * Accepts a mobile number in E.164 format, generates a 6-digit OTP,
     * stores it with a 5-minute expiry, and dispatches it via AWS SNS SMS.
     * The OTP is deliberately NOT returned in the response.
     */
    @PostMapping("/send-otp")
    public ResponseEntity<OtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        return sendOtpInternal(request);
    }

    /**
     * Alias for send-otp — accepts mobile number and dispatches OTP via SNS.
     * Use this as the entry point for new customer registration / first-time login.
     */
    @PostMapping("/register")
    public ResponseEntity<OtpResponse> register(@Valid @RequestBody SendOtpRequest request) {
        return sendOtpInternal(request);
    }

    private ResponseEntity<OtpResponse> sendOtpInternal(SendOtpRequest request) {
        try {
            otpService.sendOtp(request.getMobileNumber());
            return ResponseEntity.ok(
                    new OtpResponse(true, "OTP sent successfully to " + request.getMobileNumber(), 200));

        } catch (OtpRateLimitException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new OtpResponse(false, e.getMessage(), 429));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OtpResponse(false, "Failed to send OTP: " + e.getMessage(), 500));
        }
    }

    // ---------------------------------------------------------------
    // POST /api/v1/auth/verify-otp
    // ---------------------------------------------------------------

    /**
     * Accepts mobile number + OTP code. On success:
     * - Validates OTP (expiry, attempt count, code match)
     * - Finds or auto-creates a CUSTOMER user for the mobile number
     * - Returns a signed JWT token
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<OtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            String token = otpService.verifyOtpAndLogin(request.getMobileNumber(), request.getOtpCode());
            return ResponseEntity.ok(
                    new OtpResponse(true, "Login successful", 200, token));

        } catch (OtpExpiredException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(new OtpResponse(false, e.getMessage(), 410));

        } catch (TooManyOtpAttemptsException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new OtpResponse(false, e.getMessage(), 429));

        } catch (InvalidOtpException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new OtpResponse(false, e.getMessage(), 400));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OtpResponse(false, "Verification failed: " + e.getMessage(), 500));
        }
    }
}
