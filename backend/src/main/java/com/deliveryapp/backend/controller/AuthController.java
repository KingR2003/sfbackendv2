package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.LoginResult;
import com.deliveryapp.backend.dto.OtpResponse;
import com.deliveryapp.backend.dto.SendOtpRequest;
import com.deliveryapp.backend.dto.VerifyOtpRequest;
import com.deliveryapp.backend.exception.InvalidOtpException;
import com.deliveryapp.backend.exception.OtpExpiredException;
import com.deliveryapp.backend.exception.OtpRateLimitException;
import com.deliveryapp.backend.exception.TooManyOtpAttemptsException;
import com.deliveryapp.backend.service.OtpService;
import com.deliveryapp.backend.service.TokenService;
import com.deliveryapp.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Customer (CUSTOMER role) authentication via mobile OTP.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserService userService;

    @Autowired
    private com.deliveryapp.backend.repository.UserRepository userRepository;

    /**
     * Entry point for customer registration / first-time login.
     * Generates and sends a 6-digit OTP via AWS SNS SMS.
     */
    @PostMapping("/register")
    public ResponseEntity<OtpResponse> register(@Valid @RequestBody SendOtpRequest request) {
        return handleSignUpFlow(request);
    }

    /**
     * Backward compatibility / Internal alias for register.
     */
    @PostMapping("/send-otp")
    public ResponseEntity<OtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        return handleSignUpFlow(request);
    }

    /**
     * Entry point for customer login.
     * Generates and sends a 6-digit OTP only if the user already exists.
     */
    @PostMapping("/login/send-otp")
    public ResponseEntity<OtpResponse> loginSendOtp(@Valid @RequestBody SendOtpRequest request) {
        return handleLoginFlow(request);
    }

    private ResponseEntity<OtpResponse> handleSignUpFlow(SendOtpRequest request) {
        if (userRepository.findByMobile(request.getMobileNumber()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new OtpResponse(HttpStatus.CONFLICT.value(), "User already exists, please login."));
        }
        return sendOtpInternal(request);
    }

    private ResponseEntity<OtpResponse> handleLoginFlow(SendOtpRequest request) {
        if (userRepository.findByMobile(request.getMobileNumber()).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new OtpResponse(HttpStatus.NOT_FOUND.value(), "Account not found, please sign up."));
        }
        return sendOtpInternal(request);
    }

    private ResponseEntity<OtpResponse> sendOtpInternal(SendOtpRequest request) {
        try {
            otpService.sendOtp(request.getMobileNumber(), request.getName());
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
    public ResponseEntity<OtpResponse> login(@Valid @RequestBody VerifyOtpRequest request, HttpServletRequest httpRequest) {
        return verifyOtpInternal(request, httpRequest);
    }

    /**
     * Backward compatibility alias for login.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<OtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request, HttpServletRequest httpRequest) {
        return verifyOtpInternal(request, httpRequest);
    }

    private ResponseEntity<OtpResponse> verifyOtpInternal(VerifyOtpRequest request, HttpServletRequest httpRequest) {
        try {
            LoginResult result = otpService.verifyOtpAndLogin(
                request.getMobileNumber(),
                request.getOtpCode(),
                request.getClientType(),
                request.getName(),
                httpRequest);
            return ResponseEntity.ok(
                    new OtpResponse(HttpStatus.OK.value(), "Login successful", result.getToken(), result.isNewUser(), result.getName()));

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
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token != null) {
            tokenService.invalidateToken(token);
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(new ApiResponse(200, "Logged out successfully"));
    }

    /**
     * Start phone linking process for an authenticated user.
     */
    @PostMapping("/link-phone/send-otp")
    public ResponseEntity<OtpResponse> linkPhoneSendOtp(@Valid @RequestBody SendOtpRequest request) {
        // Ensure user is authenticated
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new OtpResponse(HttpStatus.UNAUTHORIZED.value(), "User must be logged in to link a phone number."));
        }

        // Check if phone number is already in use
        if (userRepository.findByMobile(request.getMobileNumber()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new OtpResponse(HttpStatus.CONFLICT.value(), "This phone number is already linked to another account."));
        }

        return sendOtpInternal(request);
    }

    /**
     * Verify and finalize phone linking for an authenticated user.
     */
    @PostMapping("/link-phone/verify")
    public ResponseEntity<OtpResponse> linkPhoneVerify(@Valid @RequestBody VerifyOtpRequest request) {
        // Ensure user is authenticated
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new OtpResponse(HttpStatus.UNAUTHORIZED.value(), "User must be logged in to verify a phone number."));
        }

        String identifier = auth.getName(); // Usually email for Google users

        try {
            // 1. Verify OTP
            otpService.verifyOtp(request.getMobileNumber(), request.getOtpCode());

            // 2. Link phone number to user
            userService.updateMobile(identifier, request.getMobileNumber());

            return ResponseEntity.ok(
                    new OtpResponse(HttpStatus.OK.value(), "Phone number linked successfully.", null, false, null));

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
                    .body(new OtpResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Linking failed: " + e.getMessage()));
        }
    }
}
