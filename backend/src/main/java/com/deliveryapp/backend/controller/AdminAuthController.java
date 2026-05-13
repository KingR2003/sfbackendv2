package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.AdminRegisterRequest;
import com.deliveryapp.backend.dto.LoginRequest;
import com.deliveryapp.backend.dto.LoginResponse;
import com.deliveryapp.backend.dto.ForgotPasswordRequest;
import com.deliveryapp.backend.dto.ResetPasswordRequest;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.entity.Token;
import com.deliveryapp.backend.entity.ActiveToken;
import com.deliveryapp.backend.entity.PasswordResetToken;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.repository.TokenRepository;
import com.deliveryapp.backend.repository.ActiveTokenRepository;
import com.deliveryapp.backend.repository.PasswordResetTokenRepository;
import com.deliveryapp.backend.security.JwtUtil;
import com.deliveryapp.backend.service.EmailService;
import com.deliveryapp.backend.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Admin authentication endpoint.
 * Registration requires a secret key. Regular CUSTOMER accounts are blocked
 * from logging in here.
 */
@RestController
@RequestMapping("/api/v1/admin/auth")
public class AdminAuthController {

    /** Hardcoded admin registration secret key. */
    private static final String ADMIN_SECRET_KEY = "asd456";

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.admin-frontend-url:http://localhost:5173}")
    private String adminFrontendUrl;

    // ---------------------------------------------------------------
    // POST /api/v1/admin/auth/register — ADMIN registration only
    // ---------------------------------------------------------------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AdminRegisterRequest registerRequest) {
        try {
            // Manual validation
            if (registerRequest.getName() == null || registerRequest.getName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Name is required"));
            }
            if (registerRequest.getEmail() == null || registerRequest.getEmail().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Email is required"));
            }
            if (registerRequest.getMobile() == null || registerRequest.getMobile().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Mobile is required"));
            }
            if (registerRequest.getPassword() == null || registerRequest.getPassword().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Password is required"));
            }
            if (registerRequest.getSecretKey() == null || registerRequest.getSecretKey().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Secret key is required"));
            }
            
            // 1. Validate secret key — blocks unauthorised admin account creation
            if (!ADMIN_SECRET_KEY.equals(registerRequest.getSecretKey())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(403, "Invalid admin secret key"));
            }

            // 2. Duplicate-email check
            if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ApiResponse(409, "Email already registered"));
            }

            // 3. Duplicate-mobile check
            if (userRepository.findByMobile(registerRequest.getMobile()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ApiResponse(409, "Mobile number already registered"));
            }

            // 4. Create admin user — role is always ADMIN regardless of request body
            User newAdmin = new User();
            newAdmin.setName(registerRequest.getName());
            newAdmin.setEmail(registerRequest.getEmail());
            newAdmin.setMobile(registerRequest.getMobile());
            newAdmin.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            newAdmin.setRole("ADMIN");
            newAdmin.setActive(true);
            newAdmin.setStatus("PENDING");

            userRepository.save(newAdmin);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse(201, "Admin registered successfully. Your account is pending approval by an administrator."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
        }
    }

    // ---------------------------------------------------------------
    // POST /api/v1/admin/auth/login — ADMIN login only
    // ---------------------------------------------------------------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest,
            HttpServletRequest request) {
        try {
            // Manual validation
            if (loginRequest.getEmail() == null || loginRequest.getEmail().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Email is required"));
            }
            if (loginRequest.getPassword() == null || loginRequest.getPassword().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Password is required"));
            }
            
            // 1. Load user from DB FIRST to check status before authentication
            Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse(401, "Invalid email or password"));
            }

            User user = userOpt.get();

            // 2. Block CUSTOMER accounts from using this admin endpoint
            if ("CUSTOMER".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(403, "Access denied: this endpoint is for admins only"));
            }

            // 3. Check account status BEFORE authentication attempt
            if ("PENDING".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(403, "Your account is pending approval. Please contact administrator to approve your account."));
            }

            if ("BLOCKED".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(403, "Your account has been blocked. Please contact administrator."));
            }

            // For INACTIVE status, return generic error for security (don't reveal account exists)
            if (!user.isActive() || "INACTIVE".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse(401, "User doesn't exist or invalid credentials"));
            }

            // 4. Now authenticate credentials via Spring Security
            org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 5. Generate JWT with role and clientType embedded
            String clientType = loginRequest.getClientType();
            String token = jwtUtil.generateToken(loginRequest.getEmail(), user.getRole(), clientType);

            // 6. Persist token records
            tokenService.persistToken(user, token, clientType, request);

            return ResponseEntity.ok((Object) new LoginResponse(user.getEmail(), token, "Admin login successful", 200));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(401, "Invalid email or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
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

    // ---------------------------------------------------------------
    // POST /api/v1/admin/auth/forgot-password
    // Sends a reset link to the admin's registered email
    // ---------------------------------------------------------------
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

            // Always return 200 even if email not found (security best practice - prevents email enumeration)
            if (userOpt.isEmpty() || !"ADMIN".equalsIgnoreCase(userOpt.get().getRole())) {
                return ResponseEntity.ok(new ApiResponse(200,
                        "If this email is registered, a password reset link has been sent."));
            }

            User admin = userOpt.get();

            // Delete any existing token for this user (only one active reset at a time)
            passwordResetTokenRepository.deleteByUserId(admin.getId());

            // Create new token
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(UUID.randomUUID().toString());
            resetToken.setUser(admin);
            passwordResetTokenRepository.save(resetToken);

            // Build the reset URL the admin will click
            String resetLink = adminFrontendUrl + "/reset-password?token=" + resetToken.getToken();

            // Send the email
            emailService.sendPasswordResetEmail(admin.getEmail(), admin.getName(), resetLink);

            return ResponseEntity.ok(new ApiResponse(200,
                    "If this email is registered, a password reset link has been sent."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
        }
    }

    // ---------------------------------------------------------------
    // POST /api/v1/admin/auth/reset-password
    // Verifies the token and updates the admin's password
    // ---------------------------------------------------------------
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByToken(request.getToken());

            if (tokenOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Invalid or expired password reset link."));
            }

            PasswordResetToken resetToken = tokenOpt.get();

            if (resetToken.isExpired()) {
                passwordResetTokenRepository.delete(resetToken);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse(400, "Password reset link has expired. Please request a new one."));
            }

            // Update the admin's password
            User admin = resetToken.getUser();
            admin.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(admin);

            // Delete the token so it cannot be reused
            passwordResetTokenRepository.delete(resetToken);

            return ResponseEntity.ok(new ApiResponse(200, "Password reset successfully. You can now log in with your new password."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
        }
    }
}
