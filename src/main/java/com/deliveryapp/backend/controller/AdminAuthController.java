package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.AdminRegisterRequest;
import com.deliveryapp.backend.dto.LoginRequest;
import com.deliveryapp.backend.dto.LoginResponse;
import com.deliveryapp.backend.dto.RegisterResponse;
import com.deliveryapp.backend.dto.LoginErrorResponse;
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
 * Registration requires a secret key. Regular CUSTOMER accounts are blocked from logging in here.
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
    // POST /api/v1/admin/auth/register  — ADMIN registration only
    // ---------------------------------------------------------------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AdminRegisterRequest registerRequest) {
        try {
            // 1. Validate secret key — blocks unauthorised admin account creation
            if (!ADMIN_SECRET_KEY.equals(registerRequest.getSecretKey())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new RegisterResponse(false, "Invalid admin secret key", 403));
            }

            // 2. Parameterised duplicate-email check (SQL-injection safe)
            if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new RegisterResponse(false, "Email already registered", 409));
            }

            // 3. Create admin user — role is always ADMIN regardless of request body
            User newAdmin = new User();
            newAdmin.setName(registerRequest.getName());
            newAdmin.setEmail(registerRequest.getEmail());
            newAdmin.setMobile(registerRequest.getMobile());
            newAdmin.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            newAdmin.setRole("ADMIN");
            newAdmin.setIsActive(true);

            userRepository.save(newAdmin);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new RegisterResponse(true, "Admin registered successfully", 201));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new RegisterResponse(false, "An error occurred: " + e.getMessage(), 500));
        }
    }

    // ---------------------------------------------------------------
    // POST /api/v1/admin/auth/login  — ADMIN login only
    // ---------------------------------------------------------------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest,
                                   HttpServletRequest request) {
        try {
            // 1. Authenticate credentials via Spring Security
            org.springframework.security.core.Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 2. Load user from DB using parameterised repository (SQL-injection safe)
            Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new LoginErrorResponse(false, "User not found", 401));
            }

            User user = userOpt.get();

            // 3. Block CUSTOMER accounts from using this admin endpoint
            if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new LoginErrorResponse(false,
                                "Access denied: this endpoint is for admins only", 403));
            }

            // 4. Generate JWT with role embedded
            String token = jwtUtil.generateToken(loginRequest.getEmail(), user.getRole());

            // 5. Persist token records
            persistToken(user, token, request);

            return ResponseEntity.ok(new LoginResponse(token, "Admin login successful"));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginErrorResponse(false, "Invalid email or password", 401));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new LoginErrorResponse(false, "An error occurred: " + e.getMessage(), 500));
        }
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    private void persistToken(User user, String token, HttpServletRequest request) {
        Token tokenEntity = new Token();
        tokenEntity.setUserId(user.getId());
        tokenEntity.setAccessToken(token);
        tokenEntity.setIpAddress(getClientIpAddress(request));
        tokenEntity.setIssuedAt(LocalDateTime.now());
        tokenEntity.setExpiresAt(LocalDateTime.now().plusHours(24));
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
