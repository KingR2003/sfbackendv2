package com.deliveryapp.backend.controller;

import com.deliveryapp.backend.dto.LoginRequest;
import com.deliveryapp.backend.dto.LoginResponse;
import com.deliveryapp.backend.dto.RegisterRequest;
import com.deliveryapp.backend.dto.ApiResponse;
import com.deliveryapp.backend.dto.RegisterResponse;
import com.deliveryapp.backend.dto.LoginErrorResponse;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.entity.Token;
import com.deliveryapp.backend.entity.ActiveToken;
import com.deliveryapp.backend.service.UserService;
import com.deliveryapp.backend.repository.TokenRepository;
import com.deliveryapp.backend.repository.ActiveTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private org.springframework.security.authentication.AuthenticationManager authenticationManager;

    @Autowired
    private com.deliveryapp.backend.security.JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private ActiveTokenRepository activeTokenRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = jwtUtil.generateToken(loginRequest.getEmail());

            // Get user by email
            java.util.List<User> users = userService.getAllUsers();
            Optional<User> userOpt = users.stream()
                    .filter(u -> u.getEmail().equals(loginRequest.getEmail()))
                    .findFirst();

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Save token to tokens table
                Token tokenEntity = new Token();
                tokenEntity.setUserId(user.getId());
                tokenEntity.setAccessToken(token);
                tokenEntity.setIpAddress(getClientIpAddress(request));
                tokenEntity.setIssuedAt(LocalDateTime.now());
                tokenEntity.setExpiresAt(LocalDateTime.now().plusHours(24));
                tokenEntity.setCreatedAt(LocalDateTime.now());
                
                Token savedToken = tokenRepository.save(tokenEntity);
                
                // Save to active_tokens table
                ActiveToken activeToken = new ActiveToken();
                activeToken.setUserId(user.getId());
                activeToken.setTokenId(savedToken.getId());
                activeToken.setIsActive(true);
                activeToken.setLastUsedAt(LocalDateTime.now());
                activeToken.setCreatedAt(LocalDateTime.now());
                
                activeTokenRepository.save(activeToken);
            }

            LoginResponse response = new LoginResponse(
                    token,
                    "Login successful");

            return ResponseEntity.ok(response);

        } catch (org.springframework.security.core.AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginErrorResponse(false, "Invalid email or password", 401));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new LoginErrorResponse(false, "An error occurred: " + e.getMessage(), 500));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            // Check if email already exists
            java.util.List<User> users = userService.getAllUsers();
            boolean emailExists = users.stream()
                    .anyMatch(u -> u.getEmail().equals(registerRequest.getEmail()));

            if (emailExists) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new RegisterResponse(false, "Email already registered", 409));
            }

            // Create new user
            User newUser = new User();
            newUser.setName(registerRequest.getName());
            newUser.setEmail(registerRequest.getEmail());
            newUser.setMobile(registerRequest.getMobile());
            newUser.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            newUser.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : "CUSTOMER");
            newUser.setIsActive(true);
            // newUser.setCreatedAt(LocalDateTime.now());
            // newUser.setUpdatedAt(LocalDateTime.now());

            userService.createUser(newUser);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new RegisterResponse(true, "User registered successfully", 201));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new RegisterResponse(false, "An error occurred: " + e.getMessage(), 500));
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
