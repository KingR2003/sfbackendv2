package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.LoginResult;
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
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private OtpService otpService;

    /**
     * Entry point for customer registration / first-time login.
     * Generates and sends a 6-digit OTP via AWS SNS SMS.
     */
    @PostMapping("/register")
    public ResponseEntity<OtpResponse> register(@Valid @RequestBody SendOtpRequest request) {
        return sendOtpInternal(request);
    }

    /**
     * Backward compatibility / Internal alias for register.
     */
    @PostMapping("/send-otp")
    public ResponseEntity<OtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        return sendOtpInternal(request);
    }

    private ResponseEntity<OtpResponse> sendOtpInternal(SendOtpRequest request) {
        try {
            otpService.sendOtp(request.getMobileNumber());
            return ResponseEntity.ok(
                    new OtpResponse(HttpStatus.OK.value(), "OTP sent successfully to " + request.getMobileNumber()));

        } catch (OtpRateLimitException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new OtpResponse(HttpStatus.TOO_MANY_REQUESTS.value(), e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OtpResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to send OTP: " + e.getMessage()));
        }
    }

    /**
     * Final step of login / registration. Verifies OTP and returns JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<OtpResponse> login(@Valid @RequestBody VerifyOtpRequest request) {
        return verifyOtpInternal(request);
    }

    /**
     * Backward compatibility alias for login.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<OtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return verifyOtpInternal(request);
    }

    private ResponseEntity<OtpResponse> verifyOtpInternal(VerifyOtpRequest request) {
        try {
            LoginResult result = otpService.verifyOtpAndLogin(
                request.getMobileNumber(),
                request.getOtpCode(),
                request.getClientType());
            return ResponseEntity.ok(
                    new OtpResponse(HttpStatus.OK.value(), "Login successful", result.getToken(), result.isNewUser()));

        } catch (OtpExpiredException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(new OtpResponse(HttpStatus.GONE.value(), e.getMessage()));

        } catch (TooManyOtpAttemptsException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new OtpResponse(HttpStatus.TOO_MANY_REQUESTS.value(), e.getMessage()));

        } catch (InvalidOtpException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new OtpResponse(HttpStatus.BAD_REQUEST.value(), e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OtpResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Verification failed: " + e.getMessage()));
        }
    }
}
