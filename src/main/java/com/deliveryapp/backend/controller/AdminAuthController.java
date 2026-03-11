package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.AdminRegisterRequest;
import com.deliveryapp.backend.dto.LoginRequest;
import com.deliveryapp.backend.dto.LoginResponse;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.entity.Token;
import com.deliveryapp.backend.entity.ActiveToken;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.repository.TokenRepository;
import com.deliveryapp.backend.repository.ActiveTokenRepository;
import com.deliveryapp.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Optional;

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
    private TokenRepository tokenRepository;

    @Autowired
    private ActiveTokenRepository activeTokenRepository;

    // ---------------------------------------------------------------
    // POST /api/v1/admin/auth/register — ADMIN registration only
    // ---------------------------------------------------------------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AdminRegisterRequest registerRequest) {
        try {
            // 1. Validate secret key — blocks unauthorised admin account creation
            if (!ADMIN_SECRET_KEY.equals(registerRequest.getSecretKey())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(403, "Invalid admin secret key"));
            }

            // 2. Parameterised duplicate-email check (SQL-injection safe)
            if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ApiResponse(409, "Email already registered"));
            }

            // 3. Create admin user — role is always ADMIN regardless of request body
            User newAdmin = new User();
            newAdmin.setName(registerRequest.getName());
            newAdmin.setEmail(registerRequest.getEmail());
            newAdmin.setMobile(registerRequest.getMobile());
            newAdmin.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            newAdmin.setRole("ADMIN");
            newAdmin.setActive(false);
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
            // 1. Authenticate credentials via Spring Security
            org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 2. Load user from DB using parameterised repository (SQL-injection safe)
            Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse(401, "User not found"));
            }

            User user = userOpt.get();

            // 3. Block CUSTOMER accounts from using this admin endpoint
            if ("CUSTOMER".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(403, "Access denied: this endpoint is for admins only"));
            }

            if ("PENDING".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(403, "Your account is pending approval by an administrator."));
            }

            if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(403, "Your account is currently inactive."));
            }

            // 4. Generate JWT with role and clientType embedded
            String clientType = loginRequest.getClientType();
            String token = jwtUtil.generateToken(loginRequest.getEmail(), user.getRole(), clientType);

            // 5. Persist token records
            persistToken(user, token, clientType, request);

            return ResponseEntity.ok((Object) new LoginResponse(user.getEmail(), token, "Admin login successful", 200));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(401, "Invalid email or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(500, "An error occurred: " + e.getMessage()));
        }
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    private void persistToken(User user, String token, String clientType, HttpServletRequest request) {
        Token tokenEntity = new Token();
        tokenEntity.setUserId(user.getId());
        tokenEntity.setAccessToken(token);
        tokenEntity.setIpAddress(getClientIpAddress(request));
        tokenEntity.setIssuedAt(LocalDateTime.now());
        
        // Use client-specific expiration for DB persistence
        long expMs = "WEBSITE".equalsIgnoreCase(clientType) ? 12L * 60 * 60 * 1000 : 
                     "ADMIN_WEB".equalsIgnoreCase(clientType) ? 12L * 60 * 60 * 1000 : // 12 hours absolute
                     5L * 24 * 60 * 60 * 1000; // Mobile
        
        tokenEntity.setExpiresAt(LocalDateTime.now().plusNanos(expMs * 1_000_000));
        tokenEntity.setCreatedAt(LocalDateTime.now());
        Token savedToken = tokenRepository.save(tokenEntity);

        ActiveToken activeToken = new ActiveToken();
        activeToken.setUserId(user.getId());
        activeToken.setTokenId(savedToken.getId());
        activeToken.setIsActive(true);
        activeToken.setLastUsedAt(LocalDateTime.now());
        activeToken.setCreatedAt(LocalDateTime.now());
        activeTokenRepository.save(activeToken);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
